import {
  EXCLUDED_URLS,
  MESSAGE_MODES,
  POPUP_ELEMENT_IDS,
} from "./lib/constants";
import { getCurrentTab, sendMessage, updatePopupUI } from "./lib/popup";
import "./style.css";

async function main() {
  const toggleSwitch = document.getElementById(
    POPUP_ELEMENT_IDS.TOGGLE_SWITCH
  ) as HTMLInputElement;
  const statusTextElement = document.getElementById(
    POPUP_ELEMENT_IDS.STATUS_TEXT
  ) as HTMLDivElement;
  const hostnameElement = document.getElementById(
    POPUP_ELEMENT_IDS.HOSTNAME
  ) as HTMLSpanElement;

  const tab = await getCurrentTab();
  if (!tab) {
    console.error("No active tab found.");
    hostnameElement.textContent = "No page found";
    toggleSwitch.disabled = true;
    updatePopupUI(false, statusTextElement, false);
    return;
  }

  const url = tab.url || tab.pendingUrl;
  if (!url) {
    console.error("No URL found for the current tab.");
    hostnameElement.textContent = "No page found";
    toggleSwitch.disabled = true;
    updatePopupUI(false, statusTextElement, false);
    return;
  }

  hostnameElement.textContent = new URL(url).hostname;

  if (
    !url.startsWith("http") ||
    url.startsWith(EXCLUDED_URLS.CHROME_WEBSTORE)
  ) {
    toggleSwitch.disabled = true;
    updatePopupUI(false, statusTextElement, false);
    return;
  }

  const isEnabled = await sendMessage(MESSAGE_MODES.GET_STATE);
  toggleSwitch.checked = isEnabled;
  updatePopupUI(isEnabled, statusTextElement);

  toggleSwitch.onchange = async () => {
    const newIsEnabledState = await sendMessage(MESSAGE_MODES.TOGGLE);
    updatePopupUI(newIsEnabledState, statusTextElement);
  };
}

document.addEventListener("DOMContentLoaded", main);
