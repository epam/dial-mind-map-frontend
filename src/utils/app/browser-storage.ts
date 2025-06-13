import { errorsMessages } from '@/constants/errors';
import { StorageKeys } from '@/types/storage';

const isLocalStorageEnabled = () => {
  const testData = 'test';
  try {
    localStorage.setItem(testData, testData);
    localStorage.removeItem(testData);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error(errorsMessages.localStorageQuotaExceeded);
      return true;
    } else {
      return false;
    }
  }
};

export class BrowserStorage {
  private static storage: globalThis.Storage | undefined;

  public static init() {
    if (isLocalStorageEnabled()) {
      BrowserStorage.storage = globalThis.localStorage;
    } else {
      BrowserStorage.storage = globalThis.sessionStorage;
    }
  }

  public static getData<K = undefined>(key: StorageKeys, defaultValue?: K): K | undefined {
    try {
      const value = this.storage!.getItem(key);
      return value === null || value === undefined ? defaultValue : JSON.parse(value);
    } catch (e: unknown) {
      console.error(e);
      if ((e as Error).name === 'QuotaExceededError') {
        console.error(errorsMessages.localStorageQuotaExceeded);
      }
      return defaultValue;
    }
  }

  public static setData<K = unknown>(key: StorageKeys, value: K): void {
    try {
      this.storage!.setItem(key, JSON.stringify(value));
    } catch (e: unknown) {
      console.error(e);
      if ((e as Error).name === 'QuotaExceededError') {
        console.error(errorsMessages.localStorageQuotaExceeded);
      }
    }
  }
}
