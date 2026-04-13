import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RequestIdentity } from "../../../common/request-context/request-context.types";
import { LoginDto } from "../dto/login.dto";
import { AuthService } from "../services/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: { requestId?: string }
  ): Promise<unknown> {
    return this.authService.login(loginDto, req.requestId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() identity: RequestIdentity): Promise<unknown> {
    return this.authService.me(identity.userId);
  }
}

