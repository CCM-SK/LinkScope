'use strict';

const form = document.getElementById('url-form');
const urlInput = document.getElementById('url-input');
const errorMessage = document.getElementById('input-error');
const exampleButton = document.getElementById('example-button');
const scriptsToggle = document.getElementById('scripts-toggle');
const frame = document.getElementById('sandbox-frame');
const placeholder = document.getElementById('preview-placeholder');
const previewAddress = document.getElementById('preview-address');
const previewStatus = document.getElementById('preview-status');
const reloadButton = document.getElementById('reload-button');
const stopButton = document.getElementById('stop-button');
const emptyDetails = document.getElementById('empty-details');
const urlDetails = document.getElementById('url-details');
const analysisState = document.getElementById('analysis-state');
const notices = document.getElementById('notices');

let activeUrl = null;

function isPrivateIPv4(host) {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 2) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && parts[2] === 113) ||
    a >= 224
  );
}

function isPrivateIPv6(host) {
  const value = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (value === '::' || value === '::1' || value.startsWith('fc') || value.startsWith('fd') ||
      /^fe[89ab]/.test(value) || value.startsWith('ff') || value.startsWith('::ffff:')) return true;
  const mapped = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return Boolean(mapped && isPrivateIPv4(mapped[1]));
}

function isIpAddress(host) {
  return host.startsWith('[') || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
}

function validateUrl(rawValue) {
  let value = rawValue.trim();
  if (!value) throw new Error('Enter a URL to begin.');
  if (/\s/.test(value)) throw new Error('The URL cannot contain spaces. Check the address and try again.');
  if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) value = `https://${value}`;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('That does not look like a valid URL. Check the address and try again.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS links can be opened in this preview.');
  }
  if (!parsed.hostname) throw new Error('Add a hostname, such as example.com.');
  if (parsed.username || parsed.password) {
    throw new Error('This URL contains embedded login credentials. Remove them before loading the link.');
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Local network hostnames are blocked by this demo.');
  }
  if (isPrivateIPv4(host) || isPrivateIPv6(host)) {
    throw new Error('Private, loopback, link-local, and reserved IP addresses are blocked.');
  }

  return parsed;
}

function addNotice(message, type = 'warning') {
  const item = document.createElement('div');
  item.className = `notice${type === 'info' ? ' info' : ''}`;
  item.textContent = message;
  notices.appendChild(item);
}

function displayDetails(url) {
  emptyDetails.hidden = true;
  urlDetails.hidden = false;
  notices.replaceChildren();

  document.getElementById('detail-host').textContent = url.hostname;
  document.getElementById('detail-protocol').textContent = url.protocol.replace(':', '').toUpperCase();
  document.getElementById('detail-port').textContent = url.port || (url.protocol === 'https:' ? '443 (default)' : '80 (default)');
  document.getElementById('detail-path').textContent = url.pathname || '/';
  document.getElementById('detail-query').textContent = `${url.searchParams.size} parameter${url.searchParams.size === 1 ? '' : 's'}`;
  document.getElementById('detail-fragment').textContent = url.hash ? url.hash.slice(1) : 'None';
  document.getElementById('detail-full').textContent = url.href;
  analysisState.textContent = 'PARSED LOCALLY';

  if (url.protocol === 'http:') {
    addNotice('This link uses unencrypted HTTP. Browsers may block an HTTP preview when this app is hosted over HTTPS.');
  }
  if (url.hostname.toLowerCase().startsWith('xn--') || url.hostname.toLowerCase().includes('.xn--')) {
    addNotice('The hostname contains an internationalized (punycode) label. Check for look-alike characters.');
  }
  if (isIpAddress(url.hostname)) {
    addNotice('The destination is an IP address rather than a conventional domain name.');
  }
  if (url.search) {
    addNotice('Query parameters can contain tracking values or private tokens. Review the full URL before sharing it.', 'info');
  }
  addNotice('This is a structural URL breakdown only. No reputation, malware, DNS, or certificate check has been performed.', 'info');
}

function loadIntoSandbox(url) {
  activeUrl = url.href;
  frame.setAttribute('sandbox', scriptsToggle.checked ? 'allow-scripts' : '');
  frame.hidden = false;
  placeholder.hidden = true;
  previewAddress.textContent = url.href;
  previewAddress.title = url.href;
  previewStatus.textContent = scriptsToggle.checked
    ? 'Loading with page scripts enabled'
    : 'Loading with scripts disabled';
  reloadButton.disabled = false;
  stopButton.disabled = false;
  frame.src = url.href;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorMessage.hidden = true;
  errorMessage.textContent = '';

  try {
    const parsed = validateUrl(urlInput.value);
    urlInput.value = parsed.href;
    displayDetails(parsed);
    loadIntoSandbox(parsed);
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.hidden = false;
    urlInput.focus();
  }
});

exampleButton.addEventListener('click', () => {
  urlInput.value = 'https://example.com';
  urlInput.focus();
});

scriptsToggle.addEventListener('change', () => {
  if (!activeUrl) return;
  previewStatus.textContent = scriptsToggle.checked
    ? 'Reloading with page scripts enabled'
    : 'Reloading with scripts disabled';
  frame.setAttribute('sandbox', scriptsToggle.checked ? 'allow-scripts' : '');
  frame.src = activeUrl;
});

reloadButton.addEventListener('click', () => {
  if (!activeUrl) return;
  previewStatus.textContent = 'Reloading preview…';
  frame.src = activeUrl;
});

stopButton.addEventListener('click', () => {
  frame.src = 'about:blank';
  frame.hidden = true;
  placeholder.hidden = false;
  previewStatus.textContent = 'Preview stopped';
  previewAddress.textContent = 'Preview stopped';
  reloadButton.disabled = true;
  stopButton.disabled = true;
  activeUrl = null;
});

frame.addEventListener('load', () => {
  if (!activeUrl) return;
  previewStatus.textContent = 'Frame navigation finished · final cross-origin URL is not visible here';
});
