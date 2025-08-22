# Disable Page Visibility

**Disable Page Visibility** is a Chrome extension that prevents websites from detecting when you switch tabs or minimize the browser window. It stops the use of the `Page Visibility API`, ensuring that websites can't detect changes in the visibility of the browser tab.

## Features

- Disables the `visibilitychange` event to prevent tab switching detection.
- Blocks the `webkitvisibilitychange` event for broader browser compatibility.
- **Selectively prevents** `blur` and `focus` events - blocks window-level events while preserving form functionality.
- **Maintains website compatibility** - form inputs, comment submission, and interactive elements work normally.
- **Fixes issues** with sites like bilibili.com where comment submission was previously broken.
- **New Popup Interface:** A dedicated popup for the extension allows you to easily enable or disable the functionality for the current website.
- **Site-Specific Control:** The extension remembers your preference for each website, automatically applying your chosen setting when you revisit a site.

## Installation

This extension is built with TypeScript and Webpack. To install it in Chrome:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ThomasNHoang/disable-page-visibility.git
    cd disable-page-visibility
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Build the extension:**
    ```bash
    npm run build
    ```
    This will compile the TypeScript code and bundle all necessary assets into the `dist` folder.
4.  **Load in Chrome:**
    - Open Chrome and navigate to `chrome://extensions`.
    - Enable **Developer mode** in the top right corner.
    - Click on **Load unpacked** and select the newly created `dist` directory.
5.  The extension will now be active in your browser!

## License

This project is licensed under the **GNU Affero General Public License v3.0**. You can redistribute it and/or modify it under the terms of the AGPL.

For more details, see the [full AGPL v3.0 license](https://www.gnu.org/licenses/agpl-3.0.txt).

## Attribution

- Original code by **Marvin Schopf** (2021).
- Modified by **Thomas Hoang** (2025) for **Chrome Manifest V3** compatibility and feature enhancements.

## How It Works

The extension operates by injecting a content script (`disable.js`) into all compatible web pages. This script uses **selective event blocking** to maintain privacy while preserving website functionality:

- **Always blocks** `visibilitychange` and `webkitvisibilitychange` events (pure tab switching detection)
- **Selectively blocks** `blur` and `focus` events - only when they target the window/document, not form elements
- **Preserves** focus/blur events on interactive elements like inputs, textareas, buttons, links, and contenteditable elements
- **Maintains compatibility** with modern web applications using ARIA roles and focusable elements

This approach ensures that websites like bilibili.com can properly handle comment submission and form interactions while still preventing tab switching detection.

The extension manages two types of data storage:

- **Temporary Tab State (`chrome.storage.session`):** For each open tab, the extension temporarily stores whether the `disable.js` script has been successfully injected and is active. This data is specific to the current browsing session and is automatically **cleared when the browser is closed or restarted**. This ensures a fresh state for all tabs upon a new session.
- **Persistent Site Preferences (`chrome.storage.local`):** The extension also remembers your chosen "enabled" or "disabled" preference for specific websites. This data is stored persistently using `chrome.storage.local` and **survives browser restarts**. To optimize storage, a preference is only explicitly saved if you choose to _disable_ the extension for a particular site; the default behavior is always "enabled."

By using selective event blocking during the capture phase, the extension effectively prevents websites from detecting when you switch tabs while maintaining full UI functionality for legitimate web application features.

## Support

If you have any issues or suggestions, please open an issue or submit a pull request on the GitHub repository.  
For further questions or support, feel free to reach out to **contact@thomashoang.dev**.
