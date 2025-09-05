import { migrate } from "./migration";
import ChromeStorage, { websites } from "./chromeStorage";
import { queueEvent } from "./analytics";

type Message =
  | {
      mode: "toggle" | "state";
      tab: {
        id?: number;
        url?: string;
      };
    }
  | {
      mode: "logEvent";
      event: { type: string; url: string };
    };

async function inject(tabId: number): Promise<void> {
  try {
    await setTabState(tabId, true);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["disable.js"],
    });
    await chrome.action.setIcon({
      path: {
        16: "icons/on-16.png",
        32: "icons/on-32.png",
      },
      tabId: tabId,
    });
    await chrome.action.setTitle({
      title: "Page Visibility: ON",
      tabId: tabId,
    });
  } catch (error) {
    console.error("Failed to inject script:", error);
  }
}

async function disable(tabId: number): Promise<void> {
  try {
    await setTabState(tabId, false);
    await chrome.tabs.reload(tabId);
  } catch (error) {
    console.error("Failed to disable tab:", error);
  }
}

async function setTabState(tabId: number, value: boolean): Promise<void> {
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

async function getTabState(tabId: number): Promise<boolean> {
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

async function deleteTabState(tabId: number): Promise<void> {
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
async function setUrlState(url: string, value: boolean): Promise<void> {
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

async function getUrlState(url: string): Promise<boolean> {
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

async function toggle(tabId: number, url: string): Promise<boolean> {
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

chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    if (message.mode === "logEvent") {
      queueEvent(message.event);
      return false;
    }

    if (message.mode === "toggle" || message.mode === "state") {
      const tab = message.tab;
      const id = tab?.id;
      const url = tab?.url;
      if (!id || !url) {
        console.error("Missing Url or Id:", tab);
        sendResponse(false);
        return false;
      }

      if (message.mode === "toggle") {
        toggle(id, url)
          .then(sendResponse)
          .catch((error) => {
            console.error("Toggle error:", error);
            sendResponse(false);
          });
      } else if (message.mode === "state") {
        getTabState(id)
          .then((state) => {
            sendResponse(state);
          })
          .catch((error) => {
            console.error("GetTabState error:", error);
            sendResponse(false);
          });
      }
      return true; // Keep the message channel open for async response
    }

    return false;
  }
);

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.startsWith("http") &&
    !tab.url.startsWith("https://chromewebstore.google.com/")
  ) {
    const url = tab.url;
    const isUrlEnabled = await getUrlState(url);

    if (isUrlEnabled) {
      await inject(tabId);
    } else {
      await setTabState(tabId, false);
    }
  }
});

chrome.tabs.onRemoved.addListener(deleteTabState);

chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
  const wasOldTabEnabled = await getTabState(removedTabId);

  await deleteTabState(removedTabId);

  if (!wasOldTabEnabled) {
    await setTabState(addedTabId, false);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  migrate().catch((e) => console.error("Migration failed:", e));
});
