export type StorageType = "session" | "local" | "sync";

export default class ChromeStorage<T> {
  private key: string;
  private fallback: T;
  private storageArea: chrome.storage.StorageArea;
  private listeners: Set<(newValue: T | null) => void>;
  private storageListener: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void;
  private areaName: string;

  constructor(key: string, fallback: T, storageType: StorageType = "session") {
    this.key = key;
    this.fallback = fallback;
    this.listeners = new Set();
    this.storageArea = this.getStorageArea(storageType);
    this.areaName = this.getChromeStorageAreaName(storageType);

    this.storageListener = (changes, areaName) => {
      if (
        areaName === this.areaName &&
        changes[this.key]
      ) {
        const newValue = changes[this.key]?.newValue as T | null;
        this.notify(newValue);
      }
    };

    chrome.storage.onChanged.addListener(this.storageListener);
  }

  private getStorageArea(storageType: StorageType): chrome.storage.StorageArea {
    switch (storageType) {
      case "local":
        return chrome.storage.local;
      case "sync":
        return chrome.storage.sync;
      case "session":
      default:
        return chrome.storage.session;
    }
  }

  private getChromeStorageAreaName(storageType: StorageType): string {
    switch (storageType) {
      case "local":
        return "local";
      case "sync":
        return "sync";
      case "session":
      default:
        return "session";
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

export const websites = new ChromeStorage<{ [hostname: string]: boolean }>(
  "websites",
  {},
  "local"
);
