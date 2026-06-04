document.getElementById('addConfig').addEventListener('click', addDomainConfig);

// Load existing configs on page open
chrome.storage.sync.get('domainConfigs', (data) => {
  if (data.domainConfigs) {
    data.domainConfigs.forEach((config) => {
      createConfigElement(config);
    });
  }
});

function createConfigElement(config = { regex: '', domains: [] }) {
  const card = document.createElement('div');
  card.className = 'config-card';

  // Regex field
  const regexGroup = document.createElement('div');
  regexGroup.className = 'field-group';

  const regexLabel = document.createElement('label');
  regexLabel.className = 'field-label';
  regexLabel.textContent = 'Regex Pattern';

  const regexInput = document.createElement('input');
  regexInput.className = 'field-input';
  regexInput.placeholder = 'e.g. author.*adobeaemcloud';
  regexInput.value = config.regex;

  regexGroup.appendChild(regexLabel);
  regexGroup.appendChild(regexInput);

  // Domain input row
  const domainGroup = document.createElement('div');
  domainGroup.className = 'field-group';

  const domainLabel = document.createElement('label');
  domainLabel.className = 'field-label';
  domainLabel.textContent = 'Domains';

  const domainRow = document.createElement('div');
  domainRow.className = 'domain-row';

  const domainInput = document.createElement('input');
  domainInput.className = 'field-input';
  domainInput.placeholder = 'https://author-p123.adobeaemcloud.com';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-add';
  addBtn.textContent = '+';
  addBtn.onclick = () => {
    const domain = domainInput.value.trim();
    if (domain) {
      addDomainToList(domain, domainList);
      domainInput.value = '';
      saveConfigs();
    }
  };

  // Allow Enter key in domain input
  domainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBtn.click();
    }
  });

  domainRow.appendChild(domainInput);
  domainRow.appendChild(addBtn);

  domainGroup.appendChild(domainLabel);
  domainGroup.appendChild(domainRow);

  // Domain list
  const domainList = document.createElement('ul');
  domainList.className = 'domain-list';
  config.domains.forEach((domain) => {
    addDomainToList(domain, domainList);
  });
  domainGroup.appendChild(domainList);

  // Delete config button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-delete-config';
  deleteBtn.textContent = 'Remove';
  deleteBtn.onclick = () => {
    card.remove();
    saveConfigs();
  };

  // Assemble card
  card.appendChild(deleteBtn);
  card.appendChild(regexGroup);
  card.appendChild(domainGroup);

  document.getElementById('domainConfigs').appendChild(card);
}

function addDomainToList(domain, domainList) {
  const item = document.createElement('li');
  item.className = 'domain-item';

  const text = document.createElement('span');
  text.textContent = domain;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-remove-domain';
  removeBtn.textContent = '\u00d7'; // ×
  removeBtn.title = 'Remove domain';
  removeBtn.onclick = () => {
    item.remove();
    saveConfigs();
  };

  item.appendChild(text);
  item.appendChild(removeBtn);
  domainList.appendChild(item);
}

function addDomainConfig() {
  createConfigElement();
}

function saveConfigs() {
  const cards = document.querySelectorAll('#domainConfigs .config-card');
  const configs = Array.from(cards).map((card) => {
    const regex = card.querySelector('.field-input').value;
    const domains = Array.from(card.querySelectorAll('.domain-item span')).map(
      (span) => span.textContent.trim()
    );
    return { regex, domains };
  });
  chrome.storage.sync.set({ domainConfigs: configs });
}

// Auto-save when regex inputs change
document.getElementById('domainConfigs').addEventListener('input', saveConfigs);
