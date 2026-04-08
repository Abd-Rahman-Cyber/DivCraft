# DivCraft
A browser extension that captures DOM elements and converts them into structured HTML/CSS with interactive selection and preview.

# DivCraft - Browser Extension

This project is a browser extension built with React and Vite.

## How to load the extension in Chrome

1.  **Build the project**:
    Run the following commands in your terminal:
    ```bash
    npm install
    npm run build
    ```
    *Note: This creates a **`dist`** folder (this is your extension folder).*

2.  **Development Mode (Optional)**:
    If you want the extension to update automatically as you change code, run:
    ```bash
    npm run watch
    ```

3.  **Open Chrome Extensions**:
    Go to `chrome://extensions/` in your browser.

4.  **Enable Developer Mode**:
    Toggle the "Developer mode" switch in the top right corner.

5.  **Load Unpacked**:
    Click the "Load unpacked" button and select the **`dist`** folder in this project directory.

## How to use the extension

1.  **Open any website**: Go to any page you want to inspect (e.g., [google.com](https://google.com)).
2.  **Click the DivCraft icon**: Click the extension icon in your Chrome toolbar (you might need to pin it first).
3.  **Select an element**: Your cursor will change to a crosshair. Hover over any element and click to select it.
4.  **Edit and Copy**: A new tab will open with the DivCraft editor, showing the extracted code and a live preview.

- **Universal Selection**: Works on any website.
- **Clean Code Extraction**: Get HTML/JSX and CSS instantly.
- **Modern Editor**: Dark-themed split-screen editor with live preview.

