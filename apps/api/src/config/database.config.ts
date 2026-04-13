import { registerAs } from "@nestjs/config";

export interface DatabaseConfig {
  url: string;
}

export const databaseConfig = registerAs(
  "database",
  (): DatabaseConfig => ({
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/vivanta_ops?schema=public"
  })
);

