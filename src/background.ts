import { migrate } from "./lib/migration";
import { queueEvent } from "./analytics";
import {
  deleteTabState,
  getTabState,
  getUrlState,
  inject,
  Message,
  setTabState,
  toggle,
} from "./lib/background";
import { EXCLUDED_URLS, MESSAGE_MODES } from "./lib/constants";

chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    if (message.mode === MESSAGE_MODES.LOG_EVENT) {
      queueEvent(message.event);
      return false;
    }

    if (
      message.mode === MESSAGE_MODES.TOGGLE ||
      message.mode === MESSAGE_MODES.GET_STATE
    ) {
      const tab = message.tab;
      const id = tab?.id;
      const url = tab?.url;
      if (!id || !url) {
        console.error("Missing Url or Id:", tab);
        sendResponse(false);
        return false;
      }

      if (message.mode === MESSAGE_MODES.TOGGLE) {
        toggle(id, url)
          .then(sendResponse)
          .catch((error) => {
            console.error("Toggle error:", error);
            sendResponse(false);
          });
      } else if (message.mode === MESSAGE_MODES.GET_STATE) {
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
    !tab.url.startsWith(EXCLUDED_URLS.CHROME_WEBSTORE)
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
