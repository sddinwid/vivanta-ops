import { createHash } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { StorageService } from "../../../infrastructure/storage/storage.service";

@Injectable()
export class DocumentStorageService {
  constructor(private readonly storageService: StorageService) {}

  async storeFile(input: {
    fileName: string;
    mimeType?: string;
    buffer: Buffer;
  }): Promise<{ storageKey: string; absolutePath: string; checksumSha256: string }> {
    const stored = await this.storageService.saveFile(input);
    const checksumSha256 = createHash("sha256")
      .update(input.buffer)
      .digest("hex");
    return {
      ...stored,
      checksumSha256
    };
  }

  async resolveForDownload(storageKey: string): Promise<{
    storageKey: string;
    absolutePath: string;
  }> {
    const resolved = await this.storageService.resolveFile(storageKey);
    if (!resolved) {
      throw new NotFoundException("Stored file was not found");
    }
    return resolved;
  }
}

