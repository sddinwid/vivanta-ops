import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { RequestIdentity } from "../../../common/request-context/request-context.types";

interface JwtPayload {
  sub: string;
  organizationId: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        "auth.jwtSecret",
        "dev-only-super-secret"
      )
    });
  }

  validate(payload: JwtPayload): RequestIdentity {
    return {
      userId: payload.sub,
      organizationId: payload.organizationId,
      email: payload.email
    };
  }
}
