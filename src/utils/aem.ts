import type { DomainConfig, LinkUrls } from "../types";
export type { DomainConfig, LinkUrls };

export function parseAemPath(rawUrl: URL | string): string | null {
  try {
    const url = typeof rawUrl === "string" ? new URL(rawUrl) : rawUrl;
    const isPropertiesPage = url.href.includes(
      "/mnt/overlay/wcm/core/content/sites/properties",
    );
    const source = isPropertiesPage ? url.search : url.href;
    const match = source.match(/(\/content\/[^?#]+)/);
    if (!match) return null;

    let path = match[0];
    const htmlIndex = path.indexOf(".html");
    if (htmlIndex !== -1) {
      path = path.substring(0, htmlIndex);
    }
    return path;
  } catch {
    return null;
  }
}

export function generateAemLinks(baseUrl: string, contentPath: string): LinkUrls {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  return {
    preview: `${cleanBaseUrl}${contentPath}.html?wcmmode=disabled`,
    editor: `${cleanBaseUrl}/editor.html${contentPath}.html`,
    properties: `${cleanBaseUrl}/mnt/overlay/wcm/core/content/sites/properties.html?item=${contentPath}`,
    crxde: `${cleanBaseUrl}/crx/de/index.jsp#${contentPath}`,
    sites: `${cleanBaseUrl}/sites.html${contentPath}`,
  };
}

export function normalizeDomain(domain: string): string {
  return domain.replace(/^(https?:\/\/)?/i, "").replace(/\/+$/, "");
}

export function swapDomain(newDomain: string, pageUrl: URL): string {
  let newUrlBase: string;
  if (newDomain.includes("://")) {
    newUrlBase = newDomain;
  } else {
    newUrlBase = `${pageUrl.protocol}//${newDomain}`;
  }

  newUrlBase = newUrlBase.replace(/\/+$/, "");
  return pageUrl.href.replace(pageUrl.origin, newUrlBase);
}

export function findMatchingDomainConfig(
  configs: DomainConfig[] | undefined,
  href: string,
): DomainConfig | undefined {
  if (!configs || !Array.isArray(configs)) return undefined;

  for (const config of configs) {
    try {
      if (href.match(new RegExp(config.regex))) {
        return config;
      }
    } catch {
      // Invalid regex pattern, skip
    }
  }
  return undefined;
}
