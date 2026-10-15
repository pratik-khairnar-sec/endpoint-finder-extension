// ================================================================
// 🔗 ENDPOINT HUNTER v4.0 - ADVANCED ENDPOINT RECONNAISSANCE
// ================================================================
// 👤 Author: Pratik Khairnar (https://github.com/pratik-khairnar-sec)
// 🛡️ High-Precision Zero False-Positive Discovery Engine
// ================================================================

// ================================================================
// 📦 TELEGRAM & WEBHOOK CONFIGURATION
// ================================================================

let TELEGRAM = {
  token: '',
  chatId: '',
  enabled: false
};

let WEBHOOK_CONFIG = {
  discord: '',
  slack: '',
  discordEnabled: false,
  slackEnabled: false
};

let CRAWL_CONFIG = {
  maxPages: 999999,
  maxDepth: 999,
  stealthMode: true,
  followExternal: false,
  bypassAll: true,
  deepScan: true,
  proxyRotation: true
};

// ================================================================
// 🕵️ STEALTH ENGINE (NEW - ADDED)
// ================================================================

class StealthEngine {
  constructor() {
    this.minDelay = 2000;
    this.maxDelay = 10000;
    this.stealthAttempts = 0;
    this.stealthSuccesses = 0;
    
    this.scrollPatterns = [
      { start: 0, end: 200, duration: 1000 },
      { start: 200, end: 500, duration: 1500 },
      { start: 500, end: 800, duration: 2000 },
      { start: 800, end: 1200, duration: 2500 },
    ];
    
    this.mousePatterns = [
      { x: 100, y: 100, duration: 500 },
      { x: 300, y: 200, duration: 700 },
      { x: 500, y: 400, duration: 1000 },
      { x: 700, y: 300, duration: 800 },
    ];
    
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ];
    
    this.referers = [
      'https://www.google.com/',
      'https://www.bing.com/',
      'https://duckduckgo.com/',
      'https://www.facebook.com/',
      'https://twitter.com/',
      'https://github.com/',
      'https://stackoverflow.com/',
    ];
  }

  async humanDelay(min = 2000, max = 10000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(r => setTimeout(r, delay));
    return delay;
  }

  async humanScroll(tabId) {
    try {
      const pattern = this.scrollPatterns[Math.floor(Math.random() * this.scrollPatterns.length)];
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (start, end, duration) => {
          return new Promise((resolve) => {
            const startTime = Date.now();
            const scrollStep = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const currentPos = start + (end - start) * progress;
              window.scrollTo(0, currentPos);
              if (progress < 1) {
                requestAnimationFrame(scrollStep);
              } else {
                resolve();
              }
            };
            scrollStep();
          });
        },
        args: [pattern.start, pattern.end, pattern.duration]
      });
      this.stealthSuccesses++;
    } catch (e) {}
  }

  async humanMouseMove(tabId) {
    try {
      const pattern = this.mousePatterns[Math.floor(Math.random() * this.mousePatterns.length)];
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (x, y, duration) => {
          return new Promise((resolve) => {
            const startTime = Date.now();
            const mouseStep = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const currentX = x * progress;
              const currentY = y * progress;
              const event = new MouseEvent('mousemove', {
                clientX: currentX,
                clientY: currentY,
                bubbles: true
              });
              document.dispatchEvent(event);
              if (progress < 1) {
                requestAnimationFrame(mouseStep);
              } else {
                resolve();
              }
            };
            mouseStep();
          });
        },
        args: [pattern.x, pattern.y, pattern.duration]
      });
    } catch (e) {}
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  getRandomReferer() {
    return this.referers[Math.floor(Math.random() * this.referers.length)];
  }

  getStealthHeaders() {
    return {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'DNT': '1',
      'Referer': this.getRandomReferer(),
    };
  }

  async stealthFetch(url, retries = 3) {
    this.stealthAttempts++;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.humanDelay(2000, 5000);
        const headers = this.getStealthHeaders();
        const randomParam = Math.random().toString(36).substring(7);
        const urlWithParam = url + (url.includes('?') ? '&' : '?') + `_=${randomParam}`;
        
        const response = await fetch(urlWithParam, {
          headers: headers,
          signal: AbortSignal.timeout(15000),
          credentials: 'include',
          cache: 'no-store',
        });
        
        this.stealthSuccesses++;
        return response;
      } catch (e) {
        if (attempt === retries - 1) return null;
        await this.humanDelay(5000, 10000);
      }
    }
    return null;
  }

  getStats() {
    return {
      attempts: this.stealthAttempts,
      successes: this.stealthSuccesses,
      successRate: this.stealthAttempts > 0 
        ? (this.stealthSuccesses / this.stealthAttempts * 100).toFixed(1) + '%'
        : '100%',
    };
  }
}

// ================================================================
// 🛡️ BYPASS ENGINE (NEW - ADDED)
// ================================================================

class BypassEngine {
  constructor() {
    this.bypassAttempts = 0;
    this.bypassSuccesses = 0;
    
    this.wafHeaders = [
      { name: 'X-Forwarded-For', value: () => this.getRandomIP() },
      { name: 'X-Real-IP', value: () => this.getRandomIP() },
      { name: 'Client-IP', value: () => this.getRandomIP() },
      { name: 'X-Originating-IP', value: () => this.getRandomIP() },
      { name: 'X-Remote-IP', value: () => this.getRandomIP() },
      { name: 'X-Remote-Addr', value: () => this.getRandomIP() },
      { name: 'X-Forwarded-Host', value: () => this.getRandomHost() },
      { name: 'X-Forwarded-Proto', value: () => 'https' },
      { name: 'CF-Connecting-IP', value: () => this.getRandomIP() },
      { name: 'True-Client-IP', value: () => this.getRandomIP() },
    ];
    
    this.ipPool = [];
    for (let i = 0; i < 50; i++) {
      this.ipPool.push(
        `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      );
    }
    
    this.hosts = ['google.com', 'facebook.com', 'amazon.com', 'microsoft.com', 'apple.com', 'github.com', 'stackoverflow.com', 'reddit.com', 'twitter.com', 'linkedin.com'];
  }

  getRandomIP() {
    return this.ipPool[Math.floor(Math.random() * this.ipPool.length)];
  }

  getRandomHost() {
    return this.hosts[Math.floor(Math.random() * this.hosts.length)];
  }

  getBypassHeaders() {
    const headers = {};
    for (const header of this.wafHeaders) {
      headers[header.name] = header.value();
    }
    return headers;
  }

  async bypassFetch(url, maxRetries = 5) {
    this.bypassAttempts++;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const headers = this.getBypassHeaders();
        const response = await fetch(url, {
          headers: headers,
          signal: AbortSignal.timeout(15000),
          credentials: 'include',
        });

        if (response.ok) {
          this.bypassSuccesses++;
          return response;
        }

        if (response.status === 403 || response.status === 401) {
          const delay = Math.pow(2, attempt) * 2000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (response.status === 429) {
          const delay = (attempt + 1) * 3000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (response.status >= 500) {
          const delay = (attempt + 1) * 2000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        return response;

      } catch (e) {
        if (attempt === maxRetries - 1) return null;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return null;
  }

  getStats() {
    return {
      attempts: this.bypassAttempts,
      successes: this.bypassSuccesses,
      successRate: this.bypassAttempts > 0 
        ? (this.bypassSuccesses / this.bypassAttempts * 100).toFixed(1) + '%'
        : '100%',
    };
  }
}

// ================================================================
// 🔥 DEEP SCANNER (NEW - ADDED)
// ================================================================

class DeepScanner {
  constructor() {
    this.jsPatterns = [
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /\$\.(get|post|put|delete|ajax)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /\.ajax\s*\(\s*\{[^}]*url\s*:\s*['"`]([^'"`]+)['"`]/gi,
      /xhr\.open\s*\(\s*['"`][^'"`]+['"`]\s*,\s*['"`]([^'"`]+)['"`]/gi,
      /endpoint\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /url\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /api_url\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /baseURL\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      // Target API routes & common endpoints in quotes
      /(?:"|')(\/(?:api|v[0-9]|graphql|graphiql|admin|auth|oauth|users?|account|profile|settings|checkout|cart|orders?|items?|products?|search|upload|download|webhook|ws|rest)\b[a-zA-Z0-9_\-\.~%!$&'()*+,;=:@\/?#]*)(?:"|')/gi,
      // Path pattern matching with extensions or query strings
      /(?:"|')((?:\/[a-zA-Z0-9_.~%-]+)+\.?(?:json|xml|action|php|aspx|jsp|do)?(?:\?[a-zA-Z0-9_.~%&=\-]*)?)(?:"|')/g
    ];
    
    this.cssPatterns = [
      /url\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi,
      /@import\s+['"]?([^'")\s]+)['"]?/gi,
      /src\s*:\s*url\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi,
    ];
    
    this.htmlPatterns = [
      /href\s*=\s*["']([^"']+)["']/gi,
      /src\s*=\s*["']([^"']+)["']/gi,
      /action\s*=\s*["']([^"']+)["']/gi,
      /data-\w+\s*=\s*["']([^"']+)["']/gi,
    ];
  }

  isFalsePositive(str) {
    if (!str || typeof str !== 'string') return true;
    const s = str.trim();
    if (s.length < 2 || s.length > 500) return true;

    // Check invalid characters
    if (/[\s\n\r\t<>'"{}|^\\$]/.test(s)) return true;
    if (s.includes('${')) return true;

    // Disallow pure symbols or regex flags
    if (/^\/[*+\\?#.:;!@=~_,\-]*$/.test(s)) return true;
    if (/^\/(div|span|p|a|ul|li|button|svg|path|g|html|body|script|style|table|tr|td|th|form|input|label|select|option)>/i.test(s)) return true;

    // Disallow non-HTTP protocols
    if (/^(javascript|data|blob|mailto|tel|about|chrome|chrome-extension|file):/i.test(s)) return true;

    // Disallow XML / SVG namespaces & schemas
    if (/^https?:\/\/(www\.)?(w3\.org|schemas\.microsoft\.com|xmlns\.jcp\.org|openxmlformats\.org)/i.test(s)) return true;

    // Disallow common JS library internal paths
    if (/^\/(node_modules|webpack|__webpack|core-js|babel|regenerator-runtime)/i.test(s)) return true;

    // Must start with '/' or 'http://' or 'https://'
    if (!s.startsWith('/') && !/^https?:\/\//i.test(s)) return true;

    // If starts with '/', must contain valid path characters and not be bare slashes
    if (s.startsWith('/')) {
      if (s === '/' || s === '//' || s.startsWith('///')) return true;
      if (!/^\/[a-zA-Z0-9_\-\.~%!$&'()*+,;=:@\/]/.test(s)) return true;
    }

    return false;
  }

  scanJS(js, baseUrl) {
    const results = { endpoints: [], paths: [], params: [] };
    const seen = new Set();

    for (const pattern of this.jsPatterns) {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(js)) !== null) {
        let value = match[1] || match[2] || match[0];
        if (value) {
          value = value.replace(/^['"`]|['"`]$/g, '').trim();
          if (this.isFalsePositive(value)) continue;
          if (!seen.has(value)) {
            seen.add(value);
            results.endpoints.push(value);
            try {
              const url = new URL(value, baseUrl);
              if (url.pathname && url.pathname.length > 1) {
                results.paths.push(url.pathname);
              }
              for (const [key] of url.searchParams) {
                results.params.push(key);
              }
            } catch (e) {}
          }
        }
      }
    }
    return results;
  }

  scanCSS(css, baseUrl) {
    const results = { endpoints: [], paths: [] };
    const seen = new Set();

    for (const pattern of this.cssPatterns) {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(css)) !== null) {
        let value = match[1];
        if (value) {
          value = value.replace(/^['"`]|['"`]$/g, '').trim();
          if (this.isFalsePositive(value)) continue;
          if (!seen.has(value)) {
            seen.add(value);
            results.endpoints.push(value);
            try {
              const url = new URL(value, baseUrl);
              if (url.pathname && url.pathname.length > 1) {
                results.paths.push(url.pathname);
              }
            } catch (e) {}
          }
        }
      }
    }
    return results;
  }

  scanHTML(html, baseUrl) {
    const results = { endpoints: [], paths: [], params: [] };
    const seen = new Set();

    for (const pattern of this.htmlPatterns) {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(html)) !== null) {
        let value = match[1];
        if (value) {
          value = value.replace(/^['"`]|['"`]$/g, '').trim();
          if (this.isFalsePositive(value)) continue;
          if (!seen.has(value)) {
            seen.add(value);
            results.endpoints.push(value);
            if (value.includes('?')) {
              try {
                const params = new URLSearchParams(value.split('?')[1]);
                for (const [key] of params) {
                  results.params.push(key);
                }
              } catch (e) {}
            }
          }
        }
      }
    }
    return results;
  }
}

// ================================================================
// 🔑 SECRETS & TOKEN SCANNER (v2.0)
// ================================================================

class SecretsScanner {
  constructor() {
    this.patterns = [
      {
        name: 'AWS Access Key ID',
        category: 'cloud',
        severity: 'CRITICAL',
        regex: /(?:^|[^A-Z0-9])(AKIA[0-9A-Z]{16})(?:[^A-Z0-9]|$)/g,
        captureGroup: 1
      },
      {
        name: 'Google API Key',
        category: 'cloud',
        severity: 'HIGH',
        regex: /(?:^|[^A-Za-z0-9_-])(AIza[0-9A-Za-z\-_]{35})(?:[^A-Za-z0-9_-]|$)/g,
        captureGroup: 1
      },
      {
        name: 'GitHub Personal Token',
        category: 'vcs',
        severity: 'CRITICAL',
        regex: /(?:^|[^a-zA-Z0-9_])((?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{22}_[A-Za-z0-9_]{59})(?:[^a-zA-Z0-9_]|$)/g,
        captureGroup: 1
      },
      {
        name: 'Stripe API Key',
        category: 'payment',
        severity: 'CRITICAL',
        regex: /(?:^|[^a-zA-Z0-9_])((?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,34})(?:[^a-zA-Z0-9_]|$)/g,
        captureGroup: 1
      },
      {
        name: 'Slack Webhook',
        category: 'communication',
        severity: 'HIGH',
        regex: /(https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+)/g,
        captureGroup: 1
      },
      {
        name: 'Discord Webhook',
        category: 'communication',
        severity: 'HIGH',
        regex: /(https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_\-]+)/g,
        captureGroup: 1
      },
      {
        name: 'OpenAI API Key',
        category: 'ai',
        severity: 'CRITICAL',
        regex: /(?:^|[^a-zA-Z0-9_-])(sk-(?:proj-)?[a-zA-Z0-9_\-]{32,64})(?:[^a-zA-Z0-9_-]|$)/g,
        captureGroup: 1
      },
      {
        name: 'JWT (JSON Web Token)',
        category: 'auth',
        severity: 'MEDIUM',
        regex: /(?:^|[^a-zA-Z0-9_.-])(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+)(?:[^a-zA-Z0-9_.-]|$)/g,
        captureGroup: 1
      },
      {
        name: 'Firebase Database URL',
        category: 'database',
        severity: 'MEDIUM',
        regex: /(https:\/\/[a-z0-9-]+\.firebaseio\.com)/gi,
        captureGroup: 1
      },
      {
        name: 'Exposed Frontend Secret Variable',
        category: 'env',
        severity: 'HIGH',
        regex: /(?:NEXT_PUBLIC_|REACT_APP_|VITE_)(?:[A-Z0-9_]*SECRET[A-Z0-9_]*|[A-Z0-9_]*KEY[A-Z0-9_]*|[A-Z0-9_]*TOKEN[A-Z0-9_]*)\s*[:=]\s*['"]([^'"]{8,128})['"]/gi,
        captureGroup: 1
      },
      {
        name: 'Generic API Key / Token Assignment',
        category: 'generic',
        severity: 'MEDIUM',
        regex: /(?:api[_-]?key|client[_-]?secret|auth[_-]?token|access[_-]?token|app[_-]?secret)\s*[:=]\s*['"]([a-zA-Z0-9_\-~.]{20,80})['"]/gi,
        captureGroup: 1
      }
    ];
  }

  scan(text, sourceUrl) {
    if (!text || typeof text !== 'string') return [];
    const found = [];
    const seen = new Set();

    for (const rule of this.patterns) {
      let match;
      const regex = new RegExp(rule.regex);
      while ((match = regex.exec(text)) !== null) {
        const secretVal = (match[rule.captureGroup] || match[0]).trim();
        if (secretVal.length < 8) continue;
        // Suppress placeholder strings
        if (/^(your[_-]|xxx|placeholder|undefined|null|test[_-]|example|sample|todo)/i.test(secretVal)) continue;
        if (seen.has(secretVal)) continue;
        seen.add(secretVal);

        found.push({
          name: rule.name,
          category: rule.category,
          severity: rule.severity,
          value: secretVal,
          masked: secretVal.length > 8 ? secretVal.slice(0, 4) + '...' + secretVal.slice(-4) : '***',
          source: sourceUrl || 'inline',
          foundAt: new Date().toLocaleTimeString()
        });
      }
    }
    return found;
  }
}

// ================================================================
// 🗺️ FRAMEWORK & SOURCE MAP SCANNER (v2.0)
// ================================================================

class FrameworkScanner {
  constructor(stealthEngine) {
    this.stealthEngine = stealthEngine;
    this.checkedMaps = new Set();
  }

  async checkSourceMap(scriptUrl) {
    if (!scriptUrl || this.checkedMaps.has(scriptUrl)) return null;
    this.checkedMaps.add(scriptUrl);
    try {
      const mapUrl = scriptUrl + '.map';
      const res = await this.stealthEngine.stealthFetch(mapUrl);
      if (res && res.ok) {
        return {
          type: 'sourcemap',
          url: mapUrl,
          accessible: true
        };
      }
    } catch (e) {}
    return null;
  }

  async checkNextManifests(baseUrl) {
    const nextPaths = [
      '/_next/static/development/_buildManifest.js',
      '/_next/static/chunks/app-pages-internals.js'
    ];
    const results = [];
    for (const path of nextPaths) {
      try {
        const u = new URL(path, baseUrl).toString();
        const res = await this.stealthEngine.stealthFetch(u);
        if (res && res.ok) {
          results.push(u);
        }
      } catch (e) {}
    }
    return results;
  }
}

// ================================================================
// 🎯 LIVE STATUS PROBER & SECURITY TRIAGE (v2.0)
// ================================================================

class StatusProber {
  constructor(stealthEngine) {
    this.stealthEngine = stealthEngine;
    this.isProbing = false;
  }

  async probeEndpoint(endpointUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let response;
      try {
        response = await fetch(endpointUrl, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EndpointHunter/2.0' }
        });
      } catch (err) {
        // Fallback to GET if HEAD method is blocked by target server
        response = await fetch(endpointUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EndpointHunter/2.0' }
        });
      }
      clearTimeout(timeoutId);

      const status = response.status;
      const statusText = response.statusText || '';
      const contentType = response.headers.get('content-type') || '';

      return {
        url: endpointUrl,
        status: status,
        statusText: statusText,
        contentType: contentType,
        accessible: status >= 200 && status < 400
      };
    } catch (e) {
      return {
        url: endpointUrl,
        status: 0,
        statusText: e.name === 'AbortError' ? 'Timeout' : 'Unreachable',
        contentType: '',
        accessible: false
      };
    }
  }

  classifyVulnerabilityParameters(urlStr) {
    const tags = [];
    try {
      const u = new URL(urlStr);
      for (const [key] of u.searchParams) {
        const k = key.toLowerCase();
        if (/^(url|redirect|dest|next|return|feed|domain|target|to|uri)$/i.test(k)) {
          tags.push({ param: key, tag: 'SSRF/OpenRedirect', color: 'danger' });
        }
        if (/^(id|user_id|uid|account|account_id|uuid|order|order_id|doc_id)$/i.test(k)) {
          tags.push({ param: key, tag: 'Potential IDOR', color: 'warning' });
        }
        if (/^(file|path|folder|doc|template|page|include)$/i.test(k)) {
          tags.push({ param: key, tag: 'Potential LFI', color: 'danger' });
        }
        if (/^(cmd|exec|command|query|search|filter|sort|eval)$/i.test(k)) {
          tags.push({ param: key, tag: 'Injection Surface', color: 'warning' });
        }
      }
      if (/\/(admin|superadmin|internal|audit|debug|metrics|actuator|graphql)\b/i.test(u.pathname)) {
        tags.push({ param: u.pathname, tag: 'Privileged Route', color: 'danger' });
      }
    } catch (e) {}
    return tags;
  }
}

// ================================================================
// 🔥 ENDPOINT PATTERNS DATABASE (OLD - PRESERVED)
// ================================================================


// ================================================================
// 🔑 GLOBAL AUTHENTICATION & CUSTOM HEADERS CONFIGURATION (v3.0)
// ================================================================

let GLOBAL_AUTH = {
  authorization: '',
  cookie: '',
  customHeaderName1: '',
  customHeaderValue1: '',
  customHeaderName2: '',
  customHeaderValue2: ''
};

function getMergedHeaders(customHeaders = {}) {
  const merged = { ...customHeaders };
  if (GLOBAL_AUTH.authorization && GLOBAL_AUTH.authorization.trim()) {
    merged['Authorization'] = GLOBAL_AUTH.authorization.trim();
  }
  if (GLOBAL_AUTH.cookie && GLOBAL_AUTH.cookie.trim()) {
    merged['Cookie'] = GLOBAL_AUTH.cookie.trim();
  }
  if (GLOBAL_AUTH.customHeaderName1 && GLOBAL_AUTH.customHeaderValue1) {
    merged[GLOBAL_AUTH.customHeaderName1.trim()] = GLOBAL_AUTH.customHeaderValue1.trim();
  }
  if (GLOBAL_AUTH.customHeaderName2 && GLOBAL_AUTH.customHeaderValue2) {
    merged[GLOBAL_AUTH.customHeaderName2.trim()] = GLOBAL_AUTH.customHeaderValue2.trim();
  }
  return merged;
}

// ================================================================
// 🗺️ SOURCE-MAP UNPACKER & HIDDEN ROUTE EXTRACTOR (v3.0)
// ================================================================

class SourceMapUnpacker {
  constructor(stealthEngine) {
    this.stealthEngine = stealthEngine;
    this.unpackedCache = new Map();
  }

  async unpack(mapUrl) {
    if (!mapUrl) throw new Error('Missing source map URL');
    if (this.unpackedCache.has(mapUrl)) {
      return this.unpackedCache.get(mapUrl);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const headers = getMergedHeaders({
        'Accept': 'application/json, text/plain, */*'
      });

      const response = await fetch(mapUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' ' + response.statusText);
      }

      const mapData = await response.json();
      const sources = Array.isArray(mapData.sources) ? mapData.sources : [];
      const sourcesContent = Array.isArray(mapData.sourcesContent) ? mapData.sourcesContent : [];

      const routesFound = new Set();
      const apiEndpoints = [];
      const interestingFiles = [];
      const candidateSecrets = [];

      for (let i = 0; i < sources.length; i++) {
        const filePath = sources[i];
        if (/(api|routes|controllers|services|auth|admin|handlers|graphql)/i.test(filePath)) {
          interestingFiles.push(filePath);
        }

        if (sourcesContent[i] && typeof sourcesContent[i] === 'string') {
          const codeStr = sourcesContent[i];

          const routeMatches = codeStr.matchAll(/['"`](\/(api|v[0-9]|auth|admin|user|graphql|v1|v2|v3)\/[a-zA-Z0-9_\-\/]+)['"`]/g);
          for (const m of routeMatches) {
            const r = m[1];
            if (r && r.length < 120 && !routesFound.has(r)) {
              routesFound.add(r);
              apiEndpoints.push({
                url: r,
                source: filePath,
                type: 'source-map'
              });
            }
          }

          const secretMatches = codeStr.matchAll(/(api_key|apiKey|secret|private_key|token|jwt|aws_secret)['"\s:]+['"`]([a-zA-Z0-9_\-\.]{16,})['"`]/gi);
          for (const sm of secretMatches) {
            candidateSecrets.push({
              key: sm[1],
              match: sm[2].substring(0, 4) + '...' + sm[2].substring(sm[2].length - 4),
              sourceFile: filePath
            });
          }
        }
      }

      const result = {
        url: mapUrl,
        totalFiles: sources.length,
        sources: sources.slice(0, 300),
        interestingFiles: interestingFiles.slice(0, 100),
        routesFound: Array.from(routesFound),
        apiEndpoints: apiEndpoints.slice(0, 100),
        candidateSecrets: candidateSecrets.slice(0, 20),
        hasSourcesContent: sourcesContent.length > 0
      };

      this.unpackedCache.set(mapUrl, result);
      return result;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }
}

// ================================================================
// 🌸 GRAPHQL SCHEMA INTROSPECTOR & GENERATOR (v3.0)
// ================================================================

class GraphQLIntrospector {
  constructor(stealthEngine) {
    this.stealthEngine = stealthEngine;
    this.introspectionQuery = `query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      name
      kind
      description
      fields(includeDeprecated: false) {
        name
        description
        args {
          name
          type {
            name
            kind
            ofType { name kind ofType { name } }
          }
          defaultValue
        }
        type {
          name
          kind
          ofType { name kind ofType { name } }
        }
      }
    }
  }
}`.trim();
  }

  async introspect(endpointUrl, customHeaders = {}) {
    if (!endpointUrl) throw new Error('Missing GraphQL endpoint URL');

    const headers = getMergedHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let response;
    try {
      response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: this.introspectionQuery,
          operationName: 'IntrospectionQuery'
        }),
        signal: controller.signal
      });
    } catch (e) {
      try {
        const u = new URL(endpointUrl);
        u.searchParams.set('query', this.introspectionQuery);
        response = await fetch(u.toString(), {
          method: 'GET',
          headers,
          signal: controller.signal
        });
      } catch (err2) {
        clearTimeout(timeout);
        throw e;
      }
    }
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }

    const json = await response.json();
    if (!json.data || !json.data.__schema) {
      const errStr = json.errors ? json.errors.map(e => e.message).join('; ') : 'Introspection not supported or disabled';
      return {
        enabled: false,
        url: endpointUrl,
        error: errStr,
        queries: [],
        mutations: [],
        types: []
      };
    }

    const schema = json.data.__schema;
    const queryTypeName = schema.queryType ? schema.queryType.name : 'Query';
    const mutationTypeName = schema.mutationType ? schema.mutationType.name : 'Mutation';

    const queries = [];
    const mutations = [];
    const customTypes = [];

    const types = schema.types || [];
    for (const t of types) {
      if (t.name.startsWith('__')) continue;

      if (t.name === queryTypeName && t.fields) {
        for (const f of t.fields) {
          queries.push({
            name: f.name,
            description: f.description || '',
            args: (f.args || []).map(a => ({
              name: a.name,
              type: this.formatType(a.type),
              defaultValue: a.defaultValue
            })),
            returnType: this.formatType(f.type),
            sampleQuery: this.buildSampleQuery(f.name, f.args, f.type)
          });
        }
      } else if (t.name === mutationTypeName && t.fields) {
        for (const f of t.fields) {
          mutations.push({
            name: f.name,
            description: f.description || '',
            args: (f.args || []).map(a => ({
              name: a.name,
              type: this.formatType(a.type),
              defaultValue: a.defaultValue
            })),
            returnType: this.formatType(f.type),
            sampleMutation: this.buildSampleMutation(f.name, f.args)
          });
        }
      } else if (t.kind === 'OBJECT' || t.kind === 'INTERFACE') {
        customTypes.push({
          name: t.name,
          kind: t.kind,
          description: t.description || '',
          fieldsCount: t.fields ? t.fields.length : 0
        });
      }
    }

    return {
      enabled: true,
      url: endpointUrl,
      queries,
      mutations,
      types: customTypes.slice(0, 50),
      stats: {
        totalQueries: queries.length,
        totalMutations: mutations.length,
        totalTypes: customTypes.length
      }
    };
  }

  formatType(typeObj) {
    if (!typeObj) return 'unknown';
    if (typeObj.name) return typeObj.name;
    if (typeObj.ofType) {
      if (typeObj.kind === 'NON_NULL') return this.formatType(typeObj.ofType) + '!';
      if (typeObj.kind === 'LIST') return '[' + this.formatType(typeObj.ofType) + ']';
      return this.formatType(typeObj.ofType);
    }
    return typeObj.kind || 'unknown';
  }

  buildSampleQuery(fieldName, args = [], returnTypeObj) {
    const argsStr = args.length > 0
      ? '(' + args.map(a => a.name + ': "' + (a.defaultValue || 'test') + '"').join(', ') + ')'
      : '';
    return 'query {\n  ' + fieldName + argsStr + ' {\n    __typename\n  }\n}';
  }

  buildSampleMutation(fieldName, args = []) {
    const argsStr = args.length > 0
      ? '(' + args.map(a => a.name + ': "' + (a.defaultValue || 'test') + '"').join(', ') + ')'
      : '';
    return 'mutation {\n  ' + fieldName + argsStr + ' {\n    __typename\n  }\n}';
  }
}

// ================================================================
// 🧪 IN-BROWSER MINI-REPEATER (v3.0)
// ================================================================

class MiniRepeater {
  constructor() {}

  async sendRequest({ url, method = 'GET', headers = {}, body = null }) {
    if (!url) throw new Error('Missing URL');

    const cleanMethod = (method || 'GET').toUpperCase();
    const finalHeaders = getMergedHeaders(headers);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const startTime = performance.now();
    try {
      const options = {
        method: cleanMethod,
        headers: finalHeaders,
        signal: controller.signal
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(cleanMethod) && body !== null && body !== undefined && body !== '') {
        options.body = typeof body === 'object' ? JSON.stringify(body) : String(body);
      }

      const response = await fetch(url, options);
      const latencyMs = Math.round(performance.now() - startTime);
      clearTimeout(timeout);

      const status = response.status;
      const statusText = response.statusText;
      const contentType = response.headers.get('content-type') || '';

      const respHeaders = {};
      response.headers.forEach((val, key) => {
        respHeaders[key] = val;
      });

      let rawText = '';
      try {
        rawText = await response.text();
      } catch (e) {
        rawText = '[Could not decode body response]';
      }

      let formattedBody = rawText;
      if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(rawText);
          formattedBody = JSON.stringify(parsed, null, 2);
        } catch (e) {}
      }

      return {
        success: true,
        status,
        statusText,
        latencyMs,
        headers: respHeaders,
        body: formattedBody,
        sizeBytes: new Blob([rawText]).size,
        contentType
      };
    } catch (err) {
      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        status: 0,
        statusText: err.name === 'AbortError' ? 'Timeout (20s)' : (err.message || 'Network Error'),
        latencyMs,
        headers: {},
        body: 'Error: ' + err.message,
        sizeBytes: 0,
        contentType: ''
      };
    }
  }
}

// ================================================================
// 🕷️ MICRO-FUZZER & ROUTE DICTIONARY DISCOVERY ENGINE (v3.0)
// ================================================================

class MicroFuzzer {
  constructor(stealthEngine) {
    this.stealthEngine = stealthEngine;
    this.isFuzzing = false;
    this.results = [];

    this.wordlists = {
      apidocs: [
        '/swagger.json', '/swagger/v1/swagger.json', '/api-docs',
        '/v2/api-docs', '/v3/api-docs', '/openapi.json',
        '/openapi.yaml', '/swagger-ui.html', '/swagger/index.html',
        '/docs', '/api/docs', '/api/swagger'
      ],
      actuators: [
        '/actuator', '/actuator/health', '/actuator/info',
        '/actuator/env', '/actuator/mappings', '/actuator/metrics',
        '/actuator/prometheus', '/actuator/beans', '/health',
        '/healthz', '/livez', '/readyz', '/status', '/metrics'
      ],
      admin: [
        '/admin', '/admin/login', '/administrator', '/console',
        '/dashboard', '/internal', '/management', '/backend',
        '/control', '/master', '/cpanel'
      ],
      gitconfig: [
        '/.env', '/.git/HEAD', '/.gitignore', '/config.json',
        '/settings.json', '/robots.txt', '/sitemap.xml',
        '/.well-known/security.txt', '/crossdomain.xml',
        '/web.config', '/composer.json'
      ],
      graphql: [
        '/graphql', '/graphiql', '/api/graphql', '/v1/graphql',
        '/v2/graphql', '/altair', '/playground', '/debug', '/trace'
      ]
    };
  }

  async startFuzzing(baseUrlStr, category = 'all', delay = 250, onHit = null, onProgress = null) {
    if (this.isFuzzing) return;
    this.isFuzzing = true;
    this.results = [];

    let paths = [];
    if (category === 'all') {
      paths = Object.values(this.wordlists).flat();
    } else if (this.wordlists[category]) {
      paths = this.wordlists[category];
    } else {
      paths = Object.values(this.wordlists).flat();
    }

    paths = Array.from(new Set(paths));

    let parsedBase;
    try {
      parsedBase = new URL(baseUrlStr);
    } catch (e) {
      this.isFuzzing = false;
      throw new Error('Invalid base URL for fuzzer');
    }

    let tested = 0;
    for (const p of paths) {
      if (!this.isFuzzing) break;

      const targetUrl = new URL(p, parsedBase.origin).toString();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const headers = getMergedHeaders({
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EndpointHunter/3.0'
        });

        let response;
        try {
          response = await fetch(targetUrl, {
            method: 'HEAD',
            headers,
            signal: controller.signal
          });
        } catch (e) {
          response = await fetch(targetUrl, {
            method: 'GET',
            headers,
            signal: controller.signal
          });
        }
        clearTimeout(timeout);

        const status = response.status;
        const contentType = response.headers.get('content-type') || '';
        const contentLength = response.headers.get('content-length') || '0';

        if (status !== 404 && status !== 0) {
          const hit = {
            url: targetUrl,
            path: p,
            status,
            contentType,
            contentLength,
            isInteresting: (status >= 200 && status < 400) || status === 401 || status === 403
          };
          this.results.push(hit);
          if (onHit) onHit(hit);
        }
      } catch (err) {}

      tested++;
      if (onProgress) {
        onProgress({
          tested,
          total: paths.length,
          percent: Math.round((tested / paths.length) * 100)
        });
      }

      await new Promise(r => setTimeout(r, delay));
    }

    this.isFuzzing = false;
    return this.results;
  }

  stopFuzzing() {
    this.isFuzzing = false;
  }
}

// ================================================================
// 🔍 IN-BROWSER PARAMETER MINER (v4.0)
// ================================================================

class ParameterMiner {
  constructor(stealthEngine) {
    this.stealthEngine = stealthEngine;
    this.commonParams = [
      'debug', 'admin', 'test', 'redirect', 'url', 'dest', 'next',
      'id', 'user_id', 'uid', 'account', 'token', 'key', 'api_key',
      'role', 'source', 'view', 'format', 'export', 'callback',
      'mode', 'enable', 'disable', 'env', 'action', 'show', 'filter',
      'query', 'search', 'file', 'path', 'template', 'include'
    ];
    this.isMining = false;
  }

  async mineParameters(targetUrlStr, delay = 180, onProgress = null) {
    this.isMining = true;
    const discovered = [];

    let parsedBase;
    try {
      parsedBase = new URL(targetUrlStr);
    } catch (e) {
      this.isMining = false;
      throw new Error('Invalid URL for parameter mining');
    }

    let baselineLength = 0;
    let baselineStatus = 0;
    try {
      const baseRes = await fetch(parsedBase.toString(), {
        method: 'GET',
        headers: getMergedHeaders({ 'User-Agent': 'Mozilla/5.0 EndpointHunter/4.0' })
      });
      baselineStatus = baseRes.status;
      const baseText = await baseRes.text();
      baselineLength = baseText.length;
    } catch (e) {}

    let count = 0;
    for (const param of this.commonParams) {
      if (!this.isMining) break;

      const probeUrl = new URL(parsedBase.toString());
      const testVal = 'eh_' + Math.random().toString(36).substring(2, 7);
      probeUrl.searchParams.set(param, testVal);

      try {
        const res = await fetch(probeUrl.toString(), {
          method: 'GET',
          headers: getMergedHeaders({ 'User-Agent': 'Mozilla/5.0 EndpointHunter/4.0' })
        });
        const text = await res.text();
        const diffLength = Math.abs(text.length - baselineLength);
        const reflected = text.includes(testVal);
        const statusDiff = res.status !== baselineStatus;

        if (reflected || statusDiff || diffLength > 40) {
          discovered.push({
            parameter: param,
            status: res.status,
            reflected,
            lengthDiff: diffLength,
            confidence: reflected ? 'HIGH (Reflected)' : (statusDiff ? 'HIGH (Status Changed)' : 'MEDIUM (Length Varied)')
          });
        }
      } catch (err) {}

      count++;
      if (onProgress) {
        onProgress({
          tested: count,
          total: this.commonParams.length,
          percent: Math.round((count / this.commonParams.length) * 100)
        });
      }

      await new Promise(r => setTimeout(r, delay));
    }

    this.isMining = false;
    return {
      targetUrl: targetUrlStr,
      baselineStatus,
      baselineLength,
      discovered
    };
  }

  stopMining() {
    this.isMining = false;
  }
}




// ================================================================
// 🛡️ CORSAuditor (v5.0) - ACTIVE ORIGIN REFLECTION & CREDENTIAL AUDITOR
// ================================================================
class CORSAuditor {
  constructor(stealthEngine) {
    this.stealth = stealthEngine;
  }

  async auditCORS(targetUrl, testOrigin = 'https://evil-attacker.com') {
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      
      const headers = {
        'Origin': testOrigin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-Custom-Header, Authorization'
      };

      const resp = await fetch(targetUrl, {
        method: 'OPTIONS',
        headers
      }).catch(async () => {
        return await fetch(targetUrl, {
          method: 'GET',
          headers: { 'Origin': testOrigin }
        });
      });

      const acao = resp.headers.get('access-control-allow-origin') || null;
      const acac = resp.headers.get('access-control-allow-credentials') || null;
      const acam = resp.headers.get('access-control-allow-methods') || null;
      const acah = resp.headers.get('access-control-allow-headers') || null;

      let isVulnerable = false;
      let severity = 'INFO';
      let title = 'CORS Secure / Strict';
      let details = 'No arbitrary origin reflection or credential exposure detected.';

      if (acao === testOrigin && acac === 'true') {
        isVulnerable = true;
        severity = 'CRITICAL';
        title = 'Arbitrary Origin Reflection with Credentials (ACAC: true)';
        details = 'The server reflects arbitrary Origin (' + testOrigin + ') AND allows credentials. An attacker can perform authenticated cross-origin data theft!';
      } else if (acao === 'null' && acac === 'true') {
        isVulnerable = true;
        severity = 'HIGH';
        title = 'Null Origin Trusted with Credentials';
        details = 'The server trusts Origin: null with credentials. Sandboxed iframes can exploit this.';
      } else if (acao === '*') {
        if (acac === 'true') {
          isVulnerable = true;
          severity = 'HIGH';
          title = 'Wildcard ACAO with Credentials';
          details = 'Wildcard origin with credentials requested (blocked by modern browsers, but indicates serious server misconfiguration).';
        } else {
          severity = 'LOW';
          title = 'Public Wildcard ACAO';
          details = 'Resource is publicly accessible to any origin without credentials.';
        }
      } else if (acao === testOrigin) {
        isVulnerable = true;
        severity = 'MEDIUM';
        title = 'Origin Reflection (No ACAC)';
        details = 'Arbitrary origin ' + testOrigin + ' reflected, but credentials are not explicitly allowed. Unauthenticated data leakage may still occur.';
      }

      const curlProof = 'curl -i -X OPTIONS "' + targetUrl + '" -H "Origin: ' + testOrigin + '" -H "Access-Control-Request-Method: GET"';

      return {
        url: targetUrl,
        testedOrigin: testOrigin,
        status: resp.status,
        acao,
        acac,
        acam,
        acah,
        isVulnerable,
        severity,
        title,
        details,
        curlProof
      };
    } catch (e) {
      return {
        url: targetUrl,
        error: e.message,
        isVulnerable: false,
        severity: 'ERROR',
        title: 'CORS Probe Failed',
        details: e.message
      };
    }
  }
}

// ================================================================
// 🔑 JWTInspector (v5.0) - REAL-TIME BASE64URL DECODER & WEAK CLAIM AUDITOR
// ================================================================
class JWTInspector {
  decodeBase64Url(str) {
    try {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
  }

  inspect(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Empty or invalid token string' };
    }
    const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
    const parts = cleanToken.split('.');
    if (parts.length < 2) {
      return { valid: false, error: 'Not a valid JWT (requires at least Header.Payload)' };
    }

    try {
      const headerStr = this.decodeBase64Url(parts[0]);
      const payloadStr = this.decodeBase64Url(parts[1]);
      const header = JSON.parse(headerStr);
      const payload = JSON.parse(payloadStr);

      const alg = header.alg || 'unknown';
      const issues = [];

      if (['none', 'None', 'NONE'].includes(alg)) {
        issues.push({
          severity: 'CRITICAL',
          message: 'Algorithm is "none"! Signatures are not enforced.'
        });
      }

      if (alg.toUpperCase() === 'HS256' || alg.toUpperCase() === 'HS384' || alg.toUpperCase() === 'HS512') {
        issues.push({
          severity: 'INFO',
          message: 'HMAC Symmetric Algorithm (' + alg + ') used. Weak secrets can be cracked offline with Hashcat/John.'
        });
      }

      let isExpired = false;
      let expDate = null;
      if (payload.exp) {
        expDate = new Date(payload.exp * 1000).toISOString();
        if (Date.now() / 1000 > payload.exp) {
          isExpired = true;
          issues.push({
            severity: 'WARNING',
            message: 'Token has expired on ' + expDate
          });
        }
      } else {
        issues.push({
          severity: 'MEDIUM',
          message: 'Token does not have an "exp" (expiration) claim! It may never expire.'
        });
      }

      const sensitiveKeys = ['role', 'roles', 'admin', 'is_admin', 'superuser', 'privileges', 'scopes', 'email', 'user_id', 'id'];
      const foundClaims = {};
      sensitiveKeys.forEach(k => {
        if (k in payload) foundClaims[k] = payload[k];
      });

      const noneHeader = btoa(JSON.stringify({ ...header, alg: 'none' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const algNoneVector = noneHeader + '.' + parts[1] + '.';
      const nullSigVector = parts[0] + '.' + parts[1] + '.';

      return {
        valid: true,
        alg,
        isExpired,
        expDate,
        header,
        payload,
        foundClaims,
        issues,
        attackVectors: [
          { name: 'Alg: None Bypass', token: algNoneVector, description: 'Token with header alg="none" and stripped signature.' },
          { name: 'Empty Signature', token: nullSigVector, description: 'Token with original header/payload and signature removed.' }
        ]
      };
    } catch (e) {
      return { valid: false, error: 'JWT Parse Error: ' + e.message };
    }
  }
}

// ================================================================
// 🛡️ SecurityHeadersAnalyzer (v5.0) - CLICKJACKING, CSP & MIME AUDITOR
// ================================================================
class SecurityHeadersAnalyzer {
  analyzeHeaders(url, headerMap) {
    const headers = {};
    for (const [k, v] of Object.entries(headerMap || {})) {
      headers[k.toLowerCase()] = v;
    }

    let score = 100;
    const findings = [];
    const missing = [];

    const csp = headers['content-security-policy'];
    if (!csp) {
      score -= 25;
      missing.push('Content-Security-Policy');
      findings.push({
        severity: 'HIGH',
        header: 'Content-Security-Policy',
        issue: 'Missing CSP allows Cross-Site Scripting (XSS) and data injection attacks.',
        recommendation: "Implement a strict CSP e.g. default-src 'self'; script-src 'self' 'nonce-...';"
      });
    } else {
      if (csp.includes("'unsafe-inline'")) {
        score -= 10;
        findings.push({
          severity: 'MEDIUM',
          header: 'Content-Security-Policy',
          issue: "CSP allows 'unsafe-inline', weakening protection against XSS.",
          recommendation: "Remove 'unsafe-inline' and adopt nonces or hashes for scripts."
        });
      }
      if (csp.includes("'unsafe-eval'")) {
        score -= 8;
        findings.push({
          severity: 'LOW',
          header: 'Content-Security-Policy',
          issue: "CSP allows 'unsafe-eval' (eval(), Function() execution).",
          recommendation: "Avoid string-to-code execution APIs."
        });
      }
      if (csp.includes('*') && !csp.includes('https://*')) {
        score -= 10;
        findings.push({
          severity: 'MEDIUM',
          header: 'Content-Security-Policy',
          issue: 'CSP contains wildcard (*) source directive.',
          recommendation: 'Restricted explicit origin allowlist is recommended.'
        });
      }
    }

    const hsts = headers['strict-transport-security'];
    if (url.startsWith('https://')) {
      if (!hsts) {
        score -= 20;
        missing.push('Strict-Transport-Security');
        findings.push({
          severity: 'HIGH',
          header: 'Strict-Transport-Security',
          issue: 'Missing HSTS header leaves users susceptible to SSL stripping and downgrade attacks.',
          recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload'
        });
      } else {
        const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
        const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
        if (maxAge < 10368000) {
          score -= 5;
          findings.push({
            severity: 'LOW',
            header: 'Strict-Transport-Security',
            issue: 'HSTS max-age (' + maxAge + 's) is shorter than recommended 120 days.',
            recommendation: 'Set max-age to at least 31536000 (1 year).'
          });
        }
      }
    }

    const xfo = headers['x-frame-options'];
    if (!xfo && (!csp || !csp.includes('frame-ancestors'))) {
      score -= 15;
      missing.push('X-Frame-Options');
      findings.push({
        severity: 'MEDIUM',
        header: 'X-Frame-Options',
        issue: 'Missing X-Frame-Options allows UI Redressing / Clickjacking attacks.',
        recommendation: "Set X-Frame-Options: DENY or SAMEORIGIN (or CSP frame-ancestors 'self')."
      });
    }

    const xcto = headers['x-content-type-options'];
    if (!xcto || xcto.toLowerCase() !== 'nosniff') {
      score -= 15;
      missing.push('X-Content-Type-Options');
      findings.push({
        severity: 'MEDIUM',
        header: 'X-Content-Type-Options',
        issue: 'Missing nosniff flag permits browsers to MIME-sniff responses into executable formats.',
        recommendation: 'Add X-Content-Type-Options: nosniff'
      });
    }

    const ref = headers['referrer-policy'];
    if (!ref) {
      score -= 10;
      missing.push('Referrer-Policy');
      findings.push({
        severity: 'LOW',
        header: 'Referrer-Policy',
        issue: 'Missing Referrer-Policy may leak path and query parameters to third-party domains.',
        recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin'
      });
    }

    const perm = headers['permissions-policy'] || headers['feature-policy'];
    if (!perm) {
      score -= 5;
      missing.push('Permissions-Policy');
      findings.push({
        severity: 'INFO',
        header: 'Permissions-Policy',
        issue: 'Missing Permissions-Policy leaves browser hardware/sensor APIs unconstrained.',
        recommendation: 'Add Permissions-Policy: camera=(), microphone=(), geolocation=()'
      });
    }

    score = Math.max(0, Math.min(100, score));
    let grade = 'F';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 55) grade = 'C';
    else if (score >= 40) grade = 'D';

    return {
      url,
      score,
      grade,
      missing,
      findings,
      rawHeaders: headers
    };
  }
}

// ================================================================
// 📜 SwaggerImporter (v5.0) - LIVE SWAGGER 2.0 / OPENAPI 3.0 PARSER
// ================================================================
class SwaggerImporter {
  constructor(hunterInstance) {
    this.hunter = hunterInstance;
  }

  async importFromUrl(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' when fetching spec');
    const json = await res.json();
    return this.importFromJson(json, url);
  }

  importFromJson(spec, sourceUrl = 'swagger-spec') {
    if (!spec || typeof spec !== 'object') {
      throw new Error('Invalid OpenAPI/Swagger object');
    }

    let title = (spec.info && spec.info.title) || 'API Specification';
    let version = (spec.info && spec.info.version) || '1.0';
    let basePath = '';

    if (Array.isArray(spec.servers) && spec.servers.length > 0 && spec.servers[0].url) {
      basePath = spec.servers[0].url;
    } else if (spec.basePath) {
      basePath = (spec.schemes ? spec.schemes[0] + '://' : 'https://') + (spec.host || '') + spec.basePath;
    }

    const discovered = [];
    const paths = spec.paths || {};

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      if (!pathObj || typeof pathObj !== 'object') continue;

      const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
      for (const method of methods) {
        if (pathObj[method]) {
          const op = pathObj[method];
          const fullEndpoint = basePath ? (basePath.replace(/\/$/, '') + '/' + pathKey.replace(/^\//, '')) : pathKey;
          const category = (op.tags && op.tags[0]) || 'api';
          const summary = op.summary || op.description || (method.toUpperCase() + ' ' + pathKey);

          const params = [];
          if (Array.isArray(op.parameters)) {
            op.parameters.forEach(p => {
              if (p && p.name) {
                params.push({ name: p.name, in: p.in || 'query', required: !!p.required });
                if (this.hunter && this.hunter.discoveredParams) {
                  this.hunter.discoveredParams.add(p.name);
                }
              }
            });
          }

          discovered.push({
            url: fullEndpoint,
            method: method.toUpperCase(),
            type: category,
            source: 'swagger-spec',
            summary,
            params
          });

          if (this.hunter) {
            this.hunter.addEndpoint({
              url: fullEndpoint,
              method: method.toUpperCase(),
              type: category,
              source: 'swagger-spec',
              foundOn: sourceUrl
            });
            if (this.hunter.discoveredPaths) {
              this.hunter.discoveredPaths.add(pathKey);
            }
          }
        }
      }
    }

    if (this.hunter) {
      this.hunter.totalEndpoints = this.hunter.discoveredEndpoints.length;
      this.hunter.totalPaths = this.hunter.discoveredPaths.size;
      this.hunter.totalParams = this.hunter.discoveredParams.size;
      this.hunter.addLog('📜 Imported ' + discovered.length + ' endpoints from ' + title + ' v' + version, 'success');
    }

    return {
      title,
      version,
      count: discovered.length,
      endpoints: discovered
    };
  }
}

// ================================================================
// 💳 PIIHeuristicDetector (v5.0) - CREDIT CARDS, SSNs, EMAILS & PHONES
// ================================================================
class PIIHeuristicDetector {
  checkLuhn(value) {
    const sanitized = value.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(sanitized)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  scan(text, sourceUrl = '') {
    if (!text || typeof text !== 'string') return [];
    const results = [];
    const seen = new Set();

    const ccRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|2(?:22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[01][0-9]|720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
    let match;
    while ((match = ccRegex.exec(text)) !== null) {
      const num = match[0];
      if (this.checkLuhn(num) && !seen.has(num)) {
        seen.add(num);
        const masked = num.substring(0, 4) + '-XXXX-XXXX-' + num.substring(num.length - 4);
        results.push({
          type: 'Credit Card',
          preview: masked,
          source: sourceUrl,
          severity: 'CRITICAL',
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }

    const ssnRegex = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;
    while ((match = ssnRegex.exec(text)) !== null) {
      const ssn = match[0];
      if (!seen.has(ssn)) {
        seen.add(ssn);
        results.push({
          type: 'US SSN',
          preview: 'XXX-XX-' + ssn.substring(ssn.length - 4),
          source: sourceUrl,
          severity: 'CRITICAL',
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }

    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g;
    while ((match = emailRegex.exec(text)) !== null) {
      const email = match[0];
      if (!email.endsWith('.png') && !email.endsWith('.jpg') && !email.endsWith('.svg') && !seen.has(email)) {
        seen.add(email);
        results.push({
          type: 'Email Address',
          preview: email,
          source: sourceUrl,
          severity: 'MEDIUM',
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }

    return results;
  }
}

// ================================================================
// ⚡ VerbTamperMatrix (v5.0) - HTTP METHOD AUTHENTICATION BYPASS MATRIX
// ================================================================
class VerbTamperMatrix {
  constructor(stealthEngine) {
    this.stealth = stealthEngine;
  }

  async testEndpoint(targetUrl, headers = {}) {
    const verbs = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const results = [];

    for (const method of verbs) {
      try {
        const resp = await fetch(targetUrl, {
          method,
          headers
        });
        const len = resp.headers.get('content-length') || '0';
        results.push({
          method,
          status: resp.status,
          statusText: resp.statusText,
          length: len,
          contentType: resp.headers.get('content-type') || 'none'
        });
      } catch (e) {
        results.push({
          method,
          status: 0,
          statusText: e.message,
          length: 0,
          contentType: 'error'
        });
      }
      await new Promise(r => setTimeout(r, 120));
    }

    const getRes = results.find(r => r.method === 'GET');
    const anomalies = [];
    let bypassDetected = false;

    if (getRes && (getRes.status === 401 || getRes.status === 403)) {
      results.forEach(r => {
        if (r.method !== 'GET' && (r.status === 200 || r.status === 201 || r.status === 204)) {
          bypassDetected = true;
          anomalies.push('Potential Auth Bypass: GET returned ' + getRes.status + ', but ' + r.method + ' returned ' + r.status + '!');
        }
      });
    }

    return {
      targetUrl,
      results,
      bypassDetected,
      anomalies
    };
  }
}

// ================================================================
// 🎯 IDORSequencer (v5.0) - NUMERIC IDOR DIFFERENTIAL PROBER
// ================================================================
class IDORSequencer {
  constructor(stealthEngine) {
    this.stealth = stealthEngine;
  }

  extractNumericId(urlStr) {
    try {
      const u = new URL(urlStr);
      const qMatch = u.search.match(/(?:^|[?&])(id|user_id|uid|order_id|account_id|doc_id)=(\d+)/i);
      if (qMatch) {
        return {
          type: 'query',
          param: qMatch[1],
          originalId: parseInt(qMatch[2], 10),
          baseUrl: urlStr
        };
      }
      const pMatch = u.pathname.match(/(.*\/)(\d+)(\/?.*)$/);
      if (pMatch) {
        return {
          type: 'path',
          prefix: pMatch[1],
          originalId: parseInt(pMatch[2], 10),
          suffix: pMatch[3],
          baseUrl: urlStr
        };
      }
    } catch (e) {}
    return null;
  }

  async testIDOR(urlStr, offsets = [-2, -1, 1, 2], delay = 200) {
    const extracted = this.extractNumericId(urlStr);
    if (!extracted) {
      throw new Error('No numeric identifier found in URL query or path.');
    }

    let baselineResp;
    try {
      const bRes = await fetch(urlStr);
      const text = await bRes.text();
      baselineResp = {
        id: extracted.originalId,
        status: bRes.status,
        length: text.length
      };
    } catch (e) {
      baselineResp = { id: extracted.originalId, status: 0, length: 0 };
    }

    const sequencedResults = [];
    let potentialVulnerability = false;

    for (const offset of offsets) {
      const testId = extracted.originalId + offset;
      if (testId <= 0) continue;

      let testUrl;
      if (extracted.type === 'query') {
        const u = new URL(urlStr);
        u.searchParams.set(extracted.param, testId.toString());
        testUrl = u.toString();
      } else {
        const u = new URL(urlStr);
        u.pathname = extracted.prefix + testId + extracted.suffix;
        testUrl = u.toString();
      }

      try {
        const res = await fetch(testUrl);
        const body = await res.text();
        const item = {
          id: testId,
          url: testUrl,
          status: res.status,
          length: body.length,
          deltaFromBaseline: body.length - baselineResp.length
        };

        if (res.status === 200 && baselineResp.status === 200 && body.length > 50) {
          potentialVulnerability = true;
        }

        sequencedResults.push(item);
      } catch (e) {
        sequencedResults.push({ id: testId, url: testUrl, status: 0, error: e.message });
      }

      await new Promise(r => setTimeout(r, delay));
    }

    return {
      originalUrl: urlStr,
      baseline: baselineResp,
      sequencedResults,
      potentialVulnerability
    };
  }
}

// ================================================================
// ☁️ CloudBucketCollector (v5.0) - S3, GCP & AZURE STORAGE AUDITOR
// ================================================================
class CloudBucketCollector {
  constructor(stealthEngine) {
    this.stealth = stealthEngine;
    this.buckets = new Map();
  }

  scanText(text, sourceUrl = '') {
    if (!text || typeof text !== 'string') return [];
    const discovered = [];

    const s3Regex = /(?:https?:\/\/)?([a-z0-9.\-_]{3,63})\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com/gi;
    let m;
    while ((m = s3Regex.exec(text)) !== null) {
      const name = m[1];
      if (!this.buckets.has(name) && !name.includes('...') && name.length >= 3) {
        const obj = {
          name,
          provider: 'AWS S3',
          url: 'https://' + name + '.s3.amazonaws.com',
          source: sourceUrl,
          status: 'UNPROBED',
          discoveredAt: new Date().toLocaleTimeString()
        };
        this.buckets.set(name, obj);
        discovered.push(obj);
      }
    }

    const gcpRegex = /(?:https?:\/\/)?storage\.googleapis\.com\/([a-z0-9.\-_]{3,63})/gi;
    while ((m = gcpRegex.exec(text)) !== null) {
      const name = m[1];
      if (!this.buckets.has(name)) {
        const obj = {
          name,
          provider: 'Google Cloud Storage',
          url: 'https://storage.googleapis.com/' + name,
          source: sourceUrl,
          status: 'UNPROBED',
          discoveredAt: new Date().toLocaleTimeString()
        };
        this.buckets.set(name, obj);
        discovered.push(obj);
      }
    }

    const azRegex = /(?:https?:\/\/)?([a-z0-9]{3,24})\.blob\.core\.windows\.net(?:\/([a-z0-9-_]+))?/gi;
    while ((m = azRegex.exec(text)) !== null) {
      const account = m[1];
      const container = m[2] || '';
      const key = account + '/' + container;
      if (!this.buckets.has(key)) {
        const obj = {
          name: key,
          provider: 'Azure Blob Storage',
          url: 'https://' + account + '.blob.core.windows.net/' + container,
          source: sourceUrl,
          status: 'UNPROBED',
          discoveredAt: new Date().toLocaleTimeString()
        };
        this.buckets.set(key, obj);
        discovered.push(obj);
      }
    }

    return discovered;
  }

  async probeBucket(bucketUrl) {
    try {
      const res = await fetch(bucketUrl, { method: 'GET' });
      const text = await res.text();

      if (text.includes('<ListBucketResult>') || text.includes('<EnumerationResults>')) {
        return { status: 'PUBLIC_LISTABLE', severity: 'CRITICAL', message: 'Bucket is PUBLICLY LISTABLE! Files and directories are exposed.' };
      }
      if (res.status === 200) {
        return { status: 'PUBLIC_READ', severity: 'HIGH', message: 'Bucket responds with HTTP 200 (Public Read).' };
      }
      if (res.status === 403 || text.includes('AccessDenied')) {
        return { status: 'ACCESS_DENIED', severity: 'INFO', message: 'Bucket exists but access is restricted (403 Access Denied).' };
      }
      if (res.status === 404 || text.includes('NoSuchBucket')) {
        return { status: 'DANGLING_BUCKET', severity: 'HIGH', message: 'Bucket does not exist (Potential Subdomain/Bucket Takeover!).' };
      }
      return { status: 'HTTP_' + res.status, severity: 'LOW', message: 'Returned HTTP ' + res.status };
    } catch (e) {
      return { status: 'ERROR', severity: 'LOW', message: e.message };
    }
  }
}

// ================================================================
// 🐚 BashCurlExporter (v5.0) - RECON SHELL SCRIPT GENERATOR
// ================================================================
class BashCurlExporter {
  generateScript(endpoints, globalAuth = {}, domain = 'target.com') {
    const lines = [
      '#!/usr/bin/env bash',
      '# =====================================================================',
      '# 🎯 ENDPOINT HUNTER - AUTOMATED RECON AUDIT SCRIPT',
      '# Target Domain: ' + domain,
      '# Generated: ' + new Date().toUTCString(),
      '# Total Endpoints: ' + endpoints.length,
      '# =====================================================================',
      '',
      'GREEN="\\033[0;32m"',
      'RED="\\033[0;31m"',
      'YELLOW="\\033[1;33m"',
      'BLUE="\\033[0;34m"',
      'CYAN="\\033[0;36m"',
      'NC="\\033[0m"',
      '',
      'DELAY=0.15',
      'TOTAL=' + endpoints.length,
      'COUNT=0',
      '',
      'echo -e "${CYAN}====================================================${NC}"',
      'echo -e "${CYAN}🚀 Starting Endpoint Hunter Audit on: ' + domain + '${NC}"',
      'echo -e "${CYAN}Total endpoints to probe: $TOTAL${NC}"',
      'echo -e "${CYAN}====================================================${NC}\\n"',
      ''
    ];

    let authHeaderPart = '';
    if (globalAuth && globalAuth.token) {
      authHeaderPart = '-H "Authorization: Bearer ' + globalAuth.token + '" ';
    } else if (globalAuth && globalAuth.apiKey) {
      authHeaderPart = '-H "X-API-Key: ' + globalAuth.apiKey + '" ';
    }

    endpoints.forEach(ep => {
      const url = ep.url;
      const method = ep.method || 'GET';
      lines.push('echo -ne "[PROBING] ' + method + ' ' + url + ' ... "');
      lines.push(
        'STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" -X "' + method + '" ' + authHeaderPart + '"' + url + '")'
      );
      lines.push('COUNT=$((COUNT + 1))');
      lines.push('if [ "$STATUS" -eq 200 ]; then');
      lines.push('  echo -e "${GREEN}[$STATUS OK]${NC} (${COUNT}/$TOTAL)"');
      lines.push('elif [ "$STATUS" -eq 401 ] || [ "$STATUS" -eq 403 ]; then');
      lines.push('  echo -e "${RED}[$STATUS FORBIDDEN]${NC} (${COUNT}/$TOTAL)"');
      lines.push('elif [ "$STATUS" -ge 300 ] && [ "$STATUS" -lt 400 ]; then');
      lines.push('  echo -e "${YELLOW}[$STATUS REDIRECT]${NC} (${COUNT}/$TOTAL)"');
      lines.push('else');
      lines.push('  echo -e "${BLUE}[$STATUS]${NC} (${COUNT}/$TOTAL)"');
      lines.push('fi');
      lines.push('sleep $DELAY');
      lines.push('');
    });

    lines.push('echo -e "\\n${GREEN}✅ Audit Complete! Checked $TOTAL endpoints.${NC}"');
    return lines.join('\n');
  }
}



// ================================================================
// 🌸 GraphQLAdvancedExploration (v6.0) - BATCH & FIELD LEAKAGE AUDITOR
// ================================================================
class GraphQLAdvancedExploration {
  constructor(stealthEngine) {
    this.stealth = stealthEngine;
  }

  generateBatchPayload(queries) {
    return JSON.stringify(queries.map(q => ({ query: q })));
  }

  async testBatchSupport(url, headers = {}) {
    const batchPayload = JSON.stringify([
      { query: '{ __typename }' },
      { query: '{ __typename }' }
    ]);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: batchPayload
      });
      const json = await res.json();
      const isBatchSupported = Array.isArray(json) && json.length === 2;
      return {
        url,
        batchSupported: isBatchSupported,
        severity: isBatchSupported ? 'HIGH' : 'INFO',
        message: isBatchSupported 
          ? 'GraphQL Batching is ENABLED! Vulnerable to batch brute-force and amplification DoS.' 
          : 'Batch execution rejected by server.',
        response: json
      };
    } catch (e) {
      return { url, batchSupported: false, error: e.message };
    }
  }

  async probeFieldSuggestions(url, invalidFieldName = 'nonExistentSecretFieldXYZ', headers = {}) {
    const query = '{ ' + invalidFieldName + ' }';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ query })
      });
      const json = await res.json();
      let suggestions = [];
      if (json.errors && Array.isArray(json.errors)) {
        json.errors.forEach(err => {
          const match = (err.message || '').match(/did you mean "([^"]+)"/i);
          if (match) suggestions.push(match[1]);
        });
      }
      return {
        url,
        suggestionsFound: suggestions.length > 0,
        suggestions,
        rawErrors: json.errors || []
      };
    } catch (e) {
      return { url, suggestionsFound: false, error: e.message };
    }
  }
}

// ================================================================
// 🌐 SubdomainTakeoverAnalyzer (v6.0) - DANGLING CNAME & POINTER AUDITOR
// ================================================================
class SubdomainTakeoverAnalyzer {
  constructor(stealthEngine) {
    this.stealth = stealthEngine;
    this.fingerprints = [
      { service: 'GitHub Pages', pattern: "There isn't a GitHub Pages site here", cname: 'github.io' },
      { service: 'AWS S3', pattern: "The specified bucket does not exist", cname: 's3.amazonaws.com' },
      { service: 'Heroku', pattern: "No such app", cname: 'herokudns.com' },
      { service: 'Fastly', pattern: "Fastly error: unknown domain", cname: 'fastly.net' },
      { service: 'Shopify', pattern: "Sorry, this shop is currently unavailable", cname: 'myshopify.com' },
      { service: 'Tumblr', pattern: "Whatever you were looking for doesn't seem to exist", cname: 'domains.tumblr.com' },
      { service: 'WordPress.com', pattern: "Do you want to register", cname: 'wordpress.com' },
      { service: 'Ghost', pattern: "The thing you were looking for is no longer here", cname: 'ghost.io' },
      { service: 'Bitbucket', pattern: "Repository not found", cname: 'bitbucket.io' },
      { service: 'Surge.sh', pattern: "project not found", cname: 'surge.sh' }
    ];
  }

  async checkTakeover(domainOrUrl) {
    let target = domainOrUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    try {
      const res = await fetch(target, { method: 'GET' });
      const text = await res.text();

      for (const fp of this.fingerprints) {
        if (text.includes(fp.pattern)) {
          return {
            target,
            isVulnerable: true,
            service: fp.service,
            severity: 'CRITICAL',
            matchedPattern: fp.pattern,
            message: 'CRITICAL: Dangling DNS pointer detected for ' + fp.service + '! Potential Subdomain Takeover.'
          };
        }
      }

      return {
        target,
        isVulnerable: false,
        severity: 'INFO',
        message: 'No dangling service takeover signatures detected on endpoint.'
      };
    } catch (e) {
      return { target, isVulnerable: false, error: e.message };
    }
  }
}

// ================================================================
// ↪️ OpenRedirectProbeEngine (v6.0) - PARAMETER REDIRECT AUDITOR
// ================================================================
class OpenRedirectProbeEngine {
  constructor(stealthEngine) {
    this.stealth = stealthEngine;
    this.redirectParams = [
      'redirect', 'redirect_uri', 'redirect_url', 'return', 'return_to',
      'return_url', 'next', 'url', 'dest', 'destination', 'target',
      'out', 'view', 'to', 'link', 'continue', 'checkout_url', 'r'
    ];
    this.payloads = [
      'https://evil-attacker.com',
      '//evil-attacker.com',
      '/\\evil-attacker.com',
      'https://target.com.evil-attacker.com'
    ];
  }

  extractRedirectCandidates(urlStr) {
    try {
      const u = new URL(urlStr);
      const candidates = [];
      for (const [k, v] of u.searchParams.entries()) {
        if (this.redirectParams.includes(k.toLowerCase()) || /redirect|return|next|url|dest/i.test(k)) {
          candidates.push(k);
        }
      }
      return candidates;
    } catch (e) {
      return [];
    }
  }

  async probeUrl(urlStr) {
    const candidates = this.extractRedirectCandidates(urlStr);
    if (candidates.length === 0) {
      return { url: urlStr, candidates: [], tested: false, message: 'No standard open redirect parameters in URL.' };
    }

    const findings = [];
    for (const param of candidates) {
      for (const payload of this.payloads) {
        try {
          const testUrl = new URL(urlStr);
          testUrl.searchParams.set(param, payload);

          const res = await fetch(testUrl.toString(), {
            method: 'GET',
            redirect: 'manual'
          });

          const location = res.headers.get('location') || '';
          if (location.includes('evil-attacker.com')) {
            findings.push({
              param,
              payload,
              status: res.status,
              location,
              severity: 'HIGH',
              message: 'Open Redirect confirmed on parameter "' + param + '"! Reflects: ' + location
            });
            break;
          }
        } catch (e) {}
      }
    }

    return {
      url: urlStr,
      candidates,
      tested: true,
      isVulnerable: findings.length > 0,
      findings
    };
  }
}

// ================================================================
// 🔑 OAuthFlowAuditor (v6.0) - STATE & REDIRECT_URI AUDITOR
// ================================================================
class OAuthFlowAuditor {
  auditOAuthUrl(urlStr) {
    try {
      const u = new URL(urlStr);
      const isAuthEndpoint = /authorize|oauth\/auth|oauth2\/auth|login\/oauth/i.test(u.pathname);
      if (!isAuthEndpoint) {
        return { isOAuth: false, url: urlStr, message: 'Endpoint is not recognized as an OAuth authorization endpoint.' };
      }

      const issues = [];
      const state = u.searchParams.get('state');
      const responseType = u.searchParams.get('response_type');
      const redirectUri = u.searchParams.get('redirect_uri');
      const clientId = u.searchParams.get('client_id');
      const scope = u.searchParams.get('scope');

      if (!state) {
        issues.push({
          severity: 'HIGH',
          title: 'Missing State Parameter (OAuth CSRF)',
          details: 'The authorization request lacks a "state" anti-CSRF token. An attacker can bind their account to the victim session.'
        });
      }

      if (responseType === 'token') {
        issues.push({
          severity: 'MEDIUM',
          title: 'OAuth Implicit Grant Used (response_type=token)',
          details: 'Implicit flow leaks access tokens via URL fragment (#access_token=...) into browser history and Referer headers. Authorization Code with PKCE is strongly recommended.'
        });
      }

      if (redirectUri && (redirectUri.startsWith('http://') && !redirectUri.includes('localhost'))) {
        issues.push({
          severity: 'HIGH',
          title: 'Insecure Plaintext Redirect URI (HTTP)',
          details: 'redirect_uri transmits auth tokens/codes over plaintext HTTP!'
        });
      }

      return {
        isOAuth: true,
        url: urlStr,
        clientId,
        responseType,
        redirectUri,
        scope,
        hasState: !!state,
        issues,
        isVulnerable: issues.length > 0
      };
    } catch (e) {
      return { isOAuth: false, error: e.message };
    }
  }
}

// ================================================================
// 🛡️ WAFDetector (v6.0) - WEB APPLICATION FIREWALL FINGERPRINTER
// ================================================================
class WAFDetector {
  detectWAF(headers = {}, responseBody = '') {
    const hdrs = {};
    for (const [k, v] of Object.entries(headers)) {
      hdrs[k.toLowerCase()] = String(v).toLowerCase();
    }
    const body = (responseBody || '').toLowerCase();
    const wafs = [];

    if (hdrs['cf-ray'] || hdrs['server'] === 'cloudflare' || hdrs['cf-cache-status'] || body.includes('cloudflare ray id') || body.includes('attention required! | cloudflare')) {
      wafs.push({ name: 'Cloudflare', type: 'CDN & WAF', confidence: 'HIGH' });
    }

    if (hdrs['x-amz-cf-id'] || hdrs['x-amzn-requestid'] || (body.includes('403 forbidden') && body.includes('cloudfront')) || body.includes('request blocked by aws waf')) {
      wafs.push({ name: 'AWS CloudFront / AWS WAF', type: 'Cloud WAF', confidence: 'HIGH' });
    }

    if (hdrs['x-akamai-transformed'] || hdrs['akamai-origin-hop'] || body.includes('access denied - akamai') || body.includes('the requested url was not found on this server. - akamai')) {
      wafs.push({ name: 'Akamai Edge', type: 'Enterprise WAF / CDN', confidence: 'HIGH' });
    }

    if (hdrs['x-iinfo'] || (hdrs['x-cdn'] && hdrs['x-cdn'].includes('incapsula')) || (body.includes('incident id') && body.includes('incapsula')) || body.includes('_incapsula_resource')) {
      wafs.push({ name: 'Imperva Incapsula', type: 'Web Application Firewall', confidence: 'HIGH' });
    }

    if (hdrs['x-fastly-request-id'] || hdrs['fastly-debug-digest'] || body.includes('fastly error: unknown domain')) {
      wafs.push({ name: 'Fastly Edge Cloud', type: 'CDN / WAF', confidence: 'HIGH' });
    }

    if (body.includes('mod_security') || body.includes('modsecurity') || (hdrs['server'] && hdrs['server'].includes('mod_security'))) {
      wafs.push({ name: 'ModSecurity (OWASP CRS)', type: 'Open Source WAF', confidence: 'HIGH' });
    }

    if (hdrs['x-cnection'] || (hdrs['server'] && hdrs['server'].includes('big-ip')) || body.includes('the requested url was rejected. please consult with your administrator')) {
      wafs.push({ name: 'F5 BIG-IP ASM', type: 'Enterprise Application Security', confidence: 'HIGH' });
    }

    if (hdrs['x-sucuri-id'] || hdrs['x-sucuri-cache'] || body.includes('access denied - sucuri website firewall')) {
      wafs.push({ name: 'Sucuri CloudProxy', type: 'WAF', confidence: 'HIGH' });
    }

    return {
      detected: wafs.length > 0,
      wafs,
      primaryWAF: wafs[0] ? wafs[0].name : 'No WAF Detected / Direct Origin'
    };
  }
}

// ================================================================
// 🧪 CachePoisoningProber (v6.0) - UNKEYED HEADER CACHE POISONING AUDITOR
// ================================================================
class CachePoisoningProber {
  constructor(stealthEngine) {
    this.stealth = stealthEngine;
    this.unkeyedHeaders = [
      { name: 'X-Forwarded-Host', testVal: 'poisoned-cache-test.evil-attacker.com' },
      { name: 'X-Host', testVal: 'poisoned-cache-test.evil-attacker.com' },
      { name: 'X-Original-URL', testVal: '/admin-console-poisoned' },
      { name: 'X-Rewrite-URL', testVal: '/admin-console-poisoned' },
      { name: 'X-Forwarded-Scheme', testVal: 'http' }
    ];
  }

  async probeEndpoint(urlStr) {
    const findings = [];
    for (const item of this.unkeyedHeaders) {
      try {
        const headers = {};
        headers[item.name] = item.testVal;
        const res = await fetch(urlStr, { method: 'GET', headers });
        const body = await res.text();
        const reflectedInBody = body.includes(item.testVal);
        let reflectedInHeader = null;

        res.headers.forEach((val, key) => {
          if (val.includes(item.testVal)) reflectedInHeader = key;
        });

        if (reflectedInBody || reflectedInHeader) {
          findings.push({
            header: item.name,
            injectedValue: item.testVal,
            status: res.status,
            reflectedInBody,
            reflectedInHeader,
            severity: 'HIGH',
            message: 'Unkeyed header "' + item.name + '" reflected in ' + (reflectedInHeader ? 'Header [' + reflectedInHeader + ']' : 'Response Body') + '! Potential Web Cache Poisoning.'
          });
        }
      } catch (e) {}
    }

    return {
      url: urlStr,
      testedHeadersCount: this.unkeyedHeaders.length,
      isPoisonable: findings.length > 0,
      findings
    };
  }
}

// ================================================================
// 🔍 GitDorkGenerator (v6.0) - AUTOMATED RECON DORKS BUILDER
// ================================================================
class GitDorkGenerator {
  generateDorks(domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    return [
      { category: 'GitHub Env & Secrets', query: '"' + cleanDomain + '" filename:.env', url: 'https://github.com/search?type=code&q=%22' + encodeURIComponent(cleanDomain) + '%22+filename%3A.env' },
      { category: 'GitHub Passwords & Secrets', query: '"' + cleanDomain + '" password OR secret OR api_key', url: 'https://github.com/search?type=code&q=%22' + encodeURIComponent(cleanDomain) + '%22+password+OR+secret+OR+api_key' },
      { category: 'GitHub Internal Endpoints', query: '"' + cleanDomain + '" /api/v1/ OR /admin/ OR /auth/', url: 'https://github.com/search?type=code&q=%22' + encodeURIComponent(cleanDomain) + '%22+%2Fapi%2Fv1%2F+OR+%2Fadmin%2F' },
      { category: 'GitHub Private Keys', query: '"' + cleanDomain + '" "-----BEGIN RSA PRIVATE KEY-----"', url: 'https://github.com/search?type=code&q=%22' + encodeURIComponent(cleanDomain) + '%22+%22BEGIN+RSA+PRIVATE+KEY%22' },
      { category: 'Google Sensitive Files', query: 'site:' + cleanDomain + ' ext:xml OR ext:conf OR ext:cnf OR ext:reg OR ext:inf OR ext:rdp OR ext:sql OR ext:bak', url: 'https://www.google.com/search?q=site%3A' + encodeURIComponent(cleanDomain) + '+ext%3Axml+OR+ext%3Aconf+OR+ext%3Acnf+OR+ext%3Areg+OR+ext%3Ainf+OR+ext%3Ardp+OR+ext%3Asql+OR+ext%3Abak' },
      { category: 'Google Exposed Documents', query: 'site:' + cleanDomain + ' ext:doc OR ext:docx OR ext:pdf OR ext:xls OR ext:xlsx OR ext:ppt OR ext:pptx', url: 'https://www.google.com/search?q=site%3A' + encodeURIComponent(cleanDomain) + '+ext%3Adoc+OR+ext%3Adocx+OR+ext%3Apdf+OR+ext%3Axls+OR+ext%3Axlsx' },
      { category: 'Google Subdomains & Gateways', query: 'site:*.' + cleanDomain + ' -www.' + cleanDomain, url: 'https://www.google.com/search?q=site%3A*.' + encodeURIComponent(cleanDomain) + '+-www.' + encodeURIComponent(cleanDomain) + '' },
      { category: 'Google Directory Listing', query: 'site:' + cleanDomain + ' intitle:"index of" OR "parent directory"', url: 'https://www.google.com/search?q=site%3A' + encodeURIComponent(cleanDomain) + '+intitle%3A%22index+of%22+OR+%22parent+directory%22' }
    ];
  }
}

// ================================================================
// ⏱️ RateLimitAnalyzer (v6.0) - CONCURRENCY BURST & LIMIT AUDITOR
// ================================================================
class RateLimitAnalyzer {
  constructor(stealthEngine) {
    this.stealth = stealthEngine;
  }

  async testRateLimit(urlStr, burstCount = 6, headers = {}) {
    const results = [];

    for (let i = 0; i < burstCount; i++) {
      try {
        const res = await fetch(urlStr, { method: 'GET', headers });
        const rateLimitHeader = res.headers.get('x-ratelimit-remaining') || res.headers.get('ratelimit-remaining') || null;
        const retryAfter = res.headers.get('retry-after') || null;

        results.push({
          iteration: i + 1,
          status: res.status,
          rateLimitRemaining: rateLimitHeader,
          retryAfter
        });
      } catch (e) {
        results.push({ iteration: i + 1, status: 0, error: e.message });
      }
      await new Promise(r => setTimeout(r, 60));
    }

    const hit429 = results.some(r => r.status === 429);
    const hasRateLimitHeaders = results.some(r => r.rateLimitRemaining !== null);

    return {
      url: urlStr,
      burstTested: burstCount,
      rateLimited: hit429,
      hasRateLimitHeaders,
      severity: hit429 || hasRateLimitHeaders ? 'INFO' : 'LOW',
      verdict: hit429 
        ? 'Rate limiting is ACTIVE (HTTP 429 Too Many Requests encountered).' 
        : hasRateLimitHeaders 
          ? 'Rate limiting headers detected on server.' 
          : 'No rate limiting headers or throttling observed during rapid burst test (Check brute force protection).',
      results
    };
  }
}

// ================================================================
// 📄 HTMLReportGenerator (v6.0) - STANDALONE RECON HTML REPORT GENERATOR
// ================================================================
class HTMLReportGenerator {
  generateReport(hunterData) {
    const domain = hunterData.baseDomain || 'target.com';
    const timestamp = new Date().toUTCString();
    const endpoints = hunterData.discoveredEndpoints || [];
    const secrets = hunterData.discoveredSecrets || [];
    const pii = hunterData.discoveredPII || [];
    const cloudBuckets = Array.from(hunterData.cloudBucketCollector?.buckets?.values() || []);

    const endpointRows = endpoints.map(ep => {
      const col = ep.method === 'GET' ? '#38bdf8' : ep.method === 'POST' ? '#34d399' : '#fbbf24';
      return '<tr><td><b style="color:' + col + '">' + (ep.method || 'GET') + '</b></td><td style="font-family:monospace; word-break:break-all;">' + ep.url + '</td><td><span class="badge" style="background:rgba(255,255,255,0.06);">' + (ep.type || 'api') + '</span></td><td><span class="badge" style="background:' + (ep.statusCode === 200 ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)') + '; color:' + (ep.statusCode === 200 ? '#34d399' : '#94a3b8') + '">' + (ep.statusCode || '--') + '</span></td><td style="color:#94a3b8; font-size:10px;">' + (ep.source || 'crawl') + '</td></tr>';
    }).join('');

    const secretRows = secrets.map(s => {
      return '<tr><td><b>' + s.type + '</b></td><td style="font-family:monospace;">' + (s.preview || s.value) + '</td><td><span class="badge" style="background:rgba(244,63,94,0.2); color:#f43f5e;">HIGH</span></td><td style="font-size:10px; color:#94a3b8;">' + (s.source || 'script') + '</td></tr>';
    }).join('');

    const bucketRows = cloudBuckets.map(b => {
      return '<tr><td><span class="badge" style="background:rgba(52,211,153,0.15); color:#34d399;">' + b.provider + '</span></td><td style="font-family:monospace;"><b>' + b.name + '</b></td><td style="font-family:monospace;"><a href="' + b.url + '" target="_blank" style="color:#38bdf8;">' + b.url + '</a></td><td><b>' + b.status + '</b></td></tr>';
    }).join('');

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>Endpoint Hunter Recon Report — ' + domain + '</title>\n<style>\n  :root { --bg: #060913; --card: #0d162a; --border: rgba(56,189,248,0.2); --text: #e2e8f0; --cyan: #38bdf8; --rose: #f43f5e; --amber: #fbbf24; --emerald: #34d399; }\n  body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; }\n  .header { border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }\n  .badge { padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; font-family: monospace; }\n  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }\n  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center; }\n  .stat-num { font-size: 28px; font-weight: 800; color: var(--cyan); margin-top: 4px; }\n  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }\n  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }\n  th { background: rgba(56,189,248,0.1); color: var(--cyan); font-weight: 700; }\n  tr:hover { background: rgba(255,255,255,0.02); }\n  .section { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 24px; }\n</style>\n</head>\n<body>\n<div class="header">\n  <div>\n    <h1 style="margin:0; font-size:24px; color:var(--cyan);">🎯 ENDPOINT HUNTER RECON REPORT</h1>\n    <div style="font-size:12px; color:#94a3b8; margin-top:4px;">Target: <b>' + domain + '</b> | Generated: ' + timestamp + '</div>\n  </div>\n  <span class="badge" style="background:rgba(56,189,248,0.2); color:var(--cyan); font-size:14px;">v6.0.0</span>\n</div>\n\n<div class="grid">\n  <div class="stat-card"><div>DISCOVERED ENDPOINTS</div><div class="stat-num">' + endpoints.length + '</div></div>\n  <div class="stat-card"><div>LEAKED SECRETS</div><div class="stat-num" style="color:var(--rose);">' + secrets.length + '</div></div>\n  <div class="stat-card"><div>PII LEAKS</div><div class="stat-num" style="color:var(--amber);">' + pii.length + '</div></div>\n  <div class="stat-card"><div>CLOUD BUCKETS</div><div class="stat-num" style="color:var(--emerald);">' + cloudBuckets.length + '</div></div>\n</div>\n\n<div class="section">\n  <h2 style="margin:0 0 12px 0; font-size:16px; color:var(--cyan);">🔗 Discovered API Endpoints & Routes (' + endpoints.length + ')</h2>\n  <table>\n    <thead><tr><th>Method</th><th>URL</th><th>Category</th><th>Status</th><th>Source</th></tr></thead>\n    <tbody>' + endpointRows + '</tbody>\n  </table>\n</div>\n\n' + (secrets.length > 0 ? '<div class="section"><h2 style="margin:0 0 12px 0; font-size:16px; color:var(--rose);">🔑 Discovered Credentials & API Tokens (' + secrets.length + ')</h2><table><thead><tr><th>Type</th><th>Preview</th><th>Severity</th><th>Source</th></tr></thead><tbody>' + secretRows + '</tbody></table></div>' : '') + '\n\n' + (cloudBuckets.length > 0 ? '<div class="section"><h2 style="margin:0 0 12px 0; font-size:16px; color:var(--emerald);">☁️ Cloud Storage Buckets (' + cloudBuckets.length + ')</h2><table><thead><tr><th>Provider</th><th>Bucket Name</th><th>URL</th><th>Status</th></tr></thead><tbody>' + bucketRows + '</tbody></table></div>' : '') + '\n\n<div style="text-align:center; color:#64748b; font-size:11px; margin-top:32px;">Report generated automatically by <b>Endpoint Hunter v6.0</b> • Authorized Cybersecurity Testing Only</div>\n</body>\n</html>';
  }
}


const ENDPOINT_PATTERNS = {
  api: [
    '/api/', '/v1/', '/v2/', '/v3/', '/v4/', '/v5/',
    '/rest/', '/graphql', '/graphiql', '/gql', '/query',
    '/odata', '/soap', '/rpc', '/grpc',
    '/swagger', '/openapi', '/docs'
  ],
  admin: [
    '/admin/', '/dashboard/', '/panel/', '/console/',
    '/manage/', '/manager/', '/control/', '/controlpanel/',
    '/administrator/', '/backend/', '/cpanel/', '/whm/',
    '/modcp/', '/staff/', '/supervisor/', '/moderator/'
  ],
  auth: [
    '/auth/', '/login/', '/register/', '/logout/',
    '/signup/', '/signin/', '/signout/', '/forgot-password/',
    '/reset-password/', '/change-password/', '/verify/',
    '/2fa/', '/mfa/', '/otp/', '/captcha/',
    '/session/', '/token/', '/oauth/', '/sso/',
    '/saml/', '/openid/', '/webauthn/'
  ],
  user: [
    '/user/', '/profile/', '/account/', '/settings/',
    '/preferences/', '/my-account/', '/dashboard/',
    '/orders/', '/history/', '/favorites/', '/wishlist/',
    '/cart/', '/checkout/', '/payment/', '/billing/'
  ],
  file: [
    '/upload/', '/download/', '/media/', '/static/',
    '/assets/', '/files/', '/images/', '/videos/',
    '/audio/', '/documents/', '/pdf/', '/export/',
    '/import/', '/backup/', '/temp/', '/cache/'
  ],
  data: [
    '/data/', '/json/', '/xml/', '/csv/', '/tsv/',
    '/yaml/', '/yml/', '/config/', '/configuration/',
    '/database/', '/db/', '/sql/', '/mongo/', '/redis/'
  ],
  debug: [
    '/debug/', '/test/', '/dev/', '/stage/', '/staging/',
    '/status/', '/health/', '/ping/', '/info/', '/version/',
    '/metrics/', '/trace/', '/logs/', '/error/'
  ],
  config: [
    '/.env', '/.git', '/.svn', '/.hg',
    '/config.json', '/config.yaml', '/config.yml',
    '/settings.json', '/configuration.json',
    '/package.json', '/composer.json', '/bower.json',
    '/swagger.json', '/openapi.json'
  ],
  payment: [
    '/payment/', '/checkout/', '/cart/', '/order/',
    '/invoice/', '/billing/', '/subscribe/', '/subscription/',
    '/plan/', '/pricing/', '/coupon/', '/promo/',
    '/refund/', '/cancel/', '/receipt/'
  ],
  search: [
    '/search/', '/query/', '/find/', '/lookup/',
    '/explore/', '/discover/', '/filter/', '/sort/'
  ],
  social: [
    '/follow/', '/like/', '/comment/', '/share/',
    '/post/', '/tweet/', '/status/', '/feed/',
    '/timeline/', '/wall/', '/message/', '/chat/'
  ],
  websocket: [
    '/ws/', '/socket.io/', '/websocket/', '/sockjs/',
    '/stomp/', '/mqtt/', '/amqp/', '/nats/'
  ],
  file_extensions: [
    '.json', '.xml', '.yml', '.yaml', '.config',
    '.conf', '.ini', '.env', '.php', '.asp',
    '.aspx', '.jsp', '.do', '.action', '.jspx',
    '.xhtml', '.html', '.htm', '.css', '.js',
    '.map', '.txt', '.md', '.log'
  ],
  common_paths: [
    '/', '/index', '/home', '/main', '/default',
    '/error', '/404', '/403', '/500', '/503',
    '/robots.txt', '/sitemap.xml', '/sitemap',
    '/humans.txt', '/security.txt', '/ads.txt',
    '/favicon.ico', '/manifest.json', '/browserconfig.xml'
  ]
};

// ================================================================
// 🕷️ CRAWL ENGINE (OLD - PRESERVED + UPGRADED WITH STEALTH/BYPASS)
// ================================================================

class CrawlEngine {
  constructor() {
    // ===== OLD PROPERTIES (PRESERVED) =====
    this.scannedPages = new Map();
    this.scanQueue = [];
    this.discoveredUrls = new Set();
    this.discoveredEndpoints = [];
    this.discoveredPaths = new Set();
    this.isRunning = false;
    this.isPaused = false;
    this.totalPages = 0;
    this.totalLinks = 0;
    this.totalEndpoints = 0;
    this.startTime = null;
    this.currentUrl = 'None';
    this.baseDomain = '';
    this.isProcessing = false;
    this.scanMode = 'crawl';
    this.visitedDepth = new Map();
    
    // ===== OLD AJAX PATTERNS (PRESERVED) =====
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
      /URL\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
      /endpoint\s*=\s*['"`]([^'"`]+)['"`]/gi,
      /url\s*=\s*['"`]([^'"`]+)['"`]/gi,
      /api\s*=\s*['"`]([^'"`]+)['"`]/gi
    ];

    // ===== NEW PROPERTIES (ADDED) =====
    this.discoveredParams = new Set();
    this.totalParams = 0;
    this.stealthEngine = new StealthEngine();
    this.bypassEngine = new BypassEngine();
    this.deepScanner = new DeepScanner();
    this.secretsScanner = new SecretsScanner();
    this.frameworkScanner = new FrameworkScanner(this.stealthEngine);
    this.sourceMapUnpacker = new SourceMapUnpacker(this.stealthEngine);
    this.graphQLIntrospector = new GraphQLIntrospector(this.stealthEngine);
    this.miniRepeater = new MiniRepeater();
    this.microFuzzer = new MicroFuzzer(this.stealthEngine);
    this.parameterMiner = new ParameterMiner(this.stealthEngine);
    this.corsAuditor = new CORSAuditor(this.stealthEngine);
    this.jwtInspector = new JWTInspector();
    this.securityHeadersAnalyzer = new SecurityHeadersAnalyzer();
    this.swaggerImporter = new SwaggerImporter(this);
    this.piiDetector = new PIIHeuristicDetector();
    this.verbTamperMatrix = new VerbTamperMatrix(this.stealthEngine);
    this.idorSequencer = new IDORSequencer(this.stealthEngine);
    this.cloudBucketCollector = new CloudBucketCollector(this.stealthEngine);
    this.bashCurlExporter = new BashCurlExporter();
    this.graphqlAdvanced = new GraphQLAdvancedExploration(this.stealthEngine);
    this.takeoverAnalyzer = new SubdomainTakeoverAnalyzer(this.stealthEngine);
    this.openRedirectEngine = new OpenRedirectProbeEngine(this.stealthEngine);
    this.oauthAuditor = new OAuthFlowAuditor();
    this.wafDetector = new WAFDetector();
    this.cachePoisoner = new CachePoisoningProber(this.stealthEngine);
    this.gitDorkGenerator = new GitDorkGenerator();
    this.rateLimitAnalyzer = new RateLimitAnalyzer(this.stealthEngine);
    this.htmlReportGenerator = new HTMLReportGenerator();
    this.discoveredPII = [];
    this.wsFrames = [];
    this.unpackedSourceMaps = new Map();
    this.fuzzerResults = [];
    this.statusProber = new StatusProber(this.stealthEngine);
    this.discoveredSecrets = [];
    this.discoveredPII = [];
    if (this.cloudBucketCollector) this.cloudBucketCollector.buckets.clear();
    this.sniffedRequests = [];
    this.isSniffing = false;
    this.isProbing = false;
    this.analyzedJs = new Set();
    this.analyzedCss = new Set();
    this.processedFiles = new Set();
    this.pageLogs = [];
    this.linkLogs = [];
    this.endpointLogs = [];
    this.pathLogs = [];
    this.paramLogs = [];
    this.fileLogs = [];
    this.bypassLogs = [];
    this.errorLogs = [];
  }

  // ================================================================
  // 📡 SEND MESSAGE TO POPUP (OLD - PRESERVED)
  // ================================================================

  sendMessageToPopup(action, data = {}) {
    try {
      chrome.runtime.sendMessage({ action, ...data }).catch(() => {});
    } catch (e) {}
  }

  // ================================================================
  // 📝 ADD LOG (OLD - PRESERVED + UPGRADED)
  // ================================================================

  addLog(message, type = 'info', details = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { time: timestamp, message, type, details };
    
    if (type === 'pages') {
      this.pageLogs.push(logEntry);
      if (this.pageLogs.length > 1000) this.pageLogs.shift();
    } else if (type === 'link') {
      this.linkLogs.push(logEntry);
      if (this.linkLogs.length > 1000) this.linkLogs.shift();
    } else if (type === 'endpoint') {
      this.endpointLogs.push(logEntry);
      if (this.endpointLogs.length > 1000) this.endpointLogs.shift();
    } else if (type === 'path') {
      this.pathLogs.push(logEntry);
      if (this.pathLogs.length > 1000) this.pathLogs.shift();
    } else if (type === 'param') {
      this.paramLogs.push(logEntry);
      if (this.paramLogs.length > 1000) this.paramLogs.shift();
    } else if (type === 'file') {
      this.fileLogs.push(logEntry);
      if (this.fileLogs.length > 1000) this.fileLogs.shift();
    } else if (type === 'bypass') {
      this.bypassLogs.push(logEntry);
      if (this.bypassLogs.length > 500) this.bypassLogs.shift();
    } else if (type === 'error') {
      this.errorLogs.push(logEntry);
      if (this.errorLogs.length > 500) this.errorLogs.shift();
    }
    
    this.sendMessageToPopup('newLog', { log: logEntry });
    
    const emojis = {
      pages: '📄', link: '🔗', endpoint: '🎯', path: '📁',
      param: '📊', file: '📄', bypass: '🛡️', error: '❌',
      success: '✅', info: 'ℹ️', warning: '⚠️', stealth: '🕵️'
    };
    console.log(`[ENDPOINT_HUNTER] ${emojis[type] || 'ℹ️'} ${message}`);
  }

  // ================================================================
  // 🔍 CHECK SAME DOMAIN (OLD - PRESERVED)
  // ================================================================

  isSameDomain(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === this.baseDomain) return true;
      const rootBase = (this.baseDomain || '').replace(/^www\./, '');
      const rootHost = urlObj.hostname.replace(/^www\./, '');
      if (rootHost === rootBase) return true;
      if (rootHost.endsWith('.' + rootBase)) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  // ================================================================
  // 🚀 START CRAWL (OLD - PRESERVED + UPGRADED WITH STEALTH)
  // ================================================================

  async startCrawl(tabId, url) {
    if (this.isRunning) {
      this.addLog('⚠️ Crawl already running', 'warning');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.scannedPages = new Map();
    this.scanQueue = [];
    this.discoveredUrls = new Set();
    this.discoveredEndpoints = [];
    this.discoveredPaths = new Set();
    this.discoveredParams = new Set();
    this.totalPages = 0;
    this.totalLinks = 0;
    this.totalEndpoints = 0;
    this.totalPaths = 0;
    this.totalParams = 0;
    this.currentUrl = 'None';

    try {
      this.baseDomain = new URL(url).hostname;
    } catch (e) {
      this.addLog(`❌ Invalid URL: ${url}`, 'error');
      this.isRunning = false;
      return;
    }

    this.addLog(`🚀 Starting ULTIMATE STEALTH crawl: ${url}`, 'info');
    this.addLog(`📋 Domain: ${this.baseDomain}`, 'info');
    this.addLog(`🕵️ STEALTH MODE: ENABLED (SOC team ko nahi pata chalega)`, 'stealth');
    this.addLog(`🛡️ BYPASS: ENABLED`, 'info');

    this.scanQueue.push(url);
    this.discoveredUrls.add(url);

    await this.processQueue(tabId);

    this.isRunning = false;
    const stealthStats = this.stealthEngine.getStats();
    const bypassStats = this.bypassEngine.getStats();
    
    this.addLog(`✅ CRAWL COMPLETE!`, 'success');
    this.addLog(`📊 Pages: ${this.totalPages}`, 'info');
    this.addLog(`🎯 Endpoints: ${this.totalEndpoints}`, 'info');
    this.addLog(`📁 Paths: ${this.totalPaths}`, 'info');
    this.addLog(`📊 Params: ${this.totalParams}`, 'info');
    this.addLog(`🕵️ Stealth Rate: ${stealthStats.successRate}`, 'stealth');
    this.addLog(`🛡️ Bypass Rate: ${bypassStats.successRate}`, 'info');

    if (TELEGRAM.enabled) {
      await this.sendTelegramReport();
    }

    this.sendMessageToPopup('crawlComplete', {
      pages: this.totalPages,
      endpoints: this.totalEndpoints,
      paths: this.totalPaths,
      params: this.totalParams
    });
  }

  // ================================================================
  // 🔄 PROCESS QUEUE (OLD - PRESERVED + UPGRADED WITH STEALTH)
  // ================================================================

  async processQueue(tabId) {
    if (this.isPaused) {
      this.addLog('⏸ Crawl paused', 'info');
      return;
    }

    let processed = 0;
    const maxPages = CRAWL_CONFIG.maxPages || 999999;

    while (this.scanQueue.length > 0 && this.isRunning && !this.isPaused && processed < maxPages) {
      const url = this.scanQueue.shift();

      if (this.scannedPages.has(url)) {
        continue;
      }

      processed++;
      this.totalPages = this.scannedPages.size + 1;
      this.currentUrl = url;
      
      this.sendMessageToPopup('pageChanged', {
        url: url,
        totalPages: this.totalPages,
        totalLinks: this.totalLinks,
        totalEndpoints: this.totalEndpoints
      });

      this.addLog(`📄 [${this.totalPages}] ${url}`, 'pages', { url, pageNumber: this.totalPages });

      try {
        await this.processPage(tabId, url);
        this.scannedPages.set(url, { timestamp: Date.now() });
        this.totalPages = this.scannedPages.size;
      } catch (e) {
        this.addLog(`⚠️ Error processing ${url}: ${e.message}`, 'error', { url, error: e.message });
        this.scannedPages.set(url, { timestamp: Date.now(), error: e.message });
        this.totalPages = this.scannedPages.size;
      }

      this.sendMessageToPopup('queueUpdate', {
        queueSize: this.scanQueue.length,
        pagesCrawled: this.totalPages
      });

      if (CRAWL_CONFIG.stealthMode) {
        await this.stealthEngine.humanDelay(2000, 5000);
      }

      if (!this.isRunning || this.isPaused) break;
    }

    if (this.scanQueue.length === 0 && this.isRunning) {
      this.addLog('✅ Queue empty - crawl complete!', 'success');
      this.isRunning = false;
    }
  }

  // ================================================================
  // 📄 PROCESS PAGE (OLD - PRESERVED + UPGRADED WITH STEALTH/BYPASS)
  // ================================================================

  async processPage(tabId, url) {
    try {
      // ================================================================
      // 🕵️ STEALTH BEHAVIOR - SOC TEAM KO NAHI PATA CHALEGA
      // ================================================================
      
      // 1. Random delay before loading (2-5 seconds)
      await this.stealthEngine.humanDelay(2000, 5000);
      
      // 2. Navigate to URL
      await chrome.tabs.update(tabId, { url, active: true });
      await this.waitForPageLoad(tabId);
      
      // 3. Human-like scroll
      await this.stealthEngine.humanScroll(tabId);
      
      // 4. Human-like mouse move
      await this.stealthEngine.humanMouseMove(tabId);
      
      // 5. Random delay before scanning (2-5 seconds)
      await this.stealthEngine.humanDelay(2000, 5000);

      // ================================================================
      // 📄 GET PAGE CONTENT (OLD - PRESERVED)
      // ================================================================
      
      const result = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          return {
            html: document.documentElement.outerHTML,
            url: window.location.href,
            title: document.title,
            links: Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h && !h.startsWith('#') && !h.startsWith('mailto:') && !h.startsWith('tel:')),
            scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src).filter(s => s),
            inlineScripts: Array.from(document.querySelectorAll('script:not([src])')).map(s => s.textContent),
            css: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href).filter(h => h),
            meta: Array.from(document.querySelectorAll('meta')).map(m => ({ name: m.getAttribute('name'), content: m.getAttribute('content') })),
            forms: Array.from(document.querySelectorAll('form')).map(f => ({ action: f.action, method: f.method })),
            iframes: Array.from(document.querySelectorAll('iframe')).map(i => i.src).filter(s => s)
          };
        }
      });

      const data = result?.[0]?.result || {};
      
      if (data.title) {
        this.addLog(`📌 Page Title: ${data.title}`, 'info', { url, title: data.title });
      }

      // ================================================================
      // 🔍 DEEP SCAN HTML (NEW - ADDED)
      // ================================================================
      
      if (data.html) {
        const htmlResults = this.deepScanner.scanHTML(data.html, url);
        for (const ep of htmlResults.endpoints) {
          const normalized = this.normalizeEndpoint(ep, url);
          if (this.isSameDomain(normalized)) {
            this.addEndpoint({
              url: normalized,
              method: 'GET',
              type: this.classifyEndpoint(ep),
              source: 'html-deep',
              foundOn: url
            });
          }
        }
        for (const path of htmlResults.paths) {
          if (!this.discoveredPaths.has(path)) {
            this.discoveredPaths.add(path);
            this.totalPaths = this.discoveredPaths.size;
          }
        }
        for (const param of htmlResults.params) {
          if (!this.discoveredParams.has(param)) {
            this.discoveredParams.add(param);
            this.totalParams = this.discoveredParams.size;
          }
        }
      }

      // ================================================================
      // 📄 EXTRACT PATHS FROM HTML (OLD - PRESERVED)
      // ================================================================
      
      const paths = this.extractPaths(data.html || '');
      for (const path of paths) {
        if (!this.discoveredPaths.has(path)) {
          this.discoveredPaths.add(path);
          this.totalPaths = this.discoveredPaths.size;
          this.addLog(`📁 Path: ${path}`, 'path', { path, source: 'html-extract', foundOn: url });
        }
      }

      // ================================================================
      // 🔍 DEEP SCAN INLINE SCRIPTS (NEW - ADDED)
      // ================================================================
      
      if (data.inlineScripts) {
        for (const script of data.inlineScripts) {
          // 🔑 Secrets Scanner
          const secrets = this.secretsScanner.scan(script, url);
          for (const sec of secrets) this.addSecret(sec);

          const jsResults = this.deepScanner.scanJS(script, url);
          for (const ep of jsResults.endpoints) {
            const normalized = this.normalizeEndpoint(ep, url);
            if (this.isSameDomain(normalized)) {
              this.addEndpoint({
                url: normalized,
                method: 'GET',
                type: this.classifyEndpoint(ep),
                source: 'inline-js-deep',
                foundOn: url
              });
            }
          }
          for (const path of jsResults.paths) {
            if (!this.discoveredPaths.has(path)) {
              this.discoveredPaths.add(path);
              this.totalPaths = this.discoveredPaths.size;
            }
          }
          for (const param of jsResults.params) {
            if (!this.discoveredParams.has(param)) {
              this.discoveredParams.add(param);
              this.totalParams = this.discoveredParams.size;
            }
          }
        }
      }

      // ================================================================
      // 📄 PROCESS JAVASCRIPT FILES (OLD - PRESERVED + UPGRADED)
      // ================================================================
      
      if (data.scripts) {
        for (const scriptUrl of data.scripts) {
          if (!this.isSameDomain(scriptUrl)) {
            this.addLog(`⏭️ Skipping external JS: ${scriptUrl}`, 'warning', { url: scriptUrl, reason: 'external' });
            continue;
          }
          if (this.analyzedJs.has(scriptUrl)) continue;
          this.analyzedJs.add(scriptUrl);
          
          this.addLog(`📄 Analyzing JS: ${scriptUrl}`, 'file', { url: scriptUrl, type: 'js' });
          
          try {
            const response = await this.stealthEngine.stealthFetch(scriptUrl);
            if (response && response.ok) {
              const jsContent = await response.text();

              // 🔑 Secrets Scanner
              const secrets = this.secretsScanner.scan(jsContent, scriptUrl);
              for (const sec of secrets) this.addSecret(sec);

              // 🗺️ Source Map Discovery
              this.frameworkScanner.checkSourceMap(scriptUrl).then(map => {
                if (map) this.addLog(`🗺️ Found accessible Source Map: ${map.url}`, 'info');
              });

              const jsResults = this.deepScanner.scanJS(jsContent, scriptUrl);
              
              for (const ep of jsResults.endpoints) {
                const normalized = this.normalizeEndpoint(ep, scriptUrl);
                if (this.isSameDomain(normalized)) {
                  this.addEndpoint({
                    url: normalized,
                    method: 'GET',
                    type: this.classifyEndpoint(ep),
                    source: 'js-deep',
                    foundOn: scriptUrl
                  });
                }
              }
              for (const path of jsResults.paths) {
                if (!this.discoveredPaths.has(path)) {
                  this.discoveredPaths.add(path);
                  this.totalPaths = this.discoveredPaths.size;
                }
              }
              for (const param of jsResults.params) {
                if (!this.discoveredParams.has(param)) {
                  this.discoveredParams.add(param);
                  this.totalParams = this.discoveredParams.size;
                }
              }
            }
          } catch (e) {
            this.addLog(`⚠️ Failed to analyze JS: ${scriptUrl}`, 'error', { url: scriptUrl, error: e.message });
          }
        }
      }

      // ================================================================
      // 📄 PROCESS CSS FILES (OLD - PRESERVED + UPGRADED)
      // ================================================================
      
      if (data.css) {
        for (const cssUrl of data.css) {
          if (!this.isSameDomain(cssUrl)) {
            this.addLog(`⏭️ Skipping external CSS: ${cssUrl}`, 'warning', { url: cssUrl, reason: 'external' });
            continue;
          }
          if (this.analyzedCss.has(cssUrl)) continue;
          this.analyzedCss.add(cssUrl);
          
          this.addLog(`📄 Analyzing CSS: ${cssUrl}`, 'file', { url: cssUrl, type: 'css' });
          
          try {
            const response = await this.stealthEngine.stealthFetch(cssUrl);
            if (response && response.ok) {
              const cssContent = await response.text();
              const cssResults = this.deepScanner.scanCSS(cssContent, cssUrl);
              for (const ep of cssResults.endpoints) {
                const normalized = this.normalizeEndpoint(ep, cssUrl);
                if (this.isSameDomain(normalized)) {
                  this.addEndpoint({
                    url: normalized,
                    method: 'GET',
                    type: this.classifyEndpoint(ep),
                    source: 'css-deep',
                    foundOn: cssUrl
                  });
                }
              }
              for (const path of cssResults.paths) {
                if (!this.discoveredPaths.has(path)) {
                  this.discoveredPaths.add(path);
                  this.totalPaths = this.discoveredPaths.size;
                }
              }
            }
          } catch (e) {
            this.addLog(`⚠️ Failed to analyze CSS: ${cssUrl}`, 'error', { url: cssUrl, error: e.message });
          }
        }
      }

      // ================================================================
      // 📄 EXTRACT FROM META TAGS (OLD - PRESERVED)
      // ================================================================
      
      if (data.meta) {
        for (const meta of data.meta) {
          if (meta.content && (meta.content.includes('http') || meta.content.includes('/'))) {
            this.addEndpoint({
              url: this.normalizeEndpoint(meta.content, url),
              method: 'GET',
              type: this.classifyEndpoint(meta.content),
              source: 'meta',
              foundOn: url
            });
          }
        }
      }

      // ================================================================
      // 📄 EXTRACT FROM FORMS (OLD - PRESERVED)
      // ================================================================
      
      if (data.forms) {
        for (const form of data.forms) {
          if (form.action) {
            this.addEndpoint({
              url: this.normalizeEndpoint(form.action, url),
              method: form.method || 'POST',
              type: this.classifyEndpoint(form.action),
              source: 'form',
              foundOn: url
            });
          }
        }
      }

      // ================================================================
      // 📄 EXTRACT FROM IFRAMES (OLD - PRESERVED)
      // ================================================================
      
      if (data.iframes) {
        for (const iframe of data.iframes) {
          if (iframe && this.isSameDomain(iframe)) {
            this.addEndpoint({
              url: this.normalizeEndpoint(iframe, url),
              method: 'GET',
              type: this.classifyEndpoint(iframe),
              source: 'iframe',
              foundOn: url
            });
          }
        }
      }

      // ================================================================
      // 🔗 EXTRACT LINKS FOR CRAWLING (OLD - PRESERVED)
      // ================================================================
      
      if (data.links) {
        for (const link of data.links) {
          try {
            const linkUrl = new URL(link);
            if (!this.isSameDomain(link)) continue;
            
            if (!this.discoveredUrls.has(link) && !this.scannedPages.has(link)) {
              this.discoveredUrls.add(link);
              this.scanQueue.push(link);
              this.totalLinks++;
              this.sendMessageToPopup('linkDiscovered', { url: link });
              this.addLog(`🔗 Found internal link: ${link}`, 'link', { url: link, source: 'html', foundOn: url });
            }
          } catch (e) {}
        }
      }

      // ================================================================
      // 📂 CHECK COMMON FILES (OLD - PRESERVED)
      // ================================================================
      
      await this.checkCommonFiles(url);

    } catch (e) {
      this.addLog(`⚠️ Error processing page: ${e.message}`, 'error', { url, error: e.message });
    }
  }

  // ================================================================
  // 🔍 EXTRACT PATHS (OLD - PRESERVED)
  // ================================================================

  extractPaths(html) {
    const paths = new Set();

    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1];
      try {
        const url = new URL(href, 'http://example.com');
        const path = url.pathname;
        if (path && path.length > 1) {
          paths.add(path);
        }
        const fullPath = url.pathname + url.search;
        if (fullPath && fullPath.length > 1) {
          paths.add(fullPath);
        }
      } catch (e) {}
    }

    const srcRegex = /src\s*=\s*["']([^"']+)["']/gi;
    while ((match = srcRegex.exec(html)) !== null) {
      const src = match[1];
      try {
        const url = new URL(src, 'http://example.com');
        const path = url.pathname;
        if (path && path.length > 1) {
          paths.add(path);
        }
      } catch (e) {}
    }

    const actionRegex = /action\s*=\s*["']([^"']+)["']/gi;
    while ((match = actionRegex.exec(html)) !== null) {
      const action = match[1];
      try {
        const url = new URL(action, 'http://example.com');
        const path = url.pathname;
        if (path && path.length > 1) {
          paths.add(path);
        }
      } catch (e) {}
    }

    return paths;
  }

  // ================================================================
  // 📋 CLASSIFY ENDPOINT (OLD - PRESERVED)
  // ================================================================

  classifyEndpoint(url) {
    const lower = url.toLowerCase();

    for (const [type, patterns] of Object.entries(ENDPOINT_PATTERNS)) {
      if (type === 'file_extensions' || type === 'common_paths') continue;
      for (const pattern of patterns) {
        if (lower.includes(pattern.toLowerCase())) {
          return type;
        }
      }
    }

    for (const ext of ENDPOINT_PATTERNS.file_extensions) {
      if (lower.endsWith(ext)) {
        return 'file';
      }
    }

    for (const path of ENDPOINT_PATTERNS.common_paths) {
      if (lower === path || lower.endsWith(path)) {
        if (path.includes('sitemap') || path.includes('robots')) {
          return 'config';
        }
        return 'common';
      }
    }

    return 'other';
  }

  // ================================================================
  // 🏷️ NORMALIZE ENDPOINT (OLD - PRESERVED)
  // ================================================================

  normalizeEndpoint(endpoint, baseUrl) {
    try {
      if (endpoint.startsWith('/')) {
        try {
          const base = new URL(baseUrl);
          return new URL(endpoint, base.origin).toString();
        } catch (e) {
          return endpoint;
        }
      }
      try {
        const url = new URL(endpoint);
        return url.toString();
      } catch (e) {
        return endpoint;
      }
    } catch (e) {
      return endpoint;
    }
  }

  // ================================================================
  // 🔍 CHECK IF ENDPOINT (OLD - PRESERVED)
  // ================================================================

  isEndpoint(url) {
    if (!url) return false;
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) return false;
    if (url.startsWith('javascript:') || url.startsWith('data:')) return false;
    if (url.length < 3) return false;

    const lower = url.toLowerCase();

    for (const [type, patterns] of Object.entries(ENDPOINT_PATTERNS)) {
      for (const pattern of patterns) {
        if (lower.includes(pattern.toLowerCase())) {
          return true;
        }
      }
    }

    try {
      const parsed = new URL(url);
      if (parsed.pathname && parsed.pathname.length > 1) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  // ================================================================
  // ➕ ADD ENDPOINT (OLD - PRESERVED + UPGRADED)
  // ================================================================

  addEndpoint(endpoint) {
    if (!endpoint || !endpoint.url) return;
    if (this.deepScanner && this.deepScanner.isFalsePositive(endpoint.url)) return;
    if (!this.isSameDomain(endpoint.url)) {
      this.addLog(`⏭️ Skipping external endpoint: ${endpoint.url}`, 'warning', { url: endpoint.url, reason: 'external' });
      return;
    }

    const exists = this.discoveredEndpoints.some(e => e.url === endpoint.url);
    if (exists) return;

    this.discoveredEndpoints.push(endpoint);
    this.totalEndpoints = this.discoveredEndpoints.length;
    this.sendMessageToPopup('endpointFound', endpoint);
    this.addLog(`🎯 ${endpoint.method} ${endpoint.url} (${endpoint.type})`, 'endpoint', { url: endpoint.url, method: endpoint.method, type: endpoint.type });
  }

  // ================================================================
  // 🔑 ADD SECRET (v2.0)
  // ================================================================

  addSecret(secret) {
    if (!secret || !secret.value) return;
    const exists = this.discoveredSecrets.some(s => s.value === secret.value);
    if (exists) return;

    this.discoveredSecrets.push(secret);
    this.sendMessageToPopup('secretFound', secret);
    this.addLog(`🔑 [${secret.severity}] ${secret.name}: ${secret.masked}`, 'warning', {
      type: 'secret',
      name: secret.name,
      severity: secret.severity,
      source: secret.source
    });

    // Alert if critical or high
    if (secret.severity === 'CRITICAL' || secret.severity === 'HIGH') {
      if (WEBHOOK_CONFIG.discordEnabled && WEBHOOK_CONFIG.discord) {
        this.sendDiscordAlert(
          `🚨 LEAKED SECRET: ${secret.name}`,
          `A ${secret.severity} security token was discovered on **${this.baseDomain || 'target'}**`,
          [
            { name: "Severity", value: secret.severity, inline: true },
            { name: "Type", value: secret.name, inline: true },
            { name: "Masked Value", value: `\`${secret.masked}\``, inline: false },
            { name: "Source File", value: secret.source, inline: false }
          ]
        );
      }
      if (WEBHOOK_CONFIG.slackEnabled && WEBHOOK_CONFIG.slack) {
        this.sendSlackAlert(`🚨 *LEAKED SECRET [${secret.severity}]*: ${secret.name} on ${this.baseDomain}\n\`${secret.masked}\` in ${secret.source}`);
      }
    }
  }

  // ================================================================
  // ⚡ HANDLE SNIFFED RUNTIME REQUEST (v2.0)
  // ================================================================

  handleSniffedRequest(reqData) {
    if (!reqData || !reqData.url) return;
    this.sniffedRequests.unshift(reqData);
    if (this.sniffedRequests.length > 200) this.sniffedRequests.pop();

    const normalized = this.normalizeEndpoint(reqData.url, reqData.url);
    if (normalized && !this.deepScanner.isFalsePositive(normalized)) {
      this.addEndpoint({
        url: normalized,
        method: reqData.method || 'GET',
        type: this.classifyEndpoint(normalized),
        source: `runtime-${reqData.sourceType}`,
        statusCode: reqData.status || null,
        foundOn: reqData.url
      });
    }
    if (this.cloudBucketCollector && reqData.url) {
      this.cloudBucketCollector.scanText(reqData.url, reqData.url);
      if (reqData.responseBody) this.cloudBucketCollector.scanText(reqData.responseBody, reqData.url);
    }
    if (this.piiDetector && reqData.responseBody) {
      const piiHits = this.piiDetector.scan(reqData.responseBody, reqData.url);
      if (piiHits && piiHits.length > 0) {
        piiHits.forEach(hit => {
          this.discoveredPII.push(hit);
          this.addLog(`🚨 PII Leaked on [${reqData.method || 'GET'}] ${reqData.url}: ${hit.type} (${hit.preview})`, 'warning');
        });
        this.sendMessageToPopup('piiDetected', { hits: piiHits });
      }
    }
    this.sendMessageToPopup('networkRequestSniffed', reqData);
  }

  // ================================================================
  // 🎯 PROBE DISCOVERED ENDPOINTS (v2.0)
  // ================================================================

  async probeAllEndpoints() {
    if (this.isProbing) return;
    this.isProbing = true;
    this.addLog(`🎯 Starting live batch status probe (${this.discoveredEndpoints.length} endpoints)...`, 'info');
    this.sendMessageToPopup('probingStarted', { total: this.discoveredEndpoints.length });

    let count = 0;
    for (let i = 0; i < this.discoveredEndpoints.length; i++) {
      if (!this.isProbing) break;
      const ep = this.discoveredEndpoints[i];
      try {
        const res = await this.statusProber.probeEndpoint(ep.url);
        ep.statusCode = res.status;
        ep.statusText = res.statusText;
        ep.contentType = res.contentType;
        ep.vulnTags = this.statusProber.classifyVulnerabilityParameters(ep.url);

        count++;
        this.sendMessageToPopup('endpointProbed', {
          index: i,
          url: ep.url,
          status: res.status,
          statusText: res.statusText,
          vulnTags: ep.vulnTags,
          progress: Math.round((count / this.discoveredEndpoints.length) * 100)
        });
      } catch (e) {}

      await new Promise(r => setTimeout(r, 200));
    }

    this.isProbing = false;
    this.addLog(`✅ Status probe completed for ${count} endpoints`, 'success');
    this.sendMessageToPopup('probingComplete', { count });
  }

  // ================================================================
  // 📦 POSTMAN COLLECTION v2.1 EXPORT (v2.0)
  // ================================================================


  handleWsFrame(data) {
    this.wsFrames.unshift(data);
    if (this.wsFrames.length > 300) this.wsFrames.pop();
    this.sendMessageToPopup('wsFrameReceived', { frame: data });
  }

  // ================================================================
  // 📦 HAR (HTTP ARCHIVE 1.2) EXPORT (v4.0)
  // ================================================================

  exportHTMLReport() {
    try {
      const html = this.htmlReportGenerator.generateReport(this);
      const blob = new Blob([html], { type: 'text/html' });
      const reader = new FileReader();
      reader.onload = () => {
        chrome.downloads.download({
          url: reader.result,
          filename: 'recon_report_' + (this.baseDomain || 'endpoints').replace(/[^a-zA-Z0-9_-]/g, '_') + '.html',
          saveAs: true
        });
      };
      reader.readAsDataURL(blob);
      this.addLog('📄 Exported standalone Interactive HTML Recon Report (recon_report.html)', 'success');
    } catch (e) {
      this.addLog('❌ HTML Report Export Error: ' + e.message, 'error');
    }
  }

  exportBashScript() {
    try {
      const script = this.bashCurlExporter.generateScript(
        this.discoveredEndpoints,
        GLOBAL_AUTH,
        this.baseDomain || 'target.com'
      );
      const blob = new Blob([script], { type: 'text/x-sh' });
      const reader = new FileReader();
      reader.onload = () => {
        chrome.downloads.download({
          url: reader.result,
          filename: 'recon_audit_' + (this.baseDomain || 'endpoints').replace(/[^a-zA-Z0-9_-]/g, '_') + '.sh',
          saveAs: true
        });
      };
      reader.readAsDataURL(blob);
      this.addLog('🐚 Exported executable Recon Bash script (recon_audit.sh)', 'success');
    } catch (e) {
      this.addLog('❌ Bash Export Error: ' + e.message, 'error');
    }
  }

  exportHAR() {
    try {
      const entries = (this.sniffedRequests || []).map((req, idx) => {
        let parsed;
        try { parsed = new URL(req.url); } catch (e) {}

        const queryString = parsed
          ? Array.from(parsed.searchParams.entries()).map(([k, v]) => ({ name: k, value: v }))
          : [];

        return {
          startedDateTime: new Date(req.timestamp || Date.now()).toISOString(),
          time: req.duration || 25,
          request: {
            method: req.method || 'GET',
            url: req.url,
            httpVersion: 'HTTP/1.1',
            headers: [
              { name: 'User-Agent', value: 'EndpointHunter/4.0' },
              { name: 'Accept', value: '*/*' }
            ],
            queryString,
            cookies: [],
            headersSize: -1,
            bodySize: 0
          },
          response: {
            status: req.status || 200,
            statusText: req.statusText || 'OK',
            httpVersion: 'HTTP/1.1',
            headers: [],
            cookies: [],
            content: {
              size: 0,
              mimeType: 'application/json'
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1
          },
          cache: {},
          timings: {
            send: 0,
            wait: req.duration || 25,
            receive: 0
          }
        };
      });

      const har = {
        log: {
          version: '1.2',
          creator: {
            name: 'Endpoint Hunter',
            version: '4.0.0'
          },
          browser: {
            name: 'Chromium',
            version: '120.0'
          },
          pages: [],
          entries
        }
      };

      const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
      const reader = new FileReader();
      reader.onload = () => {
        chrome.downloads.download({
          url: reader.result,
          filename: 'endpoint-hunter-' + Date.now() + '.har',
          saveAs: true
        });
      };
      reader.readAsDataURL(blob);
      this.addLog('📦 HTTP Archive (.har) export generated', 'success');
    } catch (e) {
      this.addLog('❌ HAR export error: ' + e.message, 'error');
    }
  }

  exportPostmanCollection() {
    try {
      const items = this.discoveredEndpoints.map(ep => {
        let parsed;
        try { parsed = new URL(ep.url); } catch (e) {}
        const pathSegments = parsed ? parsed.pathname.split('/').filter(Boolean) : [];
        const queryParams = parsed ? Array.from(parsed.searchParams.entries()).map(([k, v]) => ({ key: k, value: v })) : [];

        return {
          name: `${ep.method || 'GET'} ${parsed ? parsed.pathname : ep.url}`,
          request: {
            method: ep.method || 'GET',
            header: [
              { key: 'Accept', value: 'application/json, text/plain, */*' }
            ],
            url: {
              raw: ep.url,
              protocol: parsed ? parsed.protocol.replace(':', '') : 'https',
              host: parsed ? parsed.hostname.split('.') : [],
              path: pathSegments,
              query: queryParams
            },
            description: `Type: ${ep.type || 'api'} | Source: ${ep.source || 'crawl'} | Discovered by Endpoint Hunter v2.0`
          }
        };
      });

      const collection = {
        info: {
          _postman_id: 'eh-' + Date.now(),
          name: `Endpoint Hunter — ${this.baseDomain || 'Collection'}`,
          description: `Discovered API collection for ${this.baseDomain} exported on ${new Date().toISOString()}`,
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        item: items
      };

      const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(collection, null, 2))}`;
      chrome.downloads.download({
        url: dataUrl,
        filename: `postman-collection-${this.baseDomain || 'endpoints'}.json`,
        saveAs: true
      });
      this.addLog('📦 Postman Collection exported successfully', 'success');
    } catch (e) {
      this.addLog(`❌ Postman export error: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 📜 OPENAPI 3.0 EXPORT (v2.0)
  // ================================================================

  exportOpenAPISpec() {
    try {
      const pathsObj = {};
      for (const ep of this.discoveredEndpoints) {
        let pathname = ep.url;
        let queryParams = [];
        try {
          const u = new URL(ep.url);
          pathname = u.pathname;
          queryParams = Array.from(u.searchParams.keys()).map(param => ({
            name: param,
            in: 'query',
            required: false,
            schema: { type: 'string' }
          }));
        } catch (e) {}

        if (!pathsObj[pathname]) pathsObj[pathname] = {};
        const method = (ep.method || 'GET').toLowerCase();
        pathsObj[pathname][method] = {
          tags: [ep.type || 'api'],
          summary: `Discovered ${ep.type} route: ${pathname}`,
          parameters: queryParams,
          responses: {
            '200': { description: 'Successful response' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Not found' }
          }
        };
      }

      const spec = {
        openapi: '3.0.0',
        info: {
          title: `Endpoint Hunter Recon Spec - ${this.baseDomain || 'Target'}`,
          version: '1.0.0',
          description: `Discovered attack surface for ${this.baseDomain} generated by Endpoint Hunter v2.0`
        },
        servers: [
          { url: this.baseDomain ? `https://${this.baseDomain}` : 'https://example.com' }
        ],
        paths: pathsObj
      };

      const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(spec, null, 2))}`;
      chrome.downloads.download({
        url: dataUrl,
        filename: `openapi-spec-${this.baseDomain || 'endpoints'}.json`,
        saveAs: true
      });
      this.addLog('📜 OpenAPI 3.0 spec exported successfully', 'success');
    } catch (e) {
      this.addLog(`❌ OpenAPI export error: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 📋 TXT EXPORT (CLI READY FOR FFUF / NUCLEI / KATANA) (v2.0)
  // ================================================================

  exportTXT() {
    try {
      const urls = Array.from(new Set(this.discoveredEndpoints.map(e => e.url))).join('\n');
      const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(urls)}`;
      chrome.downloads.download({
        url: dataUrl,
        filename: `endpoints-${this.baseDomain || 'list'}.txt`,
        saveAs: true
      });
      this.addLog('📋 TXT endpoints exported successfully', 'success');
    } catch (e) {
      this.addLog(`❌ TXT export error: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 🔑 SECRETS EXPORT (v2.0)
  // ================================================================

  exportSecrets() {
    try {
      const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(this.discoveredSecrets, null, 2))}`;
      chrome.downloads.download({
        url: dataUrl,
        filename: `secrets-${this.baseDomain || 'leaks'}.json`,
        saveAs: true
      });
      this.addLog('🔑 Secrets exported successfully', 'success');
    } catch (e) {
      this.addLog(`❌ Secrets export error: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 📢 DISCORD & SLACK WEBHOOK ALERTS (v2.0)
  // ================================================================

  async sendDiscordAlert(title, description, fields = []) {
    if (!WEBHOOK_CONFIG.discord) return;
    try {
      const body = {
        username: "Endpoint Hunter",
        avatar_url: "https://raw.githubusercontent.com/pratik-khairnar-sec/endpoint-finder-extension/main/icon128.png",
        embeds: [{
          title: title,
          description: description,
          color: 0x58a6ff,
          fields: fields,
          footer: { text: "Endpoint Hunter v2.0 • Offline Recon Suite" },
          timestamp: new Date().toISOString()
        }]
      };
      await fetch(WEBHOOK_CONFIG.discord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (e) {}
  }

  async sendSlackAlert(text) {
    if (!WEBHOOK_CONFIG.slack) return;
    try {
      await fetch(WEBHOOK_CONFIG.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
    } catch (e) {}
  }

  // ================================================================
  // 📂 CHECK COMMON FILES (OLD - PRESERVED)
  // ================================================================

  async checkCommonFiles(baseUrl) {
    const commonFiles = [
      '/robots.txt', '/sitemap.xml', '/sitemap_index.xml',
      '/.env', '/config.json', '/config.yaml', '/config.yml',
      '/package.json', '/composer.json', '/bower.json',
      '/swagger.json', '/openapi.json',
      '/manifest.json', '/humans.txt', '/security.txt', '/ads.txt'
    ];

    for (const file of commonFiles) {
      try {
        const url = new URL(file, baseUrl).toString();
        if (!this.isSameDomain(url)) continue;
        
        const response = await this.stealthEngine.stealthFetch(url);
        if (response && response.ok) {
          const content = await response.text();
          
          this.addEndpoint({
            url: url,
            method: 'GET',
            type: this.classifyEndpoint(url),
            source: 'common-file',
            foundOn: baseUrl
          });

          if (file.includes('sitemap')) {
            const urls = this.parseSitemap(content);
            for (const sitemapUrl of urls) {
              if (this.isSameDomain(sitemapUrl) && !this.discoveredUrls.has(sitemapUrl) && !this.scannedPages.has(sitemapUrl)) {
                this.discoveredUrls.add(sitemapUrl);
                this.scanQueue.push(sitemapUrl);
                this.totalLinks++;
                this.addLog(`🔗 Sitemap URL: ${sitemapUrl}`, 'link', { url: sitemapUrl, source: 'sitemap' });
              }
            }
          }

          if (file === '/.env') {
            const envEndpoints = this.parseEnvFile(content);
            for (const ep of envEndpoints) {
              const normalized = this.normalizeEndpoint(ep, baseUrl);
              if (this.isSameDomain(normalized)) {
                this.addEndpoint({
                  url: normalized,
                  method: 'GET',
                  type: this.classifyEndpoint(ep),
                  source: 'env-file',
                  foundOn: baseUrl
                });
                this.addLog(`📄 .env Endpoint: ${normalized}`, 'endpoint', { url: normalized, source: 'env-file' });
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  // ================================================================
  // 📊 PARSE SITEMAP (OLD - PRESERVED)
  // ================================================================

  parseSitemap(content) {
    const urls = [];
    const urlRegex = /<loc>([^<]+)<\/loc>/gi;
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  }

  // ================================================================
  // 📄 PARSE .env FILE (OLD - PRESERVED)
  // ================================================================

  parseEnvFile(content) {
    const endpoints = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('http') || line.includes('https')) {
        const match = line.match(/https?:\/\/[^\s"']+/);
        if (match) {
          endpoints.push(match[0]);
        }
      }
      if (line.includes('API') || line.includes('URL') || line.includes('ENDPOINT')) {
        const parts = line.split('=');
        if (parts.length > 1) {
          const value = parts.slice(1).join('=').trim();
          if (value.startsWith('http')) {
            endpoints.push(value);
          }
        }
      }
    }
    return endpoints;
  }

  // ================================================================
  // 🔗 SHOULD FOLLOW LINK (OLD - PRESERVED)
  // ================================================================

  shouldFollowLink(url) {
    try {
      const domain = url.hostname;
      if (!CRAWL_CONFIG.followExternal && domain !== this.baseDomain) {
        return false;
      }
      const skipExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.7z',
        '.mp3', '.mp4', '.avi', '.mkv', '.webm'];
      const ext = url.pathname.split('.').pop()?.toLowerCase();
      if (ext && skipExtensions.includes('.' + ext)) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // ================================================================
  // ⏱️ STEALTH DELAY (OLD - PRESERVED)
  // ================================================================

  async stealthDelay() {
    if (!CRAWL_CONFIG.stealthMode) {
      await new Promise(r => setTimeout(r, 500));
      return;
    }
    const delay = Math.floor(Math.random() * 3000) + 1000;
    await new Promise(r => setTimeout(r, delay));
  }

  // ================================================================
  // ⏳ WAIT FOR PAGE LOAD (OLD - PRESERVED)
  // ================================================================

  async waitForPageLoad(tabId) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 30000);
      const listener = (tabId, info) => {
        if (info.status === 'complete') {
          clearTimeout(timeout);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      chrome.tabs.get(tabId, (tab) => {
        if (tab?.status === 'complete') {
          clearTimeout(timeout);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
  }

  // ================================================================
  // 📡 FETCH CONTENT (OLD - PRESERVED + UPGRADED WITH STEALTH/BYPASS)
  // ================================================================

  async fetchContent(url) {
    try {
      // Try stealth fetch first
      let response = await this.stealthEngine.stealthFetch(url);
      if (response && response.ok) {
        return await response.text();
      }
      
      // If stealth fails, try bypass
      if (response && (response.status === 403 || response.status === 401)) {
        this.addLog(`🛡️ Bypass attempt for: ${url}`, 'bypass', { url, status: response.status });
        response = await this.bypassEngine.bypassFetch(url);
        if (response && response.ok) {
          return await response.text();
        }
      }
    } catch (e) {
      this.addLog(`⚠️ Fetch error for ${url}: ${e.message}`, 'error', { url, error: e.message });
    }
    return null;
  }

  // ================================================================
  // 📤 SEND TELEGRAM REPORT (OLD - PRESERVED + UPGRADED)
  // ================================================================

  async sendTelegramReport() {
    if (!TELEGRAM.enabled || !TELEGRAM.token) {
      this.addLog('⚠️ Telegram not configured', 'warning');
      return;
    }

    try {
      const endpoints = this.discoveredEndpoints;
      const total = endpoints.length;
      const types = {};
      for (const ep of endpoints) {
        types[ep.type] = (types[ep.type] || 0) + 1;
      }

      const typeSummary = Object.entries(types)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([type, count]) => `  • ${type}: ${count}`)
        .join('\n');

      const topEndpoints = endpoints.slice(0, 15)
        .map((ep, i) => `${i+1}. ${ep.method} ${ep.url}`)
        .join('\n');

      const stealthStats = this.stealthEngine.getStats();
      const bypassStats = this.bypassEngine.getStats();

      const message =
`🔗 <b>ENDPOINT HUNTER ULTIMATE REPORT</b>

📍 Target: ${this.baseDomain || 'Unknown'}
📄 Pages Crawled: ${this.totalPages}
🎯 Endpoints Found: ${total}
📁 Paths Found: ${this.discoveredPaths.size}
📊 Parameters Found: ${this.discoveredParams.size}
🕵️ Stealth Rate: ${stealthStats.successRate}
🛡️ Bypass Rate: ${bypassStats.successRate}

📊 Endpoint Breakdown:
${typeSummary}

🔴 Top 15 Endpoints:
${topEndpoints || 'None found'}

⏱ Time: ${new Date().toISOString()}
🔗 Source: Endpoint Hunter v5.0 - STEALTH MODE`;

      const url = `https://api.telegram.org/bot${TELEGRAM.token}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM.chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      const jsonData = JSON.stringify({
        timestamp: new Date().toISOString(),
        target: this.baseDomain,
        pages: this.totalPages,
        paths: Array.from(this.discoveredPaths),
        params: Array.from(this.discoveredParams),
        endpoints: this.discoveredEndpoints,
        stats: {
          total: this.totalEndpoints,
          types: types
        },
        stealthStats: stealthStats,
        bypassStats: bypassStats
      }, null, 2);

      const blob = new Blob([jsonData], { type: 'application/json' });
      const formData = new FormData();
      formData.append('chat_id', TELEGRAM.chatId);
      formData.append('document', blob, `endpoint-report-${Date.now()}.json`);

      await fetch(`https://api.telegram.org/bot${TELEGRAM.token}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      this.addLog('📤 Telegram report sent', 'success');

    } catch (e) {
      this.addLog(`❌ Failed to send Telegram report: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 📤 SEND MANUAL TELEGRAM REPORT (OLD - PRESERVED)
  // ================================================================

  async sendManualTelegramReport() {
    if (!TELEGRAM.enabled || !TELEGRAM.token) {
      this.addLog('⚠️ Telegram not configured', 'warning');
      return;
    }
    if (this.discoveredEndpoints.length === 0) {
      this.addLog('⚠️ No endpoints found to report', 'warning');
      return;
    }
    await this.sendTelegramReport();
  }

  // ================================================================
  // 📄 GENERATE PDF REPORT (OLD - PRESERVED)
  // ================================================================

  async generatePDFReport() {
    try {
      const endpoints = this.discoveredEndpoints;
      const types = {};
      for (const ep of endpoints) {
        types[ep.type] = (types[ep.type] || 0) + 1;
      }

      const html = this.generateReportHTML(endpoints, types);
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

      chrome.downloads.download({
        url: dataUrl,
        filename: `endpoint-report-${new Date().toISOString().slice(0,10)}.html`,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          this.addLog(`❌ PDF download error: ${chrome.runtime.lastError.message}`, 'error');
        } else {
          this.addLog('📄 PDF Report downloaded', 'success');
        }
      });

    } catch (e) {
      this.addLog(`❌ Failed to generate PDF: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 📄 GENERATE REPORT HTML (OLD - PRESERVED + UPGRADED)
  // ================================================================

  generateReportHTML(endpoints, types) {
    const typeRows = Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`)
      .join('');

    const endpointRows = endpoints.slice(0, 100)
      .map(ep => `<tr><td>${ep.method}</td><td>${this.escapeHtml(ep.url)}</td><td>${ep.type}</td><td>${ep.source || 'unknown'}</td></tr>`)
      .join('');

    const pathRows = Array.from(this.discoveredPaths).slice(0, 100)
      .map(path => `<tr><td>${this.escapeHtml(path)}</td></tr>`)
      .join('');

    const stealthStats = this.stealthEngine.getStats();
    const bypassStats = this.bypassEngine.getStats();

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🔗 Endpoint Hunter - STEALTH MODE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Courier New', monospace;
      background: #0a0e17;
      color: #c8d0dc;
      padding: 30px;
      line-height: 1.6;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    .header {
      text-align: center;
      padding: 40px 0;
      border-bottom: 3px solid #58a6ff;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 44px;
      color: #58a6ff;
      text-shadow: 0 0 40px rgba(88,166,255,0.3);
      letter-spacing: 3px;
    }
    .header .subtitle { color: #8b949e; font-size: 18px; margin-top: 8px; }
    .header .meta { color: #6d7a8a; font-size: 13px; margin-top: 12px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: #0d1117;
      border: 1px solid #1c2333;
      border-radius: 8px;
      padding: 15px 20px;
      text-align: center;
    }
    .summary-card .label { color: #8b949e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .summary-card .value { font-size: 24px; font-weight: bold; color: #58a6ff; margin-top: 4px; }
    .section {
      background: #0d1117;
      border: 1px solid #1c2333;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .section h2 { color: #58a6ff; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #1c2333; padding-bottom: 10px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    table th {
      text-align: left;
      padding: 8px 12px;
      background: #0a0e17;
      color: #8b949e;
      border-bottom: 2px solid #1c2333;
      text-transform: uppercase;
      font-size: 10px;
    }
    table td {
      padding: 6px 12px;
      border-bottom: 1px solid #1c2333;
      word-break: break-all;
    }
    .footer {
      text-align: center;
      padding: 30px 0;
      border-top: 1px solid #1c2333;
      margin-top: 40px;
      color: #6d7a8a;
      font-size: 13px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge.api { background: #1a3a5a; color: #58a6ff; }
    .badge.admin { background: #3a1a1a; color: #f85149; }
    .badge.auth { background: #2a2a1a; color: #f0883e; }
    .badge.payment { background: #1a2a1a; color: #3fb950; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🔗 ENDPOINT HUNTER ULTIMATE</h1>
    <div class="subtitle">🕵️ STEALTH MODE - SOC TEAM KO NAHI PATA CHALEGA</div>
    <div class="meta">
      Generated: ${new Date().toISOString().replace('T', ' ').slice(0,19)}
      | 🕵️ Stealth Rate: ${stealthStats.successRate}
      | 🛡️ Bypass Rate: ${bypassStats.successRate}
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Pages Crawled</div>
      <div class="value">${this.totalPages}</div>
    </div>
    <div class="summary-card critical">
      <div class="label">Endpoints</div>
      <div class="value">${endpoints.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Paths</div>
      <div class="value">${this.discoveredPaths.size}</div>
    </div>
    <div class="summary-card">
      <div class="label">Parameters</div>
      <div class="value">${this.discoveredParams.size}</div>
    </div>
  </div>

  <div class="section">
    <h2>📊 Endpoint Breakdown by Type</h2>
    <table>
      <thead><tr><th>Type</th><th>Count</th></tr></thead>
      <tbody>${typeRows || '<tr><td colspan="2">No endpoints found</td></tr>'}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>🎯 Endpoints (${Math.min(endpoints.length, 100)} of ${endpoints.length})</h2>
    <table>
      <thead><tr><th>Method</th><th>URL</th><th>Type</th><th>Source</th></tr></thead>
      <tbody>${endpointRows || '<tr><td colspan="4">No endpoints found</td></tr>'}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>📁 Paths (${Math.min(this.discoveredPaths.size, 100)} of ${this.discoveredPaths.size})</h2>
    <table>
      <thead><tr><th>Path</th></tr></thead>
      <tbody>${pathRows || '<tr><td>No paths found</td></tr>'}</tbody>
    </table>
  </div>

  <div class="footer">
    🔗 ENDPOINT HUNTER ULTIMATE v5.0 - STEALTH MODE<br>
    ${new Date().toISOString().replace('T', ' ').slice(0,19)}<br>
    <span style="color:#58a6ff;">🕵️ SOC Team ko nahi pata chalega!</span>
  </div>
</div>
</body>
</html>`;
  }

  // ================================================================
  // 📤 EXPORT RESULTS (OLD - PRESERVED + UPGRADED)
  // ================================================================

  async exportResults() {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        target: this.baseDomain || 'Unknown',
        pagesCrawled: this.totalPages,
        totalEndpoints: this.totalEndpoints,
        endpoints: this.discoveredEndpoints,
        paths: Array.from(this.discoveredPaths),
        params: Array.from(this.discoveredParams),
        stats: {
          pages: this.totalPages,
          links: this.totalLinks,
          endpoints: this.totalEndpoints,
          paths: this.discoveredPaths.size,
          params: this.discoveredParams.size
        },
        stealthStats: this.stealthEngine.getStats(),
        bypassStats: this.bypassEngine.getStats()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url: url,
        filename: `endpoint-export-${new Date().toISOString().slice(0,10)}.json`,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          this.addLog(`❌ Export error: ${chrome.runtime.lastError.message}`, 'error');
        } else {
          this.addLog('📤 Results exported successfully', 'success');
        }
      });

    } catch (e) {
      this.addLog(`❌ Export error: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 🛑 STOP CRAWL (OLD - PRESERVED + UPGRADED)
  // ================================================================

  stopCrawl() {
    this.isRunning = false;
    this.isPaused = false;
    this.isProbing = false;
    this.isSniffing = false;
    this.scanQueue = [];
    this.addLog('⏹ Scan stopped by user (Crawl, Sniffer & Prober halted)', 'info');
    this.sendMessageToPopup('crawlStopped', {});
    this.sendMessageToPopup('snifferStateChanged', { active: false });
  }

  // ================================================================
  // ⏸ PAUSE CRAWL (OLD - PRESERVED)
  // ================================================================

  pauseCrawl() {
    this.isPaused = true;
    this.addLog('⏸ Crawl paused', 'info');
    this.sendMessageToPopup('crawlPaused', {});
  }

  // ================================================================
  // ▶ RESUME CRAWL (OLD - PRESERVED)
  // ================================================================

  resumeCrawl(tabId) {
    this.isPaused = false;
    this.addLog('▶ Crawl resumed', 'info');
    this.sendMessageToPopup('crawlResumed', {});
    this.processQueue(tabId);
  }

  // ================================================================
  // 🎯 SCAN CURRENT PAGE ONLY (OLD - PRESERVED + UPGRADED)
  // ================================================================

  async scanCurrentPageOnly(tabId, url) {
    this.addLog(`🎯 Scanning current page: ${url}`, 'info');
    this.currentUrl = url;

    try {
      this.baseDomain = new URL(url).hostname;
      await this.processPage(tabId, url);
      this.addLog('✅ Current page scan complete', 'success');
      this.sendMessageToPopup('currentPageScanComplete', {
        pages: this.totalPages,
        endpoints: this.totalEndpoints,
        paths: this.totalPaths,
        params: this.totalParams,
        secrets: this.discoveredSecrets.length
      });
    } catch (e) {
      this.addLog(`❌ Current page scan error: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 🔧 CLEAR DATA (OLD - PRESERVED + UPGRADED)
  // ================================================================

  clearData() {
    this.discoveredEndpoints = [];
    this.discoveredPaths = new Set();
    this.discoveredParams = new Set();
    this.discoveredSecrets = [];
    this.sniffedRequests = [];
    this.isProbing = false;
    this.isSniffing = false;
    this.scannedPages = new Map();
    this.scanQueue = [];
    this.discoveredUrls = new Set();
    this.totalPages = 0;
    this.totalLinks = 0;
    this.totalEndpoints = 0;
    this.totalPaths = 0;
    this.totalParams = 0;
    this.currentUrl = 'None';
    this.pageLogs = [];
    this.linkLogs = [];
    this.endpointLogs = [];
    this.pathLogs = [];
    this.paramLogs = [];
    this.fileLogs = [];
    this.bypassLogs = [];
    this.errorLogs = [];
    this.addLog('🗑️ All data cleared', 'info');
    this.sendMessageToPopup('dataCleared', {});
  }

  // ================================================================
  // 📊 GET STATS (OLD - PRESERVED + UPGRADED)
  // ================================================================

  getStats() {
    const types = {};
    for (const ep of this.discoveredEndpoints) {
      types[ep.type] = (types[ep.type] || 0) + 1;
    }

    return {
      totalPages: this.totalPages,
      totalLinks: this.totalLinks,
      totalEndpoints: this.totalEndpoints,
      totalPaths: this.discoveredPaths.size,
      totalParams: this.discoveredParams.size,
      totalSecrets: this.discoveredSecrets.length,
      totalSniffed: this.sniffedRequests.length,
      queueSize: this.scanQueue.length,
      currentUrl: this.currentUrl || 'None',
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isProbing: this.isProbing,
      isSniffing: this.isSniffing,
      endpoints: this.discoveredEndpoints,
      paths: Array.from(this.discoveredPaths),
      params: Array.from(this.discoveredParams),
      secrets: this.discoveredSecrets,
      sniffedRequests: this.sniffedRequests,
      types: types,
      startTime: this.startTime,
      scannedPages: this.scannedPages.size,
      stealthStats: this.stealthEngine.getStats(),
      bypassStats: this.bypassEngine.getStats()
    };
  }

  // ================================================================
  // 🛠️ HELPER FUNCTIONS (OLD - PRESERVED)
  // ================================================================

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }
}

// ================================================================
// 🚀 MAIN HUNTER INSTANCE (OLD - PRESERVED)
// ================================================================

const hunter = new CrawlEngine();

// ================================================================
// 📡 MESSAGE LISTENER (OLD - PRESERVED + UPGRADED)
// ================================================================

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  switch (request.action) {
    case 'startScan':
      if (hunter.isRunning) {
        sendResponse({ status: 'already_running' });
        return true;
      }
      hunter.startCrawl(request.tabId, request.url);
      sendResponse({ status: 'started' });
      return true;

    case 'scanCurrent':
      if (hunter.isRunning) {
        sendResponse({ status: 'already_running' });
        return true;
      }
      hunter.scanCurrentPageOnly(request.tabId, request.url);
      sendResponse({ status: 'scanning_current' });
      return true;

    case 'stopScan':
      hunter.stopCrawl();
      sendResponse({ status: 'stopped' });
      return true;

    case 'pauseScan':
      hunter.pauseCrawl();
      sendResponse({ status: 'paused' });
      return true;

    case 'resumeScan':
      hunter.resumeCrawl(request.tabId);
      sendResponse({ status: 'resumed' });
      return true;

    case 'getStats':
      sendResponse({ stats: hunter.getStats() });
      return true;

    case 'clear':
      hunter.clearData();
      sendResponse({ success: true });
      return true;

    case 'exportResults':
      hunter.exportResults();
      sendResponse({ success: true });
      return true;

    case 'exportPDF':
      hunter.generatePDFReport();
      sendResponse({ success: true });
      return true;

    case 'exportHAR':
      hunter.exportHAR();
      sendResponse({ success: true });
      return true;

    case 'wsFrameCaptured':
      if (hunter.isSniffing) {
        hunter.handleWsFrame(request.data);
      }
      sendResponse({ received: true });
      return true;

    case 'getWsFrames':
      sendResponse({ frames: hunter.wsFrames });
      return true;

    case 'clearWsFrames':
      hunter.wsFrames = [];
      sendResponse({ success: true });
      return true;

    case 'mineParameters':
      hunter.parameterMiner.mineParameters(
        request.url,
        request.delay || 180,
        (prog) => hunter.sendMessageToPopup('paramMinerProgress', prog)
      ).then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'triggerDOMWalk':
      try {
        if (request.tabId) {
          chrome.tabs.sendMessage(request.tabId, { action: 'triggerDOMWalk' })
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: false, error: err.message }));
        } else {
          sendResponse({ success: false, error: 'missing_tab_id' });
        }
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;

    case 'exportPostman':
      hunter.exportPostmanCollection();
      sendResponse({ success: true });
      return true;

    case 'exportOpenAPI':
      hunter.exportOpenAPISpec();
      sendResponse({ success: true });
      return true;

    case 'exportTXT':
      hunter.exportTXT();
      sendResponse({ success: true });
      return true;

    case 'exportSecrets':
      hunter.exportSecrets();
      sendResponse({ success: true });
      return true;

    case 'unpackSourceMap':
      hunter.sourceMapUnpacker.unpack(request.url)
        .then(result => {
          hunter.unpackedSourceMaps.set(request.url, result);
          if (result.apiEndpoints) {
            result.apiEndpoints.forEach(ep => {
              hunter.addDiscoveredEndpoint(ep.url, 'GET', 'sourcemap', 'source-map');
            });
          }
          sendResponse({ success: true, result });
        })
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'getUnpackedSourceMaps':
      sendResponse({ maps: Array.from(hunter.unpackedSourceMaps.values()) });
      return true;

    case 'introspectGraphQL':
      hunter.graphQLIntrospector.introspect(request.url, request.headers || {})
        .then(schema => sendResponse({ success: true, schema }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'sendRepeaterRequest':
      hunter.miniRepeater.sendRequest(request)
        .then(response => sendResponse({ success: true, response }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'startFuzzer':
      hunter.microFuzzer.startFuzzing(
        request.baseUrl,
        request.category,
        request.delay || 250,
        (hit) => {
          hunter.sendMessageToPopup('fuzzerHit', { hit });
        },
        (prog) => {
          hunter.sendMessageToPopup('fuzzerProgress', prog);
        }
      ).then(results => {
        hunter.sendMessageToPopup('fuzzerComplete', { count: results.length });
      }).catch(() => {});
      sendResponse({ status: 'fuzzing_started' });
      return true;

    case 'stopFuzzer':
      hunter.microFuzzer.stopFuzzing();
      sendResponse({ status: 'fuzzing_stopped' });
      return true;

    case 'getFuzzerResults':
      sendResponse({ results: hunter.microFuzzer.results, isFuzzing: hunter.microFuzzer.isFuzzing });
      return true;

    case 'getGlobalHeaders':
      sendResponse({ headers: GLOBAL_AUTH });
      return true;

    case 'setGlobalHeaders':
      GLOBAL_AUTH = { ...GLOBAL_AUTH, ...request.headers };
      chrome.storage.local.set({ globalAuth: GLOBAL_AUTH });
      sendResponse({ success: true });
      return true;

    case 'probeEndpoints':
      hunter.probeAllEndpoints();
      sendResponse({ status: 'probing_started' });
      return true;

    case 'toggleSniffer':
      hunter.isSniffing = !!request.active;
      try {
        if (request.tabId) {
          chrome.tabs.sendMessage(request.tabId, {
            action: 'setSnifferState',
            active: hunter.isSniffing
          }).catch(() => {});
        }
      } catch (e) {}
      hunter.addLog(`⚡ Live Network Sniffer is now ${hunter.isSniffing ? 'ACTIVE' : 'INACTIVE'}`, 'info');
      sendResponse({ active: hunter.isSniffing });
      return true;

    case 'networkRequestCaptured':
      if (hunter.isSniffing) {
        hunter.handleSniffedRequest(request.data);
      }
      sendResponse({ received: true });
      return true;

    case 'getSecrets':
      sendResponse({ secrets: hunter.discoveredSecrets });
      return true;

    case 'getSniffedRequests':
      sendResponse({ requests: hunter.sniffedRequests });
      return true;

    case 'sendTelegramReport':
      hunter.sendManualTelegramReport();
      sendResponse({ success: true });
      return true;

    case 'getTelegramConfig':
      sendResponse({ config: TELEGRAM });
      return true;

    case 'setTelegramConfig':
      TELEGRAM = { ...TELEGRAM, ...request.config };
      chrome.storage.local.set({ telegramConfig: TELEGRAM });
      sendResponse({ success: true });
      return true;

    case 'getWebhookConfig':
      sendResponse({ config: WEBHOOK_CONFIG });
      return true;

    case 'setWebhookConfig':
      WEBHOOK_CONFIG = { ...WEBHOOK_CONFIG, ...request.config };
      chrome.storage.local.set({ webhookConfig: WEBHOOK_CONFIG });
      sendResponse({ success: true });
      return true;

    case 'getCrawlConfig':
      sendResponse({ config: CRAWL_CONFIG });
      return true;

    case 'setCrawlConfig':
      CRAWL_CONFIG = { ...CRAWL_CONFIG, ...request.config };
      chrome.storage.local.set({ crawlConfig: CRAWL_CONFIG });
      sendResponse({ success: true });
      return true;

    case 'getEndpoints':
      sendResponse({ endpoints: hunter.discoveredEndpoints });
      return true;

    case 'getPaths':
      sendResponse({ paths: Array.from(hunter.discoveredPaths) });
      return true;

    case 'getParams':
      sendResponse({ params: Array.from(hunter.discoveredParams) });
      return true;

    case 'getLogs':
      sendResponse({ logs: hunter.pageLogs.slice(-100) });
      return true;

    default:
      sendResponse({ error: 'unknown_action' });
      return true;
  }
});

// ================================================================
// 💾 LOAD CONFIGURATION & INITIALIZATION (v2.0)
// ================================================================

(async function loadConfig() {
  try {
    const data = await chrome.storage.local.get(['telegramConfig', 'webhookConfig', 'crawlConfig', 'globalAuth']);
    if (data.globalAuth) {
      GLOBAL_AUTH = { ...GLOBAL_AUTH, ...data.globalAuth };
    }
    if (data.telegramConfig) {
      TELEGRAM = { ...TELEGRAM, ...data.telegramConfig };
    }
    if (data.webhookConfig) {
      WEBHOOK_CONFIG = { ...WEBHOOK_CONFIG, ...data.webhookConfig };
    }
    if (data.crawlConfig) {
      CRAWL_CONFIG = { ...CRAWL_CONFIG, ...data.crawlConfig };
    }
  } catch (e) {}

  // Configure Side Panel behavior (prevent automatic popup hijacking)
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }

  console.log(`
================================================================================
🔗 ENDPOINT HUNTER v4.0 - ADVANCED RECONNAISSANCE SUITE
================================================================================
🛡️ High-Precision Zero False-Positive Discovery Engine
🔑 Leaked Secrets & API Tokens Harvester: READY
⚡ Live Network Sniffer: READY (Manual Start Only)
🎯 Live Status Prober: READY
🪟 Persistent Side Panel Support: READY
📦 Multi-Format Exports: JSON, TXT, PDF, Postman v2.1, OpenAPI 3.0
📢 Webhook Alerts: Telegram, Discord, Slack
🛑 Auto-Start: DISABLED (Manual button trigger only)
================================================================================
⚠️ This tool is for EDUCATIONAL and AUTHORIZED testing purposes only.
💀 Hack The Planet - Responsibly!
================================================================================
  `);
})();
