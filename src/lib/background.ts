import { ACTION_TITLES, BlockedEventType, ICON_PATHS } from "./constants";
import { websites } from "./storage";

export type WebsiteStorage = { [hostname: string]: boolean };

export type Message =
  | {
      mode: "toggle" | "state";
      tab: {
        id?: number;
        url?: string;
      };
    }
  | {
      mode: "logEvent";
      event: { type: BlockedEventType; url: string };
    };

export async function inject(tabId: number): Promise<void> {
  try {
    await setTabState(tabId, true);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["disable.js"],
    });
    await chrome.action.setIcon({
      path: ICON_PATHS.ON,
      tabId: tabId,
    });
    await chrome.action.setTitle({
      title: ACTION_TITLES.ON,
      tabId: tabId,
    });
  } catch (error) {
    console.error("Failed to inject script:", error);
  }
}

export async function disable(tabId: number): Promise<void> {
  try {
    await setTabState(tabId, false);
    await chrome.tabs.reload(tabId);
  } catch (error) {
    console.error("Failed to disable tab:", error);
  }
}

export async function setTabState(
  tabId: number,
  value: boolean
): Promise<void> {
  const id = tabId.toString();
  try {
    await chrome.storage.session.set({ [id]: value });
  } catch (error) {
    console.error(
      `Failed to set state for tabId ${id} in session storage:`,
      error
    );
  }
}

export async function getTabState(tabId: number): Promise<boolean> {
  const id = tabId.toString();
  try {
    const data = await chrome.storage.session.get(id);
    if (id in data) {
      return data[id];
    } else {
      return false;
    }
  } catch (error) {
    console.error(`Error getting data for tab ${id}:`, error);
    throw error;
  }
}

export async function deleteTabState(tabId: number): Promise<void> {
  const id = tabId.toString();
  try {
    await chrome.storage.session.remove(id);
  } catch (error) {
    console.error(`Error deleting tab ${id} state:`, error);
  }
}

/**
 * Sets the state of a specific url hostname (eg. www.google.com) in session storage.
 *
 * @param url The full URL from which the hostname will be extracted.
 * @param value The desired state for the hostname (`true` for enabled, `false` for disabled).
 * @returns A Promise that resolves once the storage operation is completed
 */
export async function setUrlState(url: string, value: boolean): Promise<void> {
  const hostname = new URL(url).hostname;
  try {
    const existingWebsites = await websites.get();
    await websites.set({ ...existingWebsites, [hostname]: value });
  } catch (error) {
    console.error(
      `Failed to set hostname ${hostname} to ${value} in local storage:`,
      error
    );
    throw error;
  }
}

export async function getUrlState(url: string): Promise<boolean> {
  const hostname = new URL(url).hostname;
  try {
    const existingWebsites = await websites.get();
    if (hostname in existingWebsites) {
      return existingWebsites[hostname];
    } else {
      await setUrlState(url, true);
      return true;
    }
  } catch (error) {
    console.error(`Error getting data for hostname ${hostname}:`, error);
    throw error;
  }
}

export async function toggle(tabId: number, url: string): Promise<boolean> {
  const isTabEnabled = await getTabState(tabId);
  const newTabState = !isTabEnabled;

  if (newTabState) {
    await inject(tabId);
  } else {
    await disable(tabId);
  }

  const isUrlEnabled = await getUrlState(url);
  if (newTabState !== isUrlEnabled) {
    await setUrlState(url, newTabState);
  }

  return newTabState;
}
