import {
  Injectable,
  UnauthorizedException,
  ForbiddenException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../../database/prisma/prisma.service";
import { AuditService } from "../../audit/services/audit.service";
import { LoginDto } from "../dto/login.dto";
import { UserMapper } from "../../users/mappers/user.mapper";

interface JwtPayload {
  sub: string;
  organizationId: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService
  ) {}

  async login(loginDto: LoginDto, requestId?: string): Promise<{
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: string;
    user: ReturnType<typeof UserMapper.toResponse>;
  }> {
    const user = await this.prisma.user.findFirst({
      where: { email: loginDto.email }
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash
    );
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException("User is not active");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      actorUserId: user.id,
      actionType: "auth.login",
      entityType: "User",
      entityId: user.id,
      metadata: { requestId, email: user.email }
    });

    const payload: JwtPayload = {
      sub: user.id,
      organizationId: user.organizationId,
      email: user.email
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const expiresIn = this.configService.get<string>("auth.jwtExpiresIn", "1d");

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn,
      user: UserMapper.toResponse(user)
    };
  }

  async me(userId: string): Promise<ReturnType<typeof UserMapper.toResponse>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return UserMapper.toResponse(user);
  }
}
