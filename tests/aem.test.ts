import { describe, it, expect } from "vitest";
import type { DomainConfig } from "../src/types";
import {
  parseAemPath,
  generateAemLinks,
  normalizeDomain,
  swapDomain,
  findMatchingDomainConfig,
} from "../src/utils/aem";

describe("AEM Utilities", () => {
  describe("parseAemPath", () => {
    it("should parse standard AEM editor URL", () => {
      const url = "https://author.aem.com/editor.html/content/mysite/us/en.html";
      expect(parseAemPath(url)).toBe("/content/mysite/us/en");
    });

    it("should parse AEM preview/disabled URL with query parameters", () => {
      const url = "https://author.aem.com/content/mysite/us/en.html?wcmmode=disabled";
      expect(parseAemPath(url)).toBe("/content/mysite/us/en");
    });

    it("should parse AEM properties URL from item query parameter", () => {
      const url =
        "https://author.aem.com/mnt/overlay/wcm/core/content/sites/properties.html?item=/content/mysite/us/en";
      expect(parseAemPath(url)).toBe("/content/mysite/us/en");
    });

    it("should parse AEM properties URL with item parameter containing .html", () => {
      const url =
        "https://author.aem.com/mnt/overlay/wcm/core/content/sites/properties.html?item=/content/mysite/us/en.html";
      expect(parseAemPath(url)).toBe("/content/mysite/us/en");
    });

    it("should parse CRXDE URL with hash", () => {
      const url = "https://author.aem.com/crx/de/index.jsp#/content/mysite/us/en";
      expect(parseAemPath(url)).toBe("/content/mysite/us/en");
    });

    it("should parse sites admin URL", () => {
      const url = "https://author.aem.com/sites.html/content/mysite/us/en";
      expect(parseAemPath(url)).toBe("/content/mysite/us/en");
    });

    it("should accept a URL instance", () => {
      const url = new URL("https://author.aem.com/editor.html/content/dam/assets/test.html");
      expect(parseAemPath(url)).toBe("/content/dam/assets/test");
    });

    it("should return null for non-AEM URLs", () => {
      expect(parseAemPath("https://google.com/search?q=test")).toBeNull();
      expect(parseAemPath("https://example.com/about-us")).toBeNull();
    });

    it("should return null for invalid URL strings", () => {
      expect(parseAemPath("not-a-valid-url")).toBeNull();
    });
  });

  describe("generateAemLinks", () => {
    it("should generate all 5 AEM links correctly", () => {
      const baseUrl = "https://author.adobeaemcloud.com";
      const contentPath = "/content/site/page";
      const links = generateAemLinks(baseUrl, contentPath);

      expect(links).toEqual({
        preview: "https://author.adobeaemcloud.com/content/site/page.html?wcmmode=disabled",
        editor: "https://author.adobeaemcloud.com/editor.html/content/site/page.html",
        properties:
          "https://author.adobeaemcloud.com/mnt/overlay/wcm/core/content/sites/properties.html?item=/content/site/page",
        crxde: "https://author.adobeaemcloud.com/crx/de/index.jsp#/content/site/page",
        sites: "https://author.adobeaemcloud.com/sites.html/content/site/page",
      });
    });

    it("should handle trailing slash in baseUrl gracefully", () => {
      const baseUrl = "https://author.adobeaemcloud.com/";
      const contentPath = "/content/site/page";
      const links = generateAemLinks(baseUrl, contentPath);

      expect(links.preview).toBe(
        "https://author.adobeaemcloud.com/content/site/page.html?wcmmode=disabled",
      );
      expect(links.editor).toBe(
        "https://author.adobeaemcloud.com/editor.html/content/site/page.html",
      );
    });
  });

  describe("normalizeDomain", () => {
    it("should strip http://, https://, and trailing slashes", () => {
      expect(normalizeDomain("https://example.com/")).toBe("example.com");
      expect(normalizeDomain("http://example.com///")).toBe("example.com");
      expect(normalizeDomain("example.com")).toBe("example.com");
      expect(normalizeDomain("https://sub.domain.aem.com:8080/")).toBe(
        "sub.domain.aem.com:8080",
      );
    });
  });

  describe("swapDomain", () => {
    it("should swap domain when target domain has no protocol", () => {
      const pageUrl = new URL("https://author-dev.adobeaemcloud.com/editor.html/content/page.html");
      const swapped = swapDomain("author-stage.adobeaemcloud.com", pageUrl);

      expect(swapped).toBe(
        "https://author-stage.adobeaemcloud.com/editor.html/content/page.html",
      );
    });

    it("should swap domain when target domain includes protocol", () => {
      const pageUrl = new URL("https://author-dev.adobeaemcloud.com/content/page.html");
      const swapped = swapDomain("http://localhost:4502", pageUrl);

      expect(swapped).toBe("http://localhost:4502/content/page.html");
    });

    it("should handle trailing slash in new domain", () => {
      const pageUrl = new URL("https://author-dev.adobeaemcloud.com/content/page.html");
      const swapped = swapDomain("https://author-prod.adobeaemcloud.com/", pageUrl);

      expect(swapped).toBe(
        "https://author-prod.adobeaemcloud.com/content/page.html",
      );
    });
  });

  describe("findMatchingDomainConfig", () => {
    const configs: DomainConfig[] = [
      {
        regex: "author-.*\\.adobeaemcloud\\.com",
        domains: [
          "author-dev.adobeaemcloud.com",
          "author-stage.adobeaemcloud.com",
          "author-prod.adobeaemcloud.com",
        ],
      },
      {
        regex: "localhost:450[23]",
        domains: ["localhost:4502", "localhost:4503"],
      },
    ];

    it("should find matching configuration by regex", () => {
      const match = findMatchingDomainConfig(
        configs,
        "https://author-dev.adobeaemcloud.com/editor.html",
      );
      expect(match).toBeDefined();
      expect(match?.domains).toHaveLength(3);
    });

    it("should return undefined if no config matches", () => {
      const match = findMatchingDomainConfig(configs, "https://example.com");
      expect(match).toBeUndefined();
    });

    it("should return undefined when configs array is undefined or empty", () => {
      expect(findMatchingDomainConfig(undefined, "https://test.com")).toBeUndefined();
      expect(findMatchingDomainConfig([], "https://test.com")).toBeUndefined();
    });

    it("should gracefully ignore invalid regex patterns", () => {
      const invalidConfigs: DomainConfig[] = [
        { regex: "[invalid(regex", domains: ["test.com"] },
      ];
      expect(
        findMatchingDomainConfig(invalidConfigs, "https://test.com"),
      ).toBeUndefined();
    });
  });
});
