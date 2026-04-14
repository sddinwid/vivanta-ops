import { AiCapability } from "@prisma/client";

export interface AiProviderRequest {
  organizationId: string;
  capability: AiCapability;
  systemPrompt: string;
  userPrompt: string;
  input: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  providerName: string;
  modelName: string;
}

export interface AiProviderResponse {
  output: Record<string, unknown>;
  confidenceScore: number | null;
  latencyMs: number;
  providerMetadata?: Record<string, unknown>;
}

export interface AiProvider {
  run(request: AiProviderRequest): Promise<AiProviderResponse>;
}
