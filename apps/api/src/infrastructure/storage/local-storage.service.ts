import { randomUUID } from "node:crypto";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { Injectable } from "@nestjs/common";
import {
  SaveFileInput,
  StorageAdapter,
  StoredFile
} from "./storage.interface";

@Injectable()
export class LocalStorageService implements StorageAdapter {
  private readonly uploadsRoot = join(process.cwd(), "uploads");

  async saveFile(input: SaveFileInput): Promise<StoredFile> {
    await mkdir(this.uploadsRoot, { recursive: true });
    const safeName = this.sanitizeFileName(input.fileName);
    const storageKey = `${randomUUID()}-${safeName}`;
    const absolutePath = join(this.uploadsRoot, storageKey);
    await writeFile(absolutePath, input.buffer);
    return {
      storageKey,
      absolutePath
    };
  }

  async resolveFile(storageKey: string): Promise<StoredFile | null> {
    const absolutePath = join(this.uploadsRoot, storageKey);
    try {
      await stat(absolutePath);
      return { storageKey, absolutePath };
    } catch {
      return null;
    }
  }

  private sanitizeFileName(name: string): string {
    return basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  }
}

