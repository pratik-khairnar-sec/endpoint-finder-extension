// ================================================================
// 🕸️ MODULE: CORE CRAWLER & RECONNAISSANCE ENGINE
// ================================================================
// Fast, deterministic DOM and script endpoint extraction without
// simulated mouse or scroll lag. 100% reliable discovery.
// ================================================================

import { SecretsEngine } from './secrets.js';

export class CrawlEngine {
  constructor() {
    this.secretsScanner = new SecretsEngine();
    this.discoveredEndpoints = [];
    this.discoveredPaths = new Set();
    this.discoveredParams = new Set();
    this.discoveredSecrets = [];
    this.scannedPages = new Map();
    this.scanQueue = [];
    this.analyzedJs = new Set();
    this.isRunning = false;
    this.isPaused = false;
    this.totalPages = 0;
    this.totalEndpoints = 0;
    this.totalPaths = 0;
    this.currentUrl = 'None';
    this.baseDomain = '';
    this.logs = [];

    this.ajaxPatterns = [
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /axios\.(get|post|put|delete|patch|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /\$\.(get|post|put|delete|ajax)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /\.ajax\s*\(\s*\{[^}]*url\s*:\s*['"`]([^'"`]+)['"`]/gi,
      /xhr\.open\s*\(\s*['"`][^'"`]+['"`]\s*,\s*['"`]([^'"`]+)['"`]/gi,
      /new\s+XMLHttpRequest\(\)[^;]*\.open\s*\(\s*['"`][^'"`]+['"`]\s*,\s*['"`]([^'"`]+)['"`]/gi,
      /endpoint\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /url\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /api_url\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /baseURL\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /baseUrl\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /API_BASE_URL\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /API_URL\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /api\s*=\s*['"`]([^'"`]+)['"`]/gi
    ];
  }

  addLog(message, type = 'info', meta = {}) {
    const entry = {
      time: new Date().toLocaleTimeString(),
      message,
      type,
      meta,
      timestamp: Date.now()
    };
    this.logs.unshift(entry);
    if (this.logs.length > 300) this.logs.pop();
    this.broadcastMessage('newLog', entry);
  }

  broadcastMessage(action, data) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action, ...data }).catch(() => {});
      }
    } catch (e) {}
  }

  classifyEndpoint(url) {
    const u = url.toLowerCase();
    if (u.includes('graphql')) return 'graphql';
    if (u.includes('auth') || u.includes('login') || u.includes('oauth') || u.includes('token') || u.includes('session')) return 'auth';
    if (u.includes('admin') || u.includes('dashboard') || u.includes('manage')) return 'admin';
    if (u.includes('upload') || u.includes('file') || u.includes('avatar') || u.includes('media')) return 'upload';
    if (u.includes('/v1/') || u.includes('/v2/') || u.includes('/v3/') || u.includes('/api/')) return 'rest';
    return 'api';
  }

  normalizeEndpoint(ep, baseUrl) {
    if (!ep || typeof ep !== 'string') return '';
    let clean = ep.trim().replace(/^['"`]+|['"`]+$/g, '');
    if (clean.startsWith('//')) clean = 'https:' + clean;
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;

    try {
      const base = new URL(baseUrl);
      if (clean.startsWith('/')) {
        return `${base.origin}${clean}`;
      }
      const dir = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
      return `${base.origin}${dir}${clean}`;
    } catch (e) {
      return clean;
    }
  }

  isSameDomain(url) {
    if (!this.baseDomain) return true;
    try {
      const host = new URL(url).hostname;
      return host === this.baseDomain || host.endsWith('.' + this.baseDomain);
    } catch (e) {
      return false;
    }
  }

  addEndpoint(ep) {
    if (!ep || !ep.url) return;
    if (this.discoveredEndpoints.some(e => e.url === ep.url && e.method === ep.method)) return;

    this.discoveredEndpoints.push(ep);
    this.totalEndpoints = this.discoveredEndpoints.length;

    try {
      const u = new URL(ep.url);
      if (u.pathname && u.pathname !== '/') {
        this.discoveredPaths.add(u.pathname);
        this.totalPaths = this.discoveredPaths.size;
      }
      for (const [k] of u.searchParams.entries()) {
        this.discoveredParams.add(k);
      }
    } catch (e) {}

    this.broadcastMessage('newEndpoint', ep);
  }

  addSecret(sec) {
    if (!sec || (!sec.value && !sec.raw)) return;
    const val = sec.value || sec.raw;
    if (this.discoveredSecrets.some(s => (s.value || s.raw) === val)) return;

    this.discoveredSecrets.unshift(sec);
    this.addLog(`🔑 Leaked Secret: ${sec.name} (${sec.masked})`, 'error', sec);
    this.broadcastMessage('newSecret', sec);
  }

  async processPage(tabId, url) {
    this.currentUrl = url;
    this.addLog(`🔍 Processing page: ${url}`, 'info');

    // Execute gentle DOM scrape on target page
    let pageData = null;
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src).filter(Boolean);
          const inlineScripts = Array.from(document.querySelectorAll('script:not([src])')).map(s => s.textContent || '').filter(t => t.length > 20);
          const links = Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(Boolean);
          const forms = Array.from(document.querySelectorAll('form[action]')).map(f => f.action).filter(Boolean);
          
          let nextData = null;
          const nextEl = document.getElementById('__NEXT_DATA__');
          if (nextEl) nextData = nextEl.textContent;

          return {
            title: document.title,
            html: document.documentElement.outerHTML.slice(0, 1000000),
            scripts,
            inlineScripts,
            links,
            forms,
            nextData
          };
        }
      });
      pageData = res?.result;
    } catch (e) {
      this.addLog(`⚠️ Script injection note: ${e.message}`, 'warning');
    }

    if (!pageData) return;
    this.totalPages++;

    // 1. Scan Inline Scripts for Secrets & Endpoints
    if (pageData.inlineScripts) {
      for (const code of pageData.inlineScripts) {
        const secrets = this.secretsScanner.scanText(code, url);
        secrets.forEach(s => this.addSecret(s));

        for (const pattern of this.ajaxPatterns) {
          let m;
          const r = new RegExp(pattern);
          while ((m = r.exec(code)) !== null) {
            const epUrl = this.normalizeEndpoint(m[1] || m[2], url);
            if (epUrl && epUrl.length > 2) {
              this.addEndpoint({
                url: epUrl,
                method: 'GET',
                type: this.classifyEndpoint(epUrl),
                source: 'inline-script',
                foundOn: url
              });
            }
          }
        }
      }
    }

    // 2. Scan Hydration State (__NEXT_DATA__)
    if (pageData.nextData) {
      try {
        const matches = pageData.nextData.match(/["'](\/[a-zA-Z0-9_\-./]+)["']/g) || [];
        matches.slice(0, 50).forEach(m => {
          const raw = m.replace(/["']/g, '');
          if (raw.startsWith('/api') || raw.startsWith('/v1') || raw.startsWith('/v2')) {
            const epUrl = this.normalizeEndpoint(raw, url);
            this.addEndpoint({
              url: epUrl,
              method: 'GET',
              type: 'api',
              source: 'next-hydration',
              foundOn: url
            });
          }
        });
      } catch (e) {}
    }

    // 3. Scan External Scripts (fetch and parse)
    if (pageData.scripts) {
      for (const sUrl of pageData.scripts.slice(0, 30)) {
        if (!this.isSameDomain(sUrl)) continue;
        if (this.analyzedJs.has(sUrl)) continue;
        this.analyzedJs.add(sUrl);

        try {
          const res = await fetch(sUrl, { signal: AbortSignal.timeout(5000) });
          const jsText = await res.text();
          if (jsText) {
            const secrets = this.secretsScanner.scanText(jsText, sUrl);
            secrets.forEach(s => this.addSecret(s));

            for (const pattern of this.ajaxPatterns) {
              let m;
              const r = new RegExp(pattern);
              while ((m = r.exec(jsText)) !== null) {
                const epUrl = this.normalizeEndpoint(m[1] || m[2], url);
                if (epUrl && epUrl.length > 2) {
                  this.addEndpoint({
                    url: epUrl,
                    method: 'GET',
                    type: this.classifyEndpoint(epUrl),
                    source: 'external-script',
                    foundOn: sUrl
                  });
                }
              }
            }
          }
        } catch (e) {}
      }
    }

    // 4. Form Actions and In-Domain Links
    if (pageData.forms) {
      pageData.forms.forEach(act => {
        const epUrl = this.normalizeEndpoint(act, url);
        if (epUrl) this.addEndpoint({ url: epUrl, method: 'POST', type: 'api', source: 'form-action', foundOn: url });
      });
    }

    this.addLog(`✅ Page scan complete: ${url} (Endpoints: ${this.totalEndpoints}, Secrets: ${this.discoveredSecrets.length})`, 'success');
  }

  clearAll() {
    this.discoveredEndpoints = [];
    this.discoveredPaths.clear();
    this.discoveredParams.clear();
    this.discoveredSecrets = [];
    this.scannedPages.clear();
    this.scanQueue = [];
    this.analyzedJs.clear();
    this.totalPages = 0;
    this.totalEndpoints = 0;
    this.totalPaths = 0;
    this.currentUrl = 'None';
    this.logs = [];
    this.addLog('🗑️ All discovery data cleared', 'info');
  }

  getState() {
    return {
      endpoints: this.discoveredEndpoints,
      paths: Array.from(this.discoveredPaths),
      params: Array.from(this.discoveredParams),
      secrets: this.discoveredSecrets,
      totalPages: this.totalPages,
      totalEndpoints: this.totalEndpoints,
      totalPaths: this.totalPaths,
      totalSecrets: this.discoveredSecrets.length,
      currentUrl: this.currentUrl,
      baseDomain: this.baseDomain,
      isRunning: this.isRunning,
      logs: this.logs.slice(0, 100)
    };
  }
}
