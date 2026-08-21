import { vi } from "vitest";

// Setup global mock for Chrome extension APIs
(globalThis as any).chrome = {
  runtime: {
    openOptionsPage: vi.fn(),
  },
  tabs: {
    query: vi.fn((_query, callback) => {
      callback([
        {
          id: 1,
          index: 0,
          url: "https://author-dev.adobeaemcloud.com/editor.html/content/site/page.html",
          cookieStoreId: "default",
        },
      ]);
    }),
    create: vi.fn(),
  },
  storage: {
    sync: {
      get: vi.fn((_keys, callback) => {
        callback({ domainConfigs: [] });
      }),
      set: vi.fn(),
    },
  },
};

(globalThis as any).window.close = vi.fn();
