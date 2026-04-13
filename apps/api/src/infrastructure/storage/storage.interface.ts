export interface SaveFileInput {
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
}

export interface StoredFile {
  storageKey: string;
  absolutePath: string;
}

export interface StorageAdapter {
  saveFile(input: SaveFileInput): Promise<StoredFile>;
  resolveFile(storageKey: string): Promise<StoredFile | null>;
}

export const STORAGE_ADAPTER = Symbol("STORAGE_ADAPTER");

