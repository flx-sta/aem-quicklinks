document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);

  // ── Tab switching ──────────────────────────────────────────────
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.panel));
  });

  function switchTab(panelId) {
    document.querySelectorAll('.tab').forEach((t) => { t.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach((p) => { p.style.display = 'none'; });
    const tab = document.querySelector(`.tab[data-panel="${panelId}"]`);
    if (tab) tab.classList.add('active');
    const panel = $(panelId);
    if (panel) panel.style.display = '';
  }

  // ── Settings links ─────────────────────────────────────────────
  $('settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  $('open-settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // ── State ──────────────────────────────────────────────────────
  let linkUrls = {};
  let currentUrl = null;
  let envDomains = [];

  // ── Single chrome.tabs.query — fixes the double-click bug ─────
  // Previously two independent queries raced for DOM and #status.
  // Now one query drives both flows sequentially.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].url) {
      showStatus('not-detected', 'Cannot access tab');
      return;
    }

    try {
      currentUrl = new URL(tabs[0].url);
    } catch {
      showStatus('not-detected', 'Invalid URL');
      return;
    }

    // ── AEM detection ──────────────────────────────────────────
    const isPropertiesPage = currentUrl.href.includes(
      '/mnt/overlay/wcm/core/content/sites/properties'
    );
    let contentPath = null;

    try {
      const source = isPropertiesPage ? currentUrl.search : currentUrl.href;
      const match = source.match(/(\/content\/[^?#]+)/);
      if (match) {
        contentPath = match[0].replace(/\.html$/i, '');
      }
    } catch {
      // Not an AEM page — contentPath stays null
    }

    if (contentPath) {
      const baseUrl = currentUrl.origin;

      linkUrls = {
        preview: `${baseUrl}${contentPath}.html?wcmmode=disabled`,
        editor: `${baseUrl}/editor.html${contentPath}.html`,
        properties: `${baseUrl}/mnt/overlay/wcm/core/content/sites/properties.html?item=${contentPath}`,
        crxde: `${baseUrl}/crx/de/index.jsp#${contentPath}`,
      };

      showStatus('detected', 'AEM Page Detected');
      $('path-display').textContent = contentPath;
      $('path-display').style.display = 'block';

      $('btn-preview').onclick = () => openLink(linkUrls.preview);
      $('btn-editor').onclick = () => openLink(linkUrls.editor);
      $('btn-properties').onclick = () => openLink(linkUrls.properties);
      $('btn-crxde').onclick = () => openLink(linkUrls.crxde);

      document.querySelectorAll('.link-btn').forEach((btn) => { btn.disabled = false; });
    } else {
      showStatus('not-detected', 'Not an AEM Page');
    }

    // ── Domain configuration (runs inside the same query) ──────
    chrome.storage.sync.get('domainConfigs', (data) => {
      if (!data.domainConfigs) return;

      const matchedConfigs = data.domainConfigs.filter((config) => {
        try {
          return currentUrl.href.match(new RegExp(config.regex));
        } catch {
          return false;
        }
      });

      if (matchedConfigs.length > 0) {
        populateEnvList(matchedConfigs[0].domains, currentUrl);
        $('env-tab').classList.add('has-data');
      }
    });
  });

  // ── Hotkeys ────────────────────────────────────────────────────
  function isEnvTabActive() {
    return $('env-tab').classList.contains('active');
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    const key = e.key.toLowerCase();

    // Number keys: context-dependent
    const num = parseInt(key, 10);
    if (num >= 1 && num <= 9) {
      if (isEnvTabActive()) {
        // On environment tab: pick an environment
        const idx = num - 1;
        if (envDomains[idx] && currentUrl) {
          e.preventDefault();
          const items = $('env-list').querySelectorAll('.env-item');
          if (items[idx]) {
            items[idx].classList.add('flash');
            setTimeout(() => items[idx].classList.remove('flash'), 120);
          }
          swapDomain(envDomains[idx], currentUrl);
        }
      } else {
        // On navigate tab: quick links by number
        const linkMap = { 1: 'preview', 2: 'editor', 3: 'properties', 4: 'crxde' };
        const linkKey = linkMap[num];
        if (linkKey && linkUrls[linkKey]) {
          e.preventDefault();
          flashAndOpen(`btn-${linkKey === 'crxde' ? 'crxde' : linkKey}`, linkUrls[linkKey]);
        }
      }
      return;
    }

    switch (key) {
      case 'p':
        if (linkUrls.preview) {
          e.preventDefault();
          flashAndOpen('btn-preview', linkUrls.preview);
        }
        break;
      case 'e':
        if (linkUrls.editor) {
          e.preventDefault();
          flashAndOpen('btn-editor', linkUrls.editor);
        }
        break;
      case 'r':
        if (linkUrls.properties) {
          e.preventDefault();
          flashAndOpen('btn-properties', linkUrls.properties);
        }
        break;
      case 'c':
        if (linkUrls.crxde) {
          e.preventDefault();
          flashAndOpen('btn-crxde', linkUrls.crxde);
        }
        break;
      case 'd':
        e.preventDefault();
        switchTab('environment');
        break;
      case 'n':
        e.preventDefault();
        switchTab('navigate');
        break;
    }
  });

  // ── Helpers ────────────────────────────────────────────────────

  function showStatus(state, text) {
    $('status-icon').className = state;
    $('status-text').textContent = text;
  }

  function openLink(url) {
    chrome.tabs.create({ url });
  }

  function flashAndOpen(btnId, url) {
    const btn = $(btnId);
    if (btn) {
      btn.classList.add('flash');
      setTimeout(() => btn.classList.remove('flash'), 120);
    }
    openLink(url);
  }

  function normalizeDomain(domain) {
    return domain
      .replace(/^(https?:\/\/)?/i, '')
      .replace(/\/+$/, '');
  }

  function populateEnvList(domains, pageUrl) {
    const list = $('env-list');
    const noEnv = $('no-env');
    list.innerHTML = '';

    const normalizedCurrent = normalizeDomain(pageUrl.origin);
    let count = 0;

    domains.forEach((domain) => {
      domain = domain.trim();
      if (!domain) return;
      count++;

      const btn = document.createElement('button');
      btn.className = 'env-item';
      if (normalizeDomain(domain) === normalizedCurrent) {
        btn.classList.add('current');
      }

      const kbd = document.createElement('kbd');
      kbd.textContent = count;

      const span = document.createElement('span');
      span.className = 'env-domain';
      span.textContent = domain;

      btn.appendChild(kbd);
      btn.appendChild(span);
      btn.onclick = () => swapDomain(domain, pageUrl);

      list.appendChild(btn);
    });

    if (count > 0) {
      list.style.display = 'flex';
      noEnv.style.display = 'none';
      envDomains = domains.filter((d) => d.trim());
    }
  }

  function swapDomain(newDomain, pageUrl) {
    // ── Protocol preservation ──────────────────────────────────
    // Use the current page's protocol instead of defaulting to http://
    let newUrlBase;
    if (newDomain.includes('://')) {
      newUrlBase = newDomain;
    } else {
      newUrlBase = `${pageUrl.protocol}//${newDomain}`;
    }

    newUrlBase = newUrlBase.replace(/\/+$/, '');
    const newUrl = pageUrl.href.replace(pageUrl.origin, newUrlBase);
    openLink(newUrl);
  }
});
