import { Inject, Injectable } from "@nestjs/common";
import { StorageAdapter, STORAGE_ADAPTER } from "./storage.interface";

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: StorageAdapter
  ) {}

  saveFile(input: {
    fileName: string;
    mimeType?: string;
    buffer: Buffer;
  }) {
    return this.storageAdapter.saveFile(input);
  }

  resolveFile(storageKey: string) {
    return this.storageAdapter.resolveFile(storageKey);
  }
}

