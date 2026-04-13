import { registerAs } from "@nestjs/config";

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
}

export const authConfig = registerAs(
  "auth",
  (): AuthConfig => ({
    jwtSecret: process.env.JWT_SECRET ?? "dev-only-super-secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d"
  })
);

