import { Module } from "@nestjs/common";
import { LocalStorageService } from "./local-storage.service";
import { STORAGE_ADAPTER } from "./storage.interface";
import { StorageService } from "./storage.service";

@Module({
  providers: [
    LocalStorageService,
    StorageService,
    {
      provide: STORAGE_ADAPTER,
      useExisting: LocalStorageService
    }
  ],
  exports: [StorageService]
})
export class StorageModule {}

