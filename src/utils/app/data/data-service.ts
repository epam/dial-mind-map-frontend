import { DialStorage, StorageType } from '@/types/storage';

import { ApiStorage } from './storages/api-storage';
import { BrowserStorage } from './storages/browser-storage';

export class DataService {
  private static dataStorage: DialStorage;

  public static init(storageType?: string) {
    BrowserStorage.init();
    this.setDataStorage(storageType);
  }

  public static getDataStorage(): DialStorage {
    if (!this.dataStorage) {
      this.setDataStorage();
    }
    return this.dataStorage;
  }

  private static setDataStorage(dataStorageType?: string): void {
    switch (dataStorageType) {
      case StorageType.BrowserStorage:
        this.dataStorage = new BrowserStorage();
        break;
      case StorageType.API:
      default:
        this.dataStorage = new ApiStorage();
    }
  }
}
