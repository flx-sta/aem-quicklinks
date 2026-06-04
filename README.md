# AEM Quicklinks

Chrome extension for fast navigation between AEM editing environments. One click (or keystroke) to jump between Preview, Editor, Properties, and CRXDE for any content path. Includes an environment switcher for hopping between author instances (cloud, localhost, staging, etc.) while preserving the current page path and protocol.

## Install (Development)

1. Clone this repo
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the Vite dev server
4. Open your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Firefox: `about:debugging#/runtime/this-firefox` (see [Firefox](#firefox) below for installing unsigned XPIs)
5. Enable **Developer mode**
6. Click **Load Unpacked** (or **Load Temporary Add-on**) and select the generated `dist` directory.

## Keyboard Shortcuts

**Alt+A** opens the popup globally (rebind in `chrome://extensions/shortcuts`).

Inside the popup:

| Key     | Action                                               |
| ------- | ---------------------------------------------------- |
| `P`     | Preview                                              |
| `E`     | Editor                                               |
| `R`     | Properties                                           |
| `C`     | CRXDE                                                |
| `D`     | Switch to Environment tab                            |
| `N`     | Switch to Navigate tab                               |
| `1`-`9` | Pick a quick link or environment (context-dependent) |

## Environment Switching

Configure domain groups in **Settings** (gear icon or right-click the extension > Options):

- **Regex pattern** — matched against the full page URL (e.g. `/content/mysite`)
- **Domains** — list of hosts for that content (e.g. `localhost:4502`, `https://author-p123-e456.adobeaemcloud.com`)

## Distribution & Production Build

To build the extension for installation (so it's not just a temporary developer load), you can package it into a ZIP file.

### 1. Build the package

Run the following command in the terminal:

```bash
npm run build
```

This will create a `dist/aem-quicklinks.zip` file.

### 2. Permanent Installation

#### Chrome / Microsoft Edge

The most "permanent" way to install an extension is via the official web stores.

- **Chrome Web Store**: Upload the generated `dist/aem-quicklinks.zip` to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
- **Edge Add-ons**: Upload the same ZIP to the [Microsoft Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview).

_Note: For private use without the store, you can keep the extension loaded via "unpacked," but it will remain in developer mode._

#### Firefox

Firefox generally requires extensions to be signed by Mozilla to be installed permanently.

1. Submit the `dist/aem-quicklinks.zip` to [AMO (Add-ons for Firefox)](https://addons.mozilla.org/en-US/developers/addon/submit/distribution).
2. Choose "On your own" if you want to distribute it privately.
3. Once signed, you will receive an `.xpi` file that can be installed in any Firefox browser.

**Testing Unsigned XPIs in Firefox**
If you want to install an unsigned `.xpi` file without submitting to AMO, you must use **Firefox Developer Edition** or **Firefox Nightly**:

1. Open Firefox Developer Edition or Nightly.
2. Navigate to `about:config`.
3. Accept the risk warning.
4. Search for `xpinstall.signatures.required` and toggle it to `false`.
5. You can now drag and drop the `.xpi` (or rename the `.zip` to `.xpi`) into the browser to install it permanently without a signature.

## Icons (Required for Stores)

Before submitting to stores, ensure you create an `icons/` folder and add:

- `icon16.png`
- `icon48.png`
- `icon128.png` (Crucial for the store listing)
