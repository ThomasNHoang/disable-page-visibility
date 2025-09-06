export type StorageType = "session" | "local" | "sync";

export default class ChromeStorage<T> {
  private key: string;
  private fallback: T;
  private storageType: StorageType;
  private storageArea: chrome.storage.StorageArea;
  private listeners: Set<(newValue: T | null) => void>;
  private storageListener: (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => void;

  constructor(key: string, fallback: T, storageType: StorageType = "local") {
    this.key = key;
    this.fallback = fallback;
    this.listeners = new Set();
    this.storageType = storageType;
    this.storageArea = this.getStorageArea(storageType);

    this.storageListener = (changes, areaName) => {
      if (areaName === this.storageType && changes[this.key]) {
        const newValue = changes[this.key]?.newValue as T | null;
        this.notify(newValue);
      }
    };

    chrome.storage.onChanged.addListener(this.storageListener);
  }

  private getStorageArea(storageType: StorageType): chrome.storage.StorageArea {
    switch (storageType) {
      case "sync":
        return chrome.storage.sync;
      case "session":
        return chrome.storage.session;
      case "local":
      default:
        return chrome.storage.local;
    }
  }

  get(): Promise<T> {
    return new Promise((resolve) => {
      this.storageArea.get({ [this.key]: this.fallback }, (result) => {
        resolve(result[this.key] as T);
      });
    });
  }

  set(value: T): Promise<void> {
    return new Promise((resolve) => {
      this.storageArea.set({ [this.key]: value }, () => {
        resolve();
      });
    });
  }

  onChange(callback: (newValue: T | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  delete(): Promise<void> {
    return new Promise((resolve) => {
      this.storageArea.remove(this.key, () => {
        this.notify(null);
        resolve();
      });
    });
  }

  private notify(newValue: T | null): void {
    this.listeners.forEach((callback) => callback(newValue));
  }

  dispose(): void {
    chrome.storage.onChanged.removeListener(this.storageListener);
    this.listeners.clear();
  }
}
