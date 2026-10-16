// ================================================================
// 🔗 ENDPOINT HUNTER - CONTENT SCRIPT (v4.0 UPGRADE)
// ================================================================
// Author: Pratik Khairnar (https://github.com/pratik-khairnar-sec)
// Handles DOM scraping, injected network/ws hook bridge & SPA Walker
// ================================================================

(function() {
  'use strict';

  console.log('[ENDPOINT_HUNTER] 🔗 Content script loaded (v4.0)');

  // ================================================================
  // 1️⃣ INJECT RUNTIME NETWORK & WS HOOK (MAIN WORLD)
  // ================================================================
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    console.debug('[ENDPOINT_HUNTER] Could not inject network hook:', e);
  }

  // Forward network & websocket events from main world to background worker
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === '__EH_NETWORK_EVENT__' && event.data.data) {
      try {
        chrome.runtime.sendMessage({
          action: 'networkRequestCaptured',
          data: event.data.data
        });
      } catch (e) {}
    }

    if (event.data.type === '__EH_WS_EVENT__' && event.data.data) {
      try {
        chrome.runtime.sendMessage({
          action: 'wsFrameCaptured',
          data: event.data.data
        });
      } catch (e) {}
    }
  });

  // ================================================================
  // 2️⃣ MESSAGE LISTENER FROM EXTENSION BACKGROUND / POPUP
  // ================================================================
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Toggle sniffer active state
    if (request.action === 'setSnifferState') {
      window.postMessage({
        type: '__EH_TOGGLE_SNIFFER__',
        active: !!request.active
      }, '*');
      sendResponse({ success: true, active: !!request.active });
      return true;
    }

    // SPA Headless DOM Walker (v4.0)
    if (request.action === 'triggerDOMWalk') {
      try {
        const safeSelectors = [
          'button:not([type="submit"]):not([data-danger]):not([data-delete]):not([class*="delete"]):not([class*="remove"])',
          '[role="tab"]',
          '[role="button"]:not([class*="delete"])',
          '.tab',
          '.nav-link',
          '.accordion',
          'summary',
          '[data-toggle]',
          '[aria-expanded="false"]'
        ];

        const elements = Array.from(document.querySelectorAll(safeSelectors.join(',')))
          .filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
          })
          .slice(0, 35);

        let clicked = 0;
        const clickInterval = setInterval(() => {
          if (clicked >= elements.length) {
            clearInterval(clickInterval);
            return;
          }
          const el = elements[clicked];
          try {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          } catch (e) {}
          clicked++;
        }, 220);

        sendResponse({ success: true, scheduledClicks: elements.length });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    if (request.action === 'getPageData') {
      try {
        const data = {
          html: document.documentElement ? document.documentElement.outerHTML : '',
          url: window.location.href,
          title: document.title || '',
          links: Array.from(document.querySelectorAll('a[href]'))
            .map(a => a.href)
            .filter(h => h && !h.startsWith('#') && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('javascript:')),
          scripts: Array.from(document.querySelectorAll('script[src]'))
            .map(s => s.src)
            .filter(Boolean),
          inlineScripts: Array.from(document.querySelectorAll('script:not([src])'))
            .map(s => s.textContent || '')
            .filter(Boolean),
          css: Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(l => l.href)
            .filter(Boolean),
          forms: Array.from(document.querySelectorAll('form'))
            .map(f => ({ action: f.action || '', method: (f.method || 'GET').toUpperCase() })),
          iframes: Array.from(document.querySelectorAll('iframe[src]'))
            .map(i => i.src)
            .filter(Boolean)
        };
        sendResponse(data);
      } catch (e) {
        sendResponse({ error: e.message });
      }
      return true;
    }

    if (request.action === 'getEndpointData') {
      try {
        const endpoints = [];
        const paths = new Set();
        const seen = new Set();

        const addCandidate = (val, type, element) => {
          if (!val || typeof val !== 'string') return;
          const trimmed = val.trim();
          if (trimmed.length < 2 || trimmed.startsWith('#') || trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return;
          if (seen.has(trimmed)) return;
          seen.add(trimmed);

          endpoints.push({ url: trimmed, type, element });
          try {
            const parsed = new URL(trimmed, window.location.origin);
            if (parsed.pathname && parsed.pathname.length > 1) {
              paths.add(parsed.pathname);
            }
          } catch (e) {}
        };

        // 1. Extract from standard anchors
        document.querySelectorAll('a[href]').forEach(el => {
          addCandidate(el.href || el.getAttribute('href'), 'href', 'a');
        });

        // 2. Extract from [src] elements (scripts, images, media, embeds)
        document.querySelectorAll('[src]').forEach(el => {
          addCandidate(el.src || el.getAttribute('src'), 'src', el.tagName.toLowerCase());
        });

        // 3. Extract from form actions and submit button formactions
        document.querySelectorAll('form[action]').forEach(el => {
          addCandidate(el.action || el.getAttribute('action'), 'form-action', 'form');
        });
        document.querySelectorAll('[formaction]').forEach(el => {
          addCandidate(el.getAttribute('formaction'), 'formaction', el.tagName.toLowerCase());
        });

        // 4. Extract from link tags (stylesheets, prefetch, preload, icons)
        document.querySelectorAll('link[href]').forEach(el => {
          addCandidate(el.href || el.getAttribute('href'), 'link-href', 'link');
        });

        // 5. Extract from object and embed data
        document.querySelectorAll('object[data]').forEach(el => {
          addCandidate(el.data || el.getAttribute('data'), 'object-data', 'object');
        });

        // 6. Safe data-* attribute extraction
        document.querySelectorAll('*').forEach(el => {
          if (el.attributes) {
            for (let i = 0; i < el.attributes.length; i++) {
              const attr = el.attributes[i];
              if (attr && attr.name && attr.name.startsWith('data-') && attr.value) {
                const val = attr.value.trim();
                if (val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://')) {
                  addCandidate(val, 'data-attr', el.tagName.toLowerCase());
                }
              }
            }
          }
        });

        sendResponse({ endpoints, paths: Array.from(paths) });
      } catch (e) {
        console.error('[ENDPOINT_HUNTER] Error collecting endpoint data:', e);
        sendResponse({ error: e.message, endpoints: [], paths: [] });
      }
      return true;
    }

    // ================================================================
    // 🗄️ RUNTIME STORAGE & COOKIE SECURITY AUDITOR (v5.0)
    // ================================================================
    if (request.action === 'auditStorage') {
      try {
        const findings = [];
        const sensitiveKeywords = [
          'token', 'auth', 'jwt', 'api_key', 'apikey', 'secret', 'password',
          'session', 'id_token', 'access_token', 'refresh_token', 'user', 'admin',
          'credential', 'private', 'bearer', 'oauth'
        ];

        // 1. Audit localStorage
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key) || '';
            const keyLower = key.toLowerCase();
            const isSensitiveKey = sensitiveKeywords.some(k => keyLower.includes(k));
            const isJWT = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(val.trim());

            if (isSensitiveKey || isJWT || val.length > 20) {
              findings.push({
                storageType: 'localStorage',
                key,
                valueLength: val.length,
                isJWT,
                isSensitive: isSensitiveKey,
                preview: val.length > 60 ? val.substring(0, 30) + '...' + val.substring(val.length - 10) : val,
                rawVal: val
              });
            }
          }
        } catch (e) {}

        // 2. Audit sessionStorage
        try {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const val = sessionStorage.getItem(key) || '';
            const keyLower = key.toLowerCase();
            const isSensitiveKey = sensitiveKeywords.some(k => keyLower.includes(k));
            const isJWT = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(val.trim());

            if (isSensitiveKey || isJWT || val.length > 20) {
              findings.push({
                storageType: 'sessionStorage',
                key,
                valueLength: val.length,
                isJWT,
                isSensitive: isSensitiveKey,
                preview: val.length > 60 ? val.substring(0, 30) + '...' + val.substring(val.length - 10) : val,
                rawVal: val
              });
            }
          }
        } catch (e) {}

        // 3. Audit document.cookie (Check for sensitive cookies accessible to JS without HttpOnly)
        try {
          if (document.cookie) {
            const cookiePairs = document.cookie.split(';');
            cookiePairs.forEach(pair => {
              const parts = pair.trim().split('=');
              const name = parts[0];
              const val = parts.slice(1).join('=');
              const nameLower = name.toLowerCase();
              const isSensitive = sensitiveKeywords.some(k => nameLower.includes(k));
              const isJWT = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(val.trim());

              if (isSensitive || isJWT) {
                findings.push({
                  storageType: 'document.cookie (No HttpOnly!)',
                  key: name,
                  valueLength: val.length,
                  isJWT,
                  isSensitive: true,
                  preview: val.length > 50 ? val.substring(0, 20) + '...' + val.substring(val.length - 8) : val,
                  rawVal: val,
                  warning: 'Cookie lacks HttpOnly flag! Accessible to XSS attacks.'
                });
              }
            });
          }
        } catch (e) {}

        sendResponse({ success: true, count: findings.length, findings });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }
    // ================================================================
    // 💥 DOM XSS SOURCE-TO-SINK TAINT AUDITOR (v6.0)
    // ================================================================
    if (request.action === 'auditDOMXSS') {
      try {
        const findings = [];
        const sources = [
          'location.hash', 'location.search', 'location.href',
          'document.URL', 'document.documentURI', 'document.referrer',
          'window.name'
        ];
        const sinks = [
          'innerHTML', 'outerHTML', 'document.write', 'document.writeln',
          'eval(', 'setTimeout(', 'setInterval(', 'Function(', 'execScript('
        ];

        // 1. Audit Inline Scripts for Source-to-Sink Proximity
        const scripts = Array.from(document.querySelectorAll('script:not([src])'));
        scripts.forEach((s, idx) => {
          const text = s.textContent || '';
          sources.forEach(src => {
            if (text.includes(src)) {
              sinks.forEach(sink => {
                if (text.includes(sink)) {
                  findings.push({
                    type: 'Source-to-Sink Taint',
                    source: src,
                    sink: sink,
                    location: 'Inline Script #' + (idx + 1),
                    snippet: text.substring(0, 100).trim() + '...',
                    severity: 'HIGH'
                  });
                }
              });
            }
          });
        });

        // 2. Check for Immediate URL Param Reflection in Forms / Inputs
        try {
          const urlParams = new URLSearchParams(window.location.search);
          for (const [key, val] of urlParams.entries()) {
            if (val && val.length > 2) {
              const matchedInput = document.querySelector('input[value*="' + CSS.escape(val) + '"]');
              if (matchedInput) {
                findings.push({
                  type: 'Reflected URL Parameter in DOM',
                  param: key,
                  reflectedValue: val,
                  element: matchedInput.tagName.toLowerCase(),
                  severity: 'MEDIUM'
                });
              }
            }
          }
        } catch (e) {}

        sendResponse({ success: true, count: findings.length, findings });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }
    // ================================================================
    // ☣️ PROTOTYPE POLLUTION & CSTI RUNTIME AUDITOR (v7.0)
    // ================================================================
    if (request.action === 'auditPrototypeAndCSTI') {
      try {
        const isPolluted = !!Object.prototype.eh_polluted || !!window.eh_polluted;
        const html = document.documentElement ? document.documentElement.outerHTML : '';
        const frameworks = [];

        if (/ng-app|angular\.js|ng-controller/i.test(html)) {
          frameworks.push({ name: 'AngularJS', cstiPayload: "{{constructor.constructor('return 1337')()}}" });
        }
        if (/vue\.js|v-app|v-model|data-v-/i.test(html)) {
          frameworks.push({ name: 'Vue.js', cstiPayload: '{{_c.constructor("return 1337")()}}' });
        }
        if (/alpinejs|x-data|x-bind/i.test(html)) {
          frameworks.push({ name: 'Alpine.js', cstiPayload: 'x-data="{ count: 1337 }"' });
        }

        sendResponse({
          success: true,
          isPolluted,
          frameworks,
          hasCstiCandidates: frameworks.length > 0
        });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    // ================================================================
    // 🛡️ SUBRESOURCE INTEGRITY (SRI) AUDITOR (v9.0)
    // ================================================================
    if (request.action === 'auditSRI') {
      try {
        const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => ({
          src: s.src,
          hasIntegrity: s.hasAttribute('integrity'),
          integrity: s.getAttribute('integrity') || '',
          crossorigin: s.getAttribute('crossorigin') || 'none',
          isExternal: !s.src.startsWith(window.location.origin)
        }));

        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')).map(l => ({
          href: l.href,
          hasIntegrity: l.hasAttribute('integrity'),
          integrity: l.getAttribute('integrity') || '',
          crossorigin: l.getAttribute('crossorigin') || 'none',
          isExternal: !l.href.startsWith(window.location.origin)
        }));

        const missingSri = scripts.concat(styles).filter(item => item.isExternal && !item.hasIntegrity);

        sendResponse({
          success: true,
          totalScripts: scripts.length,
          totalStyles: styles.length,
          externalCount: scripts.concat(styles).filter(i => i.isExternal).length,
          missingSriCount: missingSri.length,
          missingSri,
          scripts,
          styles
        });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    // ================================================================
    // 📥 HIDDEN FORM FIELD & ANTI-CSRF HARVESTER (v9.0)
    // ================================================================
    if (request.action === 'harvestHiddenFields') {
      try {
        const forms = Array.from(document.querySelectorAll('form')).map((f, idx) => {
          const action = f.getAttribute('action') || window.location.href;
          const method = (f.getAttribute('method') || 'GET').toUpperCase();
          const hiddenInputs = Array.from(f.querySelectorAll('input[type="hidden"]')).map(inp => ({
            name: inp.name || inp.id || 'unnamed',
            value: inp.value || '',
            id: inp.id || ''
          }));

          const hasCsrfToken = hiddenInputs.some(inp => 
            /csrf|token|xsrf|authenticity|_token|nonce/i.test(inp.name)
          );

          const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

          return {
            formIndex: idx + 1,
            action,
            method,
            isStateChanging,
            hasCsrfToken,
            csrfWarning: isStateChanging && !hasCsrfToken,
            hiddenCount: hiddenInputs.length,
            hiddenInputs
          };
        });

        // Standalone hidden inputs outside form tags
        const standaloneHidden = Array.from(document.querySelectorAll('body > input[type="hidden"], div > input[type="hidden"]'))
          .filter(inp => !inp.closest('form'))
          .map(inp => ({
            name: inp.name || inp.id || 'unnamed',
            value: inp.value || '',
            id: inp.id || ''
          }));

        sendResponse({
          success: true,
          totalForms: forms.length,
          formsWithIssues: forms.filter(f => f.csrfWarning).length,
          standaloneCount: standaloneHidden.length,
          forms,
          standaloneHidden
        });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    // ================================================================
    // 📱 DEEP LINK & CUSTOM MOBILE SCHEME HARVESTER (v9.0)
    // ================================================================
    // ================================================================
    // 🧠 MEMORY DUMP & STATE OBJECT INSPECTOR (v10.0)
    // ================================================================
    if (request.action === 'inspectMemoryScope') {
      try {
        const stateObjects = [];
        const scripts = Array.from(document.querySelectorAll('script:not([src])'));
        
        // Scan inline state scripts (Next.js, Nuxt, Redux)
        scripts.forEach((s, idx) => {
          const text = s.innerText || '';
          if (text.includes('__NEXT_DATA__') || text.includes('__INITIAL_STATE__') || text.includes('__PRELOADED_STATE__') || text.includes('__NUXT__')) {
            const matches = text.match(/(?:token|auth|key|secret|password|email|userId|role|admin)\s*[:=]\s*["'][^"']+["']/gi) || [];
            stateObjects.push({
              scriptIndex: idx + 1,
              source: text.includes('__NEXT_DATA__') ? 'Next.js __NEXT_DATA__' : text.includes('__NUXT__') ? 'Nuxt __NUXT__' : 'SSR State Hydration',
              snippet: text.slice(0, 160).replace(/\s+/g, ' '),
              leakedTokens: matches.slice(0, 6)
            });
          }
        });

        sendResponse({
          success: true,
          foundStateObjects: stateObjects.length,
          stateObjects
        });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    if (request.action === 'harvestDeepLinksDOM') {
      try {
        const customSchemes = /^(slack|intent|tg|twitter|fb|market|whatsapp|mailto|tel|sms|zoommtg|spotify|discord|steam):/i;
        const deepLinks = [];

        Array.from(document.querySelectorAll('a[href]')).forEach(a => {
          const href = a.getAttribute('href') || '';
          if (customSchemes.test(href) || (/^[a-z0-9+.-]+:\/\//i.test(href) && !/^https?:\/\//i.test(href))) {
            deepLinks.push({
              scheme: href.split(':')[0],
              raw: href,
              text: a.innerText.trim().slice(0, 40),
              element: 'a[href]'
            });
          }
        });

        sendResponse({
          success: true,
          totalDeepLinks: deepLinks.length,
          deepLinks
        });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

  });

  
  // ================================================================
  // 🛡️ BACKGROUND SENTINEL PASSIVE EXTRACTOR (ZERO USER INTERRUPTION)
  // ================================================================
  const SENSITIVE_EXCLUSIONS = [
    'accounts.google.com',
    'login.live.com',
    'login.microsoftonline.com',
    'paypal.com',
    'chase.com',
    'bankofamerica.com',
    'wellsfargo.com',
    'americanexpress.com',
    'myaccount.google.com',
    'appleid.apple.com'
  ];

  function runPassiveSentinelExtraction() {
    if (SENSITIVE_EXCLUSIONS.some(ex => window.location.hostname.includes(ex))) {
      return;
    }

    const runner = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    runner(() => {
      try {
        const foundEndpoints = [];
        const foundSecrets = [];
        const seenUrls = new Set();

        const addEndpoint = (url, method, type, src) => {
          if (!url || typeof url !== 'string') return;
          const clean = url.trim().replace(/^['"`]+|['"`]+$/g, '');
          if (clean.length < 3 || clean.startsWith('data:') || clean.startsWith('javascript:')) return;
          if (seenUrls.has(clean)) return;
          seenUrls.add(clean);
          foundEndpoints.push({ url: clean, method: method || 'GET', type: type || 'api', source: src || 'sentinel-passive' });
        };

        // 1. Script sources
        document.querySelectorAll('script[src]').forEach(s => {
          if (s.src) addEndpoint(s.src, 'GET', 'script', 'script-src');
        });

        // 2. Links, forms, and API attributes
        document.querySelectorAll('a[href], form[action], [data-url], [data-api], [data-endpoint]').forEach(el => {
          const href = el.getAttribute('href') || el.getAttribute('action') || el.getAttribute('data-url') || el.getAttribute('data-api') || el.getAttribute('data-endpoint');
          if (href && (href.startsWith('/') || href.includes('/api/') || href.includes('.json'))) {
            addEndpoint(href, el.method || 'GET', 'api', 'dom-attr');
          }
        });

        // 3. Hydration state
        const nextData = document.getElementById('__NEXT_DATA__');
        if (nextData && nextData.textContent) {
          try {
            const parsed = JSON.parse(nextData.textContent);
            const str = JSON.stringify(parsed);
            const routeMatches = str.match(/["'](\/[a-zA-Z0-9_\-./]+)["']/g) || [];
            routeMatches.slice(0, 30).forEach(m => {
              const r = m.replace(/["']/g, '');
              if (r.length > 2 && (r.startsWith('/api') || r.startsWith('/v1') || r.startsWith('/v2') || r.startsWith('/v3'))) {
                addEndpoint(r, 'GET', 'api', 'next-data');
              }
            });
          } catch(e) {}
        }

        // 4. Scan inline scripts for endpoints and secrets
        document.querySelectorAll('script:not([src])').forEach(s => {
          const code = s.textContent || '';
          if (code.length > 20 && code.length < 500000) {
            const epMatches = code.match(/['"`]\/(?:api|v[0-9]|rest|graphql|oauth|auth|user|admin)[^'"\s\<\>]+['"`]/gi) || [];
            epMatches.slice(0, 25).forEach(m => {
              addEndpoint(m.replace(/['"`]/g, ''), 'GET', 'api', 'inline-script');
            });

            const googleKey = code.match(/AIzaSy[A-Za-z0-9_-]{33}/);
            if (googleKey) foundSecrets.push({ name: 'Google API Key', value: googleKey[0], severity: 'high', type: 'google' });

            const stripeKey = code.match(/sk_live_[0-9a-zA-Z]{24,}/);
            if (stripeKey) foundSecrets.push({ name: 'Stripe Secret Key', value: stripeKey[0], severity: 'critical', type: 'stripe' });

            const awsKey = code.match(/AKIA[0-9A-Z]{16}/);
            if (awsKey) foundSecrets.push({ name: 'AWS Access Key ID', value: awsKey[0], severity: 'high', type: 'aws' });
          }
        });

        if (foundEndpoints.length > 0 || foundSecrets.length > 0) {
          chrome.runtime.sendMessage({
            action: 'passiveSentinelFindings',
            data: {
              url: window.location.href,
              endpoints: foundEndpoints,
              secrets: foundSecrets
            }
          }).catch(() => {});
        }
      } catch (e) {}
    });
  }

  // Check Sentinel state on page load
  try {
    chrome.runtime.sendMessage({ action: 'getSentinelConfig' }, (res) => {
      if (res && res.config && res.config.enabled) {
        window.postMessage({ type: '__EH_TOGGLE_SNIFFER__', active: true }, '*');
        runPassiveSentinelExtraction();
      }
    });
  } catch (e) {}

  console.log('[ENDPOINT_HUNTER] ✅ Content script v10.0 ready');
})();