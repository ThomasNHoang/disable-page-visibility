import {
  MESSAGE_MODES,
  POPUP_MESSAGES_HTML,
  POPUP_STATUS_CLASSES,
} from './constants';

export async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export async function sendMessage(
  mode: typeof MESSAGE_MODES.TOGGLE | typeof MESSAGE_MODES.GET_STATE
): Promise<boolean> {
  const tab = await getCurrentTab();
  if (!tab?.id || (!tab.url && !tab.pendingUrl)) {
    console.error('sendMessage: Could not get a valid tab.');
    return false;
  }

  return await chrome.runtime.sendMessage({
    mode,
    tab: {
      id: tab.id,
      url: tab.url || tab.pendingUrl,
    },
  });
}

export function updatePopupUI(
  isEnabled: boolean,
  statusTextElement: HTMLDivElement,
  isPageCompatible: boolean = true
) {
  statusTextElement.className = '';
  statusTextElement.classList.add(POPUP_STATUS_CLASSES.VISIBLE);

  if (!isPageCompatible) {
    statusTextElement.innerHTML = POPUP_MESSAGES_HTML.UNAVAILABLE;
    statusTextElement.classList.add(
      POPUP_STATUS_CLASSES.CARD,
      POPUP_STATUS_CLASSES.UNAVAILABLE
    );
    return;
  }

  if (isEnabled) {
    statusTextElement.innerHTML = POPUP_MESSAGES_HTML.ENABLED;
    statusTextElement.classList.add(
      POPUP_STATUS_CLASSES.CARD,
      POPUP_STATUS_CLASSES.ENABLED
    );
  } else {
    statusTextElement.innerHTML = POPUP_MESSAGES_HTML.DISABLED;
    statusTextElement.classList.add(
      POPUP_STATUS_CLASSES.CARD,
      POPUP_STATUS_CLASSES.DISABLED
    );
  }
}
