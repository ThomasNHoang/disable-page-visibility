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

function preventEvent(event: Event) {
  event.stopImmediatePropagation();
}

// List of events to block
const eventsToBlock = [
  'visibilitychange',
  'webkitvisibilitychange',
  'blur',
  'focus',
];

// Add event listeners for each event
eventsToBlock.forEach((eventType) => {
  window.addEventListener(eventType, preventEvent, true);
});
