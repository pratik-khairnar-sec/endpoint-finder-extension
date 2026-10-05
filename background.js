// ================================================================
// 🔗 ENDPOINT HUNTER v1.0 - ADVANCED ENDPOINT RECONNAISSANCE
// ================================================================
// 👤 Author: Pratik Khairnar (https://github.com/pratik-khairnar-sec)
// 🛡️ High-Precision Zero False-Positive Discovery Engine
// ================================================================

// ================================================================
// 📦 TELEGRAM CONFIGURATION (OLD - PRESERVED)
// ================================================================

let TELEGRAM = {
  token: '',
  chatId: '',
  enabled: false
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
// 🔥 ENDPOINT PATTERNS DATABASE (OLD - PRESERVED)
// ================================================================

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
  // 🛑 STOP CRAWL (OLD - PRESERVED)
  // ================================================================

  stopCrawl() {
    this.isRunning = false;
    this.isPaused = false;
    this.addLog('⏹ Crawl stopped by user', 'info');
    this.sendMessageToPopup('crawlStopped', {});
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
        params: this.totalParams
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
      queueSize: this.scanQueue.length,
      currentUrl: this.currentUrl || 'None',
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      endpoints: this.discoveredEndpoints,
      paths: Array.from(this.discoveredPaths),
      params: Array.from(this.discoveredParams),
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
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
// 💾 LOAD CONFIGURATION (OLD - PRESERVED)
// ================================================================

(async function loadConfig() {
  try {
    const data = await chrome.storage.local.get('telegramConfig');
    if (data.telegramConfig) {
      TELEGRAM = { ...TELEGRAM, ...data.telegramConfig };
    }
  } catch (e) {}

  try {
    const data = await chrome.storage.local.get('crawlConfig');
    if (data.crawlConfig) {
      CRAWL_CONFIG = { ...CRAWL_CONFIG, ...data.crawlConfig };
    }
  } catch (e) {}

  console.log('[ENDPOINT_HUNTER] 🔗 v5.0 - ULTIMATE STEALTH + BYPASS');
  console.log('[ENDPOINT_HUNTER] 🕵️ STEALTH MODE: ENABLED - SOC team ko nahi pata chalega');
  console.log('[ENDPOINT_HUNTER] 🛡️ BYPASS: ENABLED - 403/401/429 bypass');
  console.log('[ENDPOINT_HUNTER] 📤 Telegram: ' + (TELEGRAM.enabled ? 'Enabled' : 'Disabled'));
})();

// ================================================================
// 🔥 NEW - PATH COLLECTOR + SILENT AUTO-SCANNER
// ================================================================
// 📌 Yeh code tumhare existing code ke END mein add karo
// 📌 Kuch delete mat karo, sirf ye add karo
// ================================================================

// ================================================================
// 📦 PATH COLLECTOR CONFIG
// ================================================================

let PATH_COLLECTOR = {
  active: true,
  batchSize: 10,
  allPaths: [],
  totalFound: 0,
  baseDomain: '',
  methodsUsed: new Set(),
  lastAlertCount: 0,
  isAlerting: false,
  processedUrls: new Set(),
};

// ================================================================
// 🔍 COLLECT PATHS - METHOD + FULL URL + SOURCE
// ================================================================

async function collectPaths(tabId, url) {
  try {
    // Set base domain
    try {
      const u = new URL(url);
      PATH_COLLECTOR.baseDomain = u.origin;
    } catch (e) {}

    // Extract paths from page
    const result = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (baseUrl) => {
        const items = [];
        const seen = new Set();

        // 1️⃣ HREF - GET method
        document.querySelectorAll('a[href]').forEach(el => {
          const href = el.href;
          try {
            const url = new URL(href);
            if (url.pathname && url.pathname.length > 1 && !seen.has(url.pathname)) {
              seen.add(url.pathname);
              items.push({
                path: url.pathname,
                fullUrl: href,
                method: 'GET',
                source: 'href',
                element: el.tagName,
              });
            }
          } catch (e) {}
        });

        // 2️⃣ FORM ACTION - POST method
        document.querySelectorAll('form[action]').forEach(el => {
          const action = el.action;
          try {
            const url = new URL(action);
            if (url.pathname && url.pathname.length > 1 && !seen.has(url.pathname)) {
              seen.add(url.pathname);
              items.push({
                path: url.pathname,
                fullUrl: action,
                method: (el.method || 'POST').toUpperCase(),
                source: 'form-action',
                element: 'form',
              });
            }
          } catch (e) {}
        });

        // 3️⃣ SRC - GET method
        document.querySelectorAll('[src]').forEach(el => {
          const src = el.src;
          if (src) {
            try {
              const url = new URL(src);
              if (url.pathname && url.pathname.length > 1 && !seen.has(url.pathname)) {
                seen.add(url.pathname);
                items.push({
                  path: url.pathname,
                  fullUrl: src,
                  method: 'GET',
                  source: 'src',
                  element: el.tagName,
                });
              }
            } catch (e) {}
          }
        });

        // 4️⃣ API PATTERNS from text
        const apiPatterns = [
          /\/api\/[^\s'"<>]+/gi,
          /\/v\d+\/[^\s'"<>]+/gi,
          /\/graphql[^\s'"<>]*/gi,
          /\/admin[^\s'"<>]*/gi,
          /\/dashboard[^\s'"<>]*/gi,
          /\/auth[^\s'"<>]*/gi,
          /\/login[^\s'"<>]*/gi,
          /\/register[^\s'"<>]*/gi,
          /\/payment[^\s'"<>]*/gi,
          /\/checkout[^\s'"<>]*/gi,
        ];

        const html = document.documentElement.outerHTML;
        for (const pattern of apiPatterns) {
          let match;
          const regex = new RegExp(pattern);
          while ((match = regex.exec(html)) !== null) {
            const path = match[0];
            if (!seen.has(path)) {
              seen.add(path);
              const fullUrl = path.startsWith('/') ? baseUrl + path : path;
              items.push({
                path: path,
                fullUrl: fullUrl,
                method: 'GET',
                source: 'api-pattern',
                element: 'text',
              });
            }
          }
        }

        return items;
      },
      args: [PATH_COLLECTOR.baseDomain]
    });

    const paths = result?.[0]?.result || [];
    
    // Add to collection
    for (const item of paths) {
      if (item.fullUrl && !PATH_COLLECTOR.allPaths.some(p => p.fullUrl === item.fullUrl)) {
        PATH_COLLECTOR.allPaths.push(item);
        PATH_COLLECTOR.totalFound++;
        PATH_COLLECTOR.methodsUsed.add(item.method);
      }
    }

    // 🔥 CHECK: 10 paths ho gaye?
    const currentCount = PATH_COLLECTOR.allPaths.length;
    const batchNumber = Math.floor(currentCount / PATH_COLLECTOR.batchSize);
    
    if (currentCount >= PATH_COLLECTOR.batchSize && batchNumber > PATH_COLLECTOR.lastAlertCount) {
      PATH_COLLECTOR.lastAlertCount = batchNumber;
      await sendPathAlert();
    }

    // 💾 Save data
    await savePathData();

  } catch (e) {
    console.log('[PATH-COLLECTOR] Error:', e.message);
  }
}

// ================================================================
// 📤 SEND PATH ALERT - TELEGRAM
// ================================================================

async function sendPathAlert() {
  if (PATH_COLLECTOR.isAlerting) return;
  PATH_COLLECTOR.isAlerting = true;

  try {
    const all = PATH_COLLECTOR.allPaths;
    const start = (PATH_COLLECTOR.lastAlertCount - 1) * PATH_COLLECTOR.batchSize;
    const end = Math.min(start + PATH_COLLECTOR.batchSize, all.length);
    const batch = all.slice(start, end);

    const methods = Array.from(PATH_COLLECTOR.methodsUsed).join(', ');

    let message = `📊 <b>${batch.length} PATHS COLLECTED!</b>\n`;
    message += `🔧 <b>Methods Used:</b> ${methods}\n`;
    message += `📍 <b>Base Domain:</b> ${PATH_COLLECTOR.baseDomain}\n`;
    message += `📌 <b>Total Paths Found:</b> ${PATH_COLLECTOR.totalFound}\n\n`;
    message += `<b>📋 Full URLs with Methods:</b>\n`;

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      const method = item.method.padEnd(6);
      message += `${i+1}. <b>${method}</b> → ${item.fullUrl}\n`;
      message += `   📎 Source: ${item.source} | Element: ${item.element}\n`;
    }

    message += `\n─────────────────────\n`;
    message += `🕵️ Silent Mode: Active\n`;
    message += `⏱ Time: ${new Date().toISOString()}`;

    // Send to Telegram
    if (TELEGRAM.enabled && TELEGRAM.token) {
      const apiUrl = `https://api.telegram.org/bot${TELEGRAM.token}/sendMessage`;
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM.chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        })
      });
      console.log('[PATH-COLLECTOR] 📤 Alert sent!');
    }

  } catch (e) {
    console.log('[PATH-COLLECTOR] Alert error:', e.message);
  }

  PATH_COLLECTOR.isAlerting = false;
}

// ================================================================
// 🎯 SILENT AUTO-SCANNER - BACKGROUND MEIN CHALEGA
// ================================================================

// 🔥 JAB BHI PAGE LOAD HO - AUTO SCAN
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!PATH_COLLECTOR.active) return;
  if (info.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    const key = getUrlKey(tab.url);
    if (!PATH_COLLECTOR.processedUrls.has(key)) {
      PATH_COLLECTOR.processedUrls.add(key);
      // ⏳ Thoda delay taaki page load ho jaye
      await new Promise(r => setTimeout(r, 2000));
      await collectPaths(tabId, tab.url);
    }
  }
});

// 🔥 JAB BHI TAB CHANGE HO
chrome.tabs.onActivated.addListener(async (active) => {
  if (!PATH_COLLECTOR.active) return;
  try {
    const tab = await chrome.tabs.get(active.tabId);
    if (tab?.url && !tab.url.startsWith('chrome://')) {
      const key = getUrlKey(tab.url);
      if (!PATH_COLLECTOR.processedUrls.has(key)) {
        PATH_COLLECTOR.processedUrls.add(key);
        await new Promise(r => setTimeout(r, 2000));
        await collectPaths(active.tabId, tab.url);
      }
    }
  } catch (e) {}
});

// ================================================================
// 🛠️ HELPER FUNCTIONS
// ================================================================

function getUrlKey(url) {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname;
  } catch (e) {
    return url;
  }
}

// ================================================================
// 💾 SAVE/LOAD DATA
// ================================================================

async function savePathData() {
  try {
    const data = {
      allPaths: PATH_COLLECTOR.allPaths,
      totalFound: PATH_COLLECTOR.totalFound,
      methodsUsed: Array.from(PATH_COLLECTOR.methodsUsed),
      lastAlertCount: PATH_COLLECTOR.lastAlertCount,
      processedUrls: Array.from(PATH_COLLECTOR.processedUrls),
      timestamp: Date.now()
    };
    await chrome.storage.local.set({ pathCollectorData: data });
  } catch (e) {}
}

async function loadPathData() {
  try {
    const data = await chrome.storage.local.get('pathCollectorData');
    if (data.pathCollectorData) {
      PATH_COLLECTOR.allPaths = data.pathCollectorData.allPaths || [];
      PATH_COLLECTOR.totalFound = data.pathCollectorData.totalFound || 0;
      PATH_COLLECTOR.methodsUsed = new Set(data.pathCollectorData.methodsUsed || []);
      PATH_COLLECTOR.lastAlertCount = data.pathCollectorData.lastAlertCount || 0;
      PATH_COLLECTOR.processedUrls = new Set(data.pathCollectorData.processedUrls || []);
      console.log('[PATH-COLLECTOR] ✅ Loaded saved data:', PATH_COLLECTOR.totalFound, 'paths');
    }
  } catch (e) {}
}

// ================================================================
// 💾 LOAD DATA ON START
// ================================================================

loadPathData();

// ================================================================
// 💾 SAVE DATA PERIODICALLY
// ================================================================

setInterval(savePathData, 60000); // Every minute

// ================================================================
// 📡 NEW MESSAGE LISTENER - PATH COMMANDS
// ================================================================

// 🆕 ADD TO EXISTING MESSAGE LISTENER
// Tumhare existing listener ke ANDAR ye add karo
// Ya phir ek naya listener banao:

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Get Paths
  if (request.action === 'getPaths') {
    sendResponse({ 
      paths: PATH_COLLECTOR.allPaths,
      total: PATH_COLLECTOR.totalFound,
      methods: Array.from(PATH_COLLECTOR.methodsUsed),
    });
    return true;
  }

  // Get Path Stats
  if (request.action === 'getPathStats') {
    sendResponse({
      totalPaths: PATH_COLLECTOR.totalFound,
      uniquePaths: PATH_COLLECTOR.allPaths.length,
      methods: Array.from(PATH_COLLECTOR.methodsUsed),
      lastAlert: PATH_COLLECTOR.lastAlertCount,
      processedUrls: PATH_COLLECTOR.processedUrls.size,
    });
    return true;
  }

  // Clear Path Data
  if (request.action === 'clearPathData') {
    PATH_COLLECTOR.allPaths = [];
    PATH_COLLECTOR.totalFound = 0;
    PATH_COLLECTOR.methodsUsed = new Set();
    PATH_COLLECTOR.lastAlertCount = 0;
    PATH_COLLECTOR.processedUrls = new Set();
    savePathData();
    sendResponse({ success: true });
    return true;
  }

  // Manual Scan Current Page
  if (request.action === 'scanCurrentPaths') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (tab) {
        await collectPaths(tab.id, tab.url);
        sendResponse({ success: true });
      }
    });
    return true;
  }

  return false;
});

// ================================================================
// 🔥 STARTUP MESSAGE
// ================================================================

console.log(`
================================================================================
🔗 PATH COLLECTOR ACTIVATED!
================================================================================
📊 Har 10 paths pe Telegram alert
🔧 Methods: GET, POST, PUT, DELETE
🕵️ Silent Mode: Active - Pages move nahi honge
📌 Total Paths Found: ${PATH_COLLECTOR.totalFound}
📤 Telegram: ${TELEGRAM.enabled ? '✅ Enabled' : '❌ Disabled'}
================================================================================
`);

// ================================================================
// 💀 LEGAL DISCLAIMER (OLD - PRESERVED)
// ================================================================

console.log(`
================================================================================
🔗 ENDPOINT HUNTER v5.0 - ULTIMATE STEALTH + BYPASS
================================================================================
⚠️ This tool is for EDUCATIONAL and AUTHORIZED testing purposes only.

📌 DO NOT use this tool on websites you do not own or have explicit
   written permission to test.

📌 Unauthorized scanning of systems is ILLEGAL in most jurisdictions.

🕵️ STEALTH FEATURES:
   • Random delays (2-10 seconds)
   • Human-like scrolling
   • Human-like mouse movements
   • Random User-Agent rotation
   • Random Referer spoofing
   • Random parameter noise

🛡️ BYPASS FEATURES:
   • 403/401/429 automatic bypass
   • WAF bypass headers
   • IP rotation
   • Exponential backoff retry

💀 Hack The Planet - Responsibly!
================================================================================
`);