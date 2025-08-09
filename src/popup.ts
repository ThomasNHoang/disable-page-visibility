import './style.css';

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function sendMessage(mode: 'toggle' | 'state'): Promise<boolean> {
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

function updatePopupUI(
  isEnabled: boolean,
  statusTextElement: HTMLDivElement,
  isPageCompatible: boolean = true
) {
  statusTextElement.className = '';
  statusTextElement.classList.add('visible');

  if (!isPageCompatible) {
    statusTextElement.innerHTML = `
      <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      Unavailable on this page
    `;
    statusTextElement.classList.add('status-card', 'status-unavailable');
    return;
  }

  if (isEnabled) {
    statusTextElement.innerHTML = `
      <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Active: Tab switching is hidden
    `;
    statusTextElement.classList.add('status-card', 'status-enabled');
  } else {
    statusTextElement.innerHTML = `
      <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      Inactive: Tab switching is detectable
    `;
    statusTextElement.classList.add('status-card', 'status-disabled');
  }
}

async function main() {
  const toggleSwitch = document.getElementById(
    'toggleSwitch'
  ) as HTMLInputElement;
  const statusTextElement = document.getElementById(
    'statusText'
  ) as HTMLDivElement;
  const hostnameElement = document.getElementById(
    'currentSiteHostname'
  ) as HTMLSpanElement;

  const tab = await getCurrentTab();
  if (!tab) {
    console.error('No active tab found.');
    hostnameElement.textContent = 'No page found';
    toggleSwitch.disabled = true;
    updatePopupUI(false, statusTextElement, false);
    return;
  }

  const url = tab.url || tab.pendingUrl;
  if (!url) return;

  hostnameElement.textContent = new URL(url).hostname;

  if (!url.startsWith('http')) {
    toggleSwitch.disabled = true;
    updatePopupUI(false, statusTextElement, false);
    return;
  }

  const isEnabled = await sendMessage('state');
  toggleSwitch.checked = isEnabled;
  updatePopupUI(isEnabled, statusTextElement);

  toggleSwitch.onchange = async () => {
    const newIsEnabledState = await sendMessage('toggle');
    updatePopupUI(newIsEnabledState, statusTextElement);
  };
}

document.addEventListener('DOMContentLoaded', main);
