type Message = {
  mode: 'toggle' | 'state';
  tab: {
    id?: number;
    url?: string;
  };
};

async function inject(tabId: number): Promise<void> {
  try {
    await setTabState(tabId, true);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['disable.js'],
    });
  } catch (error) {
    console.error('Failed to inject script:', error);
  }
}

async function disable(tabId: number): Promise<void> {
  try {
    await setTabState(tabId, false);
    await chrome.tabs.reload(tabId);
  } catch (error) {
    console.error('Failed to disable tab:', error);
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
 * This function is optimized to save storage space by only storing the state
 * when it is `false`. The default, or assumed, state for any url is `true`.
 *
 * @param url The full URL from which the hostname will be extracted.
 * @param value The desired state for the hostname (`true` for enabled, `false` for disabled).
 * @returns A Promise that resolves once the storage operation is completed
 */
async function setUrlState(url: string, value: boolean): Promise<void> {
  const hostname = new URL(url).hostname;
  if (value === false) {
    try {
      await chrome.storage.local.set({ [hostname]: false });
    } catch (error) {
      console.error(
        `Failed to disable hostname ${hostname} in local storage:`,
        error
      );
      throw error;
    }
  } else {
    try {
      await chrome.storage.local.remove(hostname); // Save Storage
    } catch (error) {
      console.error(
        `Failed to enable hostname ${hostname} in local storage:`,
        error
      );
      throw error;
    }
  }
}

async function getUrlState(url: string): Promise<boolean> {
  const hostname = new URL(url).hostname;
  try {
    const data = await chrome.storage.local.get(hostname);
    return !(hostname in data); // False if exists because default is true and doesn't exist
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
    const tab = message.tab;
    const id = tab.id,
      url = tab.url;

    if (!id || !url) {
      console.error('Missing Url or Id:', tab);
      return;
    }

    if (message.mode === 'toggle') {
      toggle(id, url).then(sendResponse);
    } else {
      getTabState(id).then(sendResponse);
    }

    return true;
  }
);

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    tab.url.startsWith('http')
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
