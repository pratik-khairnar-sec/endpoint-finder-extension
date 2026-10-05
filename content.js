// ================================================================
// 🔗 ENDPOINT HUNTER - CONTENT SCRIPT (ENHANCED & BUG-FREE)
// ================================================================
// Author: Pratik Khairnar (https://github.com/pratik-khairnar-sec)
// ================================================================

(function() {
  'use strict';

  console.log('[ENDPOINT_HUNTER] 🔗 Content script loaded');

  // Listen for messages from background service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

        // 6. Safe data-* attribute extraction (Fixes invalid [data-*] selector crash)
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
  });

  console.log('[ENDPOINT_HUNTER] ✅ Content script ready');
})();