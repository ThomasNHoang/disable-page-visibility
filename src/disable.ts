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

function isInteractiveElement(element: Element): boolean {
  // Check if element or any parent is interactive (for React components)
  let currentElement: Element | null = element;
  
  while (currentElement && currentElement !== document.documentElement) {
    // Standard form elements
    const interactiveTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'IFRAME'];
    if (interactiveTags.includes(currentElement.tagName)) {
      return true;
    }
    
    // Elements with contenteditable (including inherited)
    if (currentElement.hasAttribute('contenteditable')) {
      const contentEditableValue = currentElement.getAttribute('contenteditable');
      if (contentEditableValue === 'true' || contentEditableValue === '') {
        return true;
      }
    }
    
    // Check for inherited contenteditable
    const computedStyle = window.getComputedStyle ? window.getComputedStyle(currentElement) : null;
    if (computedStyle && computedStyle.getPropertyValue('-webkit-user-modify') === 'read-write') {
      return true;
    }
    
    // Elements with tabindex (focusable elements)
    if (currentElement.hasAttribute('tabindex')) {
      return true;
    }
    
    // ARIA roles that indicate interactive elements
    const ariaRole = currentElement.getAttribute('role');
    const interactiveRoles = [
      'button', 'textbox', 'combobox', 'listbox', 'menu', 'menuitem',
      'checkbox', 'radio', 'slider', 'spinbutton', 'searchbox',
      'tab', 'tabpanel', 'option', 'link', 'switch'
    ];
    if (ariaRole && interactiveRoles.includes(ariaRole)) {
      return true;
    }
    
    // Check for React/Vue component patterns
    const className = currentElement.className;
    if (typeof className === 'string') {
      // Common patterns for editable content in React apps
      const editablePatterns = [
        'editor', 'input', 'textarea', 'comment', 'reply', 'edit',
        'contenteditable', 'editable', 'textbox', 'rich-text'
      ];
      for (const pattern of editablePatterns) {
        if (className.toLowerCase().includes(pattern)) {
          return true;
        }
      }
    }
    
    // Check data attributes commonly used in React
    if (currentElement.hasAttribute('data-testid') || 
        currentElement.hasAttribute('data-editable') ||
        currentElement.hasAttribute('data-input') ||
        currentElement.hasAttribute('data-focusable')) {
      return true;
    }
    
    currentElement = currentElement.parentElement;
  }
  
  return false;
}

function preventFocusBlurEvent(event: Event) {
  // Only block focus/blur events that target the window or document
  // Allow focus/blur events on form elements and other interactive elements
  const target = event.target;
  
  // Always allow events on window and document to be blocked
  if (!target || target === window || target === document) {
    event.stopImmediatePropagation();
    return;
  }
  
  const element = target as Element;
  
  // Use enhanced detection for interactive elements
  if (isInteractiveElement(element)) {
    return; // Don't block the event
  }
  
  // Block the event if it's not on an interactive element
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

// Add MutationObserver to handle dynamically added interactive elements
// This is particularly important for React applications with lazy loading
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if the added element or its children are contenteditable
            // This helps with React components that add contenteditable elements dynamically
            if (element.hasAttribute && element.hasAttribute('contenteditable')) {
              // Element is contenteditable, our existing logic will handle it
              return;
            }
            
            // Check children for contenteditable elements
            if (element.querySelectorAll) {
              const editableChildren = element.querySelectorAll('[contenteditable="true"], [contenteditable=""]');
              if (editableChildren.length > 0) {
                // Found contenteditable children, our existing logic will handle them
                return;
              }
            }
          }
        });
      }
      
      // Handle attribute changes (e.g., contenteditable being added/modified)
      if (mutation.type === 'attributes' && mutation.attributeName === 'contenteditable') {
        // Contenteditable attribute was modified, our existing event handlers will pick this up
        return;
      }
    });
  });
  
  // Start observing changes to the document
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['contenteditable', 'role', 'tabindex']
  });
  
  // Also observe changes to the head for cases where React might modify it
  if (document.head) {
    observer.observe(document.head, {
      childList: true,
      subtree: true
    });
  }
}
