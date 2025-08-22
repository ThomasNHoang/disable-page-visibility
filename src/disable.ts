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

function preventFocusBlurEvent(event: Event) {
  // Only block focus/blur events that target the window or document
  // Allow focus/blur events on form elements and other interactive elements
  const target = event.target;
  
  // Allow events on form elements that need focus/blur for proper functionality
  if (target && target !== window && target !== document) {
    const element = target as Element;
    
    // Allow focus/blur on interactive elements
    const interactiveTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];
    if (interactiveTags.includes(element.tagName)) {
      return; // Don't block the event
    }
    
    // Allow focus/blur on elements with contenteditable
    if (element.hasAttribute('contenteditable')) {
      return; // Don't block the event
    }
    
    // Allow focus/blur on elements with tabindex (focusable elements)
    if (element.hasAttribute('tabindex')) {
      return; // Don't block the event
    }
    
    // Allow focus/blur on elements that are typically focusable
    const focusableSelectors = [
      '[role="button"]',
      '[role="textbox"]', 
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="menu"]',
      '[role="menuitem"]'
    ];
    
    for (const selector of focusableSelectors) {
      if (element.matches(selector)) {
        return; // Don't block the event
      }
    }
  }
  
  // Block the event if it's targeting window/document or non-interactive elements
  event.stopImmediatePropagation();
}

// Always block page visibility events as they are purely for tab switching detection
const visibilityEvents = ['visibilitychange', 'webkitvisibilitychange'];
visibilityEvents.forEach((eventType) => {
  window.addEventListener(eventType, preventEvent, true);
});

// Selectively block focus/blur events to preserve form functionality
const focusBlurEvents = ['blur', 'focus'];
focusBlurEvents.forEach((eventType) => {
  window.addEventListener(eventType, preventFocusBlurEvent, true);
});
