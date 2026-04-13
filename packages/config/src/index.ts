export type EnvironmentName = "development" | "test" | "staging" | "production";

export interface RuntimeConfig {
  env: EnvironmentName;
}

