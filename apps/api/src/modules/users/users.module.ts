import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AccessModule } from "../access/access.module";
import { AuditModule } from "../audit/audit.module";
import { UsersController } from "./controllers/users.controller";
import { UserMapper } from "./mappers/user.mapper";
import { UsersRepository } from "./repositories/users.repository";
import { UsersService } from "./services/users.service";

@Module({
  imports: [PrismaModule, AccessModule, AuditModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    UserMapper,
    JwtAuthGuard,
    PermissionsGuard
  ],
  exports: [UsersService, UsersRepository]
})
export class UsersModule {}
