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
  });

  console.log('[ENDPOINT_HUNTER] ✅ Content script v5.0 ready');
})();