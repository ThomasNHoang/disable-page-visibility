/**
 * -----------------------------------------------------------------------------
 * Constants for Chrome Storage Keys
 * -----------------------------------------------------------------------------
 * Centralizes the keys used for chrome.storage operations.
 */
export const RESERVED_STORAGE_KEYS = {
  METRICS: "metrics",
  WEBSITES: "websites",
  VERSION: "version",
} as const;

export type ReservedStorageKeys = typeof RESERVED_STORAGE_KEYS[keyof typeof RESERVED_STORAGE_KEYS]

/**
 * -----------------------------------------------------------------------------
 * Constants for Blocked Event Types
 * -----------------------------------------------------------------------------
 * A definitive list of DOM events that the extension intercepts.
 * Used in analytics and the content script.
 */
export const BLOCKED_EVENT_TYPES = {
  VISIBILITY_CHANGE: "visibilitychange",
  WEBKIT_VISIBILITY_CHANGE: "webkitvisibilitychange",
  BLUR: "blur",
  FOCUS: "focus",
} as const;

export type BlockedEventType = typeof BLOCKED_EVENT_TYPES[keyof typeof BLOCKED_EVENT_TYPES];

/**
 * -----------------------------------------------------------------------------
 * Constants for Chrome Runtime Messaging
 * -----------------------------------------------------------------------------
 * Defines the modes for messages passed between different parts of the extension.
 */
export const MESSAGE_MODES = {
  TOGGLE: "toggle",
  GET_STATE: "state",
  LOG_EVENT: "logEvent",
} as const;

/**
 * -----------------------------------------------------------------------------
 * Constants for Browser Action UI
 * -----------------------------------------------------------------------------
 * Defines paths for icons and titles for the extension's toolbar button.
 */
export const ICON_PATHS = {
  ON: {
    16: "icons/on-16.png",
    32: "icons/on-32.png",
  },
  OFF: {
    16: "icons/off-16.png",
    32: "icons/off-32.png",
  },
} as const;

export const ACTION_TITLES = {
  ON: "Page Visibility: ON",
  OFF: "Page Visibility: OFF",
} as const;

/**
 * -----------------------------------------------------------------------------
 * Constants for Popup UI Elements
 * -----------------------------------------------------------------------------
 * Maps to element IDs and CSS classes in popup.html for easier DOM manipulation.
 */
export const POPUP_ELEMENT_IDS = {
  TOGGLE_SWITCH: "toggleSwitch",
  STATUS_TEXT: "statusText",
  HOSTNAME: "currentSiteHostname",
} as const;

export const POPUP_STATUS_CLASSES = {
  VISIBLE: "visible",
  CARD: "status-card",
  ENABLED: "status-enabled",
  DISABLED: "status-disabled",
  UNAVAILABLE: "status-unavailable",
} as const;

/**
 * -----------------------------------------------------------------------------
 * Constants for Popup Status Messages (as HTML strings)
 * -----------------------------------------------------------------------------
 * Encapsulates the HTML content for different states shown in the popup.
 */
export const POPUP_MESSAGES_HTML = {
  UNAVAILABLE: `
    <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
    Unavailable on this page
  `,
  ENABLED: `
    <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Active: Tab switching is hidden
  `,
  DISABLED: `
    <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
    Inactive: Tab switching is detectable
  `,
} as const;

/**
 * -----------------------------------------------------------------------------
 * Constants for Application Logic
 * -----------------------------------------------------------------------------
 * Miscellaneous constants used across the application logic.
 */
export const EXCLUDED_URLS = {
  CHROME_WEBSTORE: "https://chromewebstore.google.com/",
} as const;

export const QUEUE_PROCESSING_INTERVAL_MS = 5000;
export const DEDUPLICATION_TIME_WINDOW_MS = 100;
export const MAX_DAILY_ACTIVITY_RECORDS = 30;
export const MIGRATION_BACKUP_PREFIX = "backup_";