import { Injectable, NotFoundException } from "@nestjs/common";
import { AiCapability } from "@prisma/client";
import { CreateProviderConfigDto } from "../dto/create-provider-config.dto";
import { UpdateProviderConfigDto } from "../dto/update-provider-config.dto";
import { AiProviderConfigsRepository } from "../repositories/ai-provider-configs.repository";
import { AiProviderRequest, AiProviderResponse } from "./ai-provider.interface";
import { StubAiProviderService } from "./stub-ai-provider.service";

export class AiCapabilityDisabledError extends Error {
  constructor(public readonly capability: AiCapability) {
    super(`AI execution disabled for capability ${capability}`);
    this.name = "AiCapabilityDisabledError";
  }
}

@Injectable()
export class AiProviderService {
  constructor(
    private readonly stubAiProviderService: StubAiProviderService,
    private readonly aiProviderConfigsRepository: AiProviderConfigsRepository
  ) {}

  listConfigs(organizationId: string) {
    return this.aiProviderConfigsRepository.list(organizationId);
  }

  createConfig(dto: CreateProviderConfigDto) {
    return this.aiProviderConfigsRepository.create({
      organization: dto.organizationId ? { connect: { id: dto.organizationId } } : undefined,
      providerName: dto.providerName,
      modelName: dto.modelName,
      capability: dto.capability,
      isEnabled: dto.isEnabled ?? true,
      settingsJson: dto.settingsJson
    });
  }

  async updateConfig(configId: string, dto: UpdateProviderConfigDto) {
    const existing = await this.aiProviderConfigsRepository.findById(configId);
    if (!existing) {
      throw new NotFoundException("AI provider config not found");
    }

    return this.aiProviderConfigsRepository.update(configId, {
      organization:
        dto.organizationId === null
          ? { disconnect: true }
          : dto.organizationId
            ? { connect: { id: dto.organizationId } }
            : undefined,
      providerName: dto.providerName,
      modelName: dto.modelName,
      capability: dto.capability,
      isEnabled: dto.isEnabled,
      settingsJson: dto.settingsJson
    });
  }

  resolvePreferredConfig(organizationId: string, capability: AiCapability) {
    return this.aiProviderConfigsRepository.findPreferredConfig(
      organizationId,
      capability
    );
  }

  resolveEffectiveConfig(organizationId: string, capability: AiCapability) {
    return this.aiProviderConfigsRepository.findEffectiveConfig(organizationId, capability);
  }

  async isCapabilityEnabled(organizationId: string, capability: AiCapability): Promise<boolean> {
    const config = await this.resolveEffectiveConfig(organizationId, capability);
    // No config means "use fallback behavior" (current behavior is stub fallback).
    if (!config) {
      return true;
    }
    return Boolean(config.isEnabled);
  }

  run(request: AiProviderRequest): Promise<AiProviderResponse> {
    return this.isCapabilityEnabled(request.organizationId, request.capability).then((enabled) => {
      if (!enabled) {
        throw new AiCapabilityDisabledError(request.capability);
      }
      return this.stubAiProviderService.run(request);
    });
  }
}
