import { registerAs } from "@nestjs/config";

export interface TemporalConfig {
  address: string;
  namespace: string;
}

export const temporalConfig = registerAs(
  "temporal",
  (): TemporalConfig => ({
    address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
    namespace: process.env.TEMPORAL_NAMESPACE ?? "default"
  })
);

