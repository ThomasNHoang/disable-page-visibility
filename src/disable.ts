/**
 * Disable Page Visibility API and Prevent Focus Loss
 * Copyright (C) 2021 Marvin Schopf
 * Modified by Thomas Hoang in 2025
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { BLOCKED_EVENT_TYPES, MESSAGE_MODES } from "./lib/constants";

function preventEvent(event: Event) {
  event.stopImmediatePropagation();

  // Send single event immediately to server-side queue
  try {
    chrome.runtime.sendMessage({
      mode: MESSAGE_MODES.LOG_EVENT,
      event: {
        type: event.type,
        url: window.location.href,
      },
    });
  } catch {
    // Silently ignore extension context errors
  }
}

// List of events to block
const eventsToBlock = Object.values(BLOCKED_EVENT_TYPES);

// Add event listeners for each event
eventsToBlock.forEach((eventType) => {
  window.addEventListener(eventType, preventEvent, true);
});
