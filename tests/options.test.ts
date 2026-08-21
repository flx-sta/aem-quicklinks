import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createConfigElement,
  addDomainToList,
  addDomainConfig,
  saveConfigs,
  initOptions,
} from "../src/options";

describe("Options Page Logic", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="domainConfigs"></div>
      <button id="addConfig">+ Add Configuration</button>
    `;

    (globalThis as any).chrome = {
      storage: {
        sync: {
          get: vi.fn((_key, callback) => {
            callback({
              domainConfigs: [
                {
                  regex: "preloaded-regex",
                  domains: ["https://preloaded.domain.com"],
                },
              ],
            });
          }),
          set: vi.fn(),
        },
      },
    };
  });

  it("should initialize options and render preloaded configs from chrome.storage", () => {
    initOptions();

    const container = document.getElementById("domainConfigs")!;
    expect(container.children.length).toBeGreaterThan(0);
    const regexInput = container.querySelector(".field-input") as HTMLInputElement;
    expect(regexInput.value).toBe("preloaded-regex");

    const addBtn = document.getElementById("addConfig")!;
    addBtn.click();
    expect(container.children.length).toBe(2);
  });

  it("should create a config element with given regex and domains", () => {
    const config = {
      regex: "author.*adobeaemcloud",
      domains: ["https://author-dev.aem.com", "https://author-stage.aem.com"],
    };

    const card = createConfigElement(config);
    expect(card).toBeDefined();

    const regexInput = card.querySelector(".field-input") as HTMLInputElement;
    expect(regexInput.value).toBe("author.*adobeaemcloud");

    const domainItems = card.querySelectorAll(".domain-item");
    expect(domainItems).toHaveLength(2);
  });

  it("should add a domain to list and remove it when remove button clicked", () => {
    const list = document.createElement("ul");
    list.className = "domain-list";

    const item = addDomainToList("https://author-prod.aem.com", list);
    expect(list.children).toHaveLength(1);
    expect(item.textContent).toContain("https://author-prod.aem.com");

    const removeBtn = item.querySelector(".btn-remove-domain") as HTMLButtonElement;
    removeBtn.click();

    expect(list.children).toHaveLength(0);
    expect((globalThis as any).chrome.storage.sync.set).toHaveBeenCalled();
  });

  it("should add a new domain when add button is clicked or Enter key pressed", () => {
    const card = createConfigElement({ regex: "test", domains: [] });
    const domainInput = card.querySelector(".domain-row .field-input") as HTMLInputElement;
    const addBtn = card.querySelector(".btn-add") as HTMLButtonElement;
    const domainList = card.querySelector(".domain-list") as HTMLUListElement;

    // Via button click
    domainInput.value = "https://new-domain.com";
    addBtn.click();
    expect(domainList.children).toHaveLength(1);
    expect(domainInput.value).toBe("");

    // Via Enter key
    domainInput.value = "https://second-domain.com";
    domainInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(domainList.children).toHaveLength(2);
    expect(domainInput.value).toBe("");
  });

  it("should remove entire config card when Remove button is clicked", () => {
    const card = addDomainConfig();
    const container = document.getElementById("domainConfigs")!;
    expect(container.children).toHaveLength(1);

    const deleteBtn = card.querySelector(".btn-delete-config") as HTMLButtonElement;
    deleteBtn.click();

    expect(container.children).toHaveLength(0);
    expect((globalThis as any).chrome.storage.sync.set).toHaveBeenCalledWith({
      domainConfigs: [],
    });
  });

  it("should save all configs properly", () => {
    createConfigElement({
      regex: "pattern1",
      domains: ["domain1.com", "domain2.com"],
    });

    const configs = saveConfigs();
    expect(configs).toEqual([
      {
        regex: "pattern1",
        domains: ["domain1.com", "domain2.com"],
      },
    ]);
    expect((globalThis as any).chrome.storage.sync.set).toHaveBeenCalledWith({
      domainConfigs: configs,
    });
  });
});
