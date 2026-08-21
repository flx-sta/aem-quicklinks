import { describe, it, expect, beforeEach, vi } from "vitest";
import { initPopup } from "../src/popup";

describe("Popup Tab Opening and Interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    document.body.innerHTML = `
      <div id="version"></div>
      <div id="status-icon"></div>
      <div id="status-text"></div>
      <div id="path-display" style="display: none;"></div>
      <div class="tab active" data-panel="navigate" id="nav-tab"></div>
      <div class="tab" data-panel="environment" id="env-tab"></div>
      <div class="panel" id="navigate"></div>
      <div class="panel" id="environment" style="display: none;"></div>
      <div id="env-list" style="display: none;"></div>
      <div id="no-env"></div>
      <button id="btn-preview" class="link-btn" disabled></button>
      <button id="btn-editor" class="link-btn" disabled></button>
      <button id="btn-properties" class="link-btn" disabled></button>
      <button id="btn-crxde" class="link-btn" disabled></button>
      <button id="btn-sites" class="link-btn" disabled></button>
      <a id="settings"></a>
      <a id="open-settings"></a>
    `;

    (globalThis as any).chrome = {
      runtime: {
        openOptionsPage: vi.fn(),
      },
      tabs: {
        query: vi.fn((_query, callback) => {
          callback([
            {
              id: 123,
              index: 2,
              url: "https://author-dev.adobeaemcloud.com/editor.html/content/site/page.html",
              cookieStoreId: "firefox-container-1",
            },
          ]);
        }),
        create: vi.fn(),
      },
      storage: {
        sync: {
          get: vi.fn((_keys, callback) => {
            callback({
              domainConfigs: [
                {
                  regex: "author-.*\\.adobeaemcloud\\.com",
                  domains: [
                    "https://author-dev.adobeaemcloud.com",
                    "https://author-stage.adobeaemcloud.com",
                  ],
                },
              ],
            });
          }),
        },
      },
    };
  });

  it("should initialize and setup AEM quick links when initPopup is called", () => {
    initPopup();

    const pathDisplay = document.getElementById("path-display")!;
    expect(pathDisplay.textContent).toBe("/content/site/page");
    expect(pathDisplay.style.display).toBe("block");

    const statusText = document.getElementById("status-text")!;
    expect(statusText.textContent).toBe("AEM Page Detected");

    const previewBtn = document.getElementById("btn-preview") as HTMLButtonElement;
    expect(previewBtn.disabled).toBe(false);
  });

  it("should open tab with openerTabId and cookieStoreId on button click", () => {
    initPopup();

    const previewBtn = document.getElementById("btn-preview") as HTMLButtonElement;
    previewBtn.click();

    expect((globalThis as any).chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://author-dev.adobeaemcloud.com/content/site/page.html?wcmmode=disabled",
      openerTabId: 123,
      cookieStoreId: "firefox-container-1",
    });
  });

  it("should switch tabs properly when tab clicked", () => {
    initPopup();

    const envTab = document.getElementById("env-tab")!;
    envTab.click();

    expect(envTab.classList.contains("active")).toBe(true);
    expect(document.getElementById("nav-tab")!.classList.contains("active")).toBe(false);
    expect(document.getElementById("environment")!.style.display).toBe("");
    expect(document.getElementById("navigate")!.style.display).toBe("none");
  });

  it("should open options page when settings link clicked", () => {
    initPopup();

    const settingsLink = document.getElementById("settings")!;
    settingsLink.click();

    expect((globalThis as any).chrome.runtime.openOptionsPage).toHaveBeenCalled();

    const openSettingsLink = document.getElementById("open-settings")!;
    openSettingsLink.click();
    expect((globalThis as any).chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(2);
  });

  it("should handle non-AEM pages gracefully", () => {
    (globalThis as any).chrome.tabs.query = vi.fn((_query, callback) => {
      callback([
        {
          id: 456,
          index: 1,
          url: "https://google.com",
        },
      ]);
    });

    initPopup();

    const statusText = document.getElementById("status-text")!;
    expect(statusText.textContent).toBe("Not an AEM Page");
    const previewBtn = document.getElementById("btn-preview") as HTMLButtonElement;
    expect(previewBtn.disabled).toBe(true);
  });

  it("should handle missing tabs in query gracefully", () => {
    (globalThis as any).chrome.tabs.query = vi.fn((_query, callback) => {
      callback([]);
    });

    initPopup();

    const statusText = document.getElementById("status-text")!;
    expect(statusText.textContent).toBe("Cannot access tab");
  });

  it("should respond to keyboard hotkeys for navigation, numbers, and environments", () => {
    initPopup();

    // Hotkey: Number '2' on navigate tab -> editor
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "2" }));
    expect((globalThis as any).chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://author-dev.adobeaemcloud.com/editor.html/content/site/page.html",
      openerTabId: 123,
      cookieStoreId: "firefox-container-1",
    });

    // Hotkey: 'e' -> editor
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }));
    // Hotkey: 'r' -> properties
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    // Hotkey: 'c' -> crxde
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "c" }));
    // Hotkey: 's' -> sites
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));

    // Switch tab with 'd' key
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    expect(document.getElementById("env-tab")!.classList.contains("active")).toBe(true);

    // Click an environment item from the rendered list
    const envList = document.getElementById("env-list")!;
    const envButtons = envList.querySelectorAll(".env-item") as NodeListOf<HTMLButtonElement>;
    expect(envButtons.length).toBe(2);
    envButtons[1].click();

    expect((globalThis as any).chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://author-stage.adobeaemcloud.com/editor.html/content/site/page.html",
      openerTabId: 123,
      cookieStoreId: "firefox-container-1",
    });

    // Switch tab with 'n' key
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "n" }));
    expect(document.getElementById("nav-tab")!.classList.contains("active")).toBe(true);
  });

  it("should ignore keyboard hotkeys when user is typing in an input", () => {
    initPopup();
    const input = document.createElement("input");
    document.body.appendChild(input);

    const event = new KeyboardEvent("keydown", { key: "p", bubbles: true });
    Object.defineProperty(event, "target", { value: input, enumerable: true });

    (globalThis as any).chrome.tabs.create.mockClear();
    document.dispatchEvent(event);
    expect((globalThis as any).chrome.tabs.create).not.toHaveBeenCalled();
  });
});
