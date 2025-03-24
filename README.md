# Disable Page Visibility

**Disable Page Visibility** is a Chrome extension that prevents websites from detecting when you switch tabs or minimize the browser window. It stops the use of the `Page Visibility API`, ensuring that websites can't detect changes in the visibility of the browser tab.

## Features
- Disables the `visibilitychange` event.
- Blocks the `webkitvisibilitychange` event.
- Prevents the `blur` event from firing, making sure websites can't detect when the browser window loses focus.

## Installation

1. Download or clone the repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top right.
4. Click on **Load unpacked** and select the extension's directory.
5. The extension will now be active in your browser.

## License

This project is licensed under the **GNU Affero General Public License v3.0**. You can redistribute it and/or modify it under the terms of the AGPL.

For more details, see the [full AGPL v3.0 license](https://www.gnu.org/licenses/agpl-3.0.txt).

## Attribution

- Original code by **Marvin Schopf** (2021).
- Modified by **Thomas Hoang** (2025) for **Chrome Manifest V3** compatibility.

## How It Works

The extension injects a content script (`disable.js`) into all web pages you visit. This script listens for and stops the propagation of the following events:
- `visibilitychange`
- `webkitvisibilitychange`
- `blur`

By blocking these events using `event.stopImmediatePropagation()`, the extension prevents websites from detecting when you switch tabs or minimize the browser window.

## Support

If you have any issues or suggestions, please open an issue or submit a pull request.  
For further questions or support, feel free to reach out to **contact@thomashoang.dev**.
