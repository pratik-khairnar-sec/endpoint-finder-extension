// ================================================================
// 🔗 ENDPOINT HUNTER - INJECTED RUNTIME NETWORK & WEBSOCKET SNIFFER (v4.0)
// ================================================================
// Author: Pratik Khairnar (https://github.com/pratik-khairnar-sec)
// Injected into the page MAIN WORLD to passively intercept dynamic
// runtime API invocations (fetch, axios, XHR, WebSocket, SSE)
// ================================================================

(function() {
  'use strict';

  // Guard against duplicate injections
  if (window.__EH_SNIFFER_INITIALIZED__) return;
  window.__EH_SNIFFER_INITIALIZED__ = true;

  // Sniffer is INACTIVE by default (manual start only!)
  window.__EH_SNIFFER_ACTIVE__ = false;

  // Listen for toggle messages from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === '__EH_TOGGLE_SNIFFER__') {
      window.__EH_SNIFFER_ACTIVE__ = !!event.data.active;
      console.log(`[ENDPOINT_HUNTER] ⚡ Runtime Sniffer is now ${window.__EH_SNIFFER_ACTIVE__ ? 'ACTIVE' : 'INACTIVE'}`);
    }
  });

  const notifyCapture = (data) => {
    if (!window.__EH_SNIFFER_ACTIVE__) return;
    try {
      window.postMessage({
        type: '__EH_NETWORK_EVENT__',
        data: {
          url: data.url,
          method: (data.method || 'GET').toUpperCase(),
          status: data.status || 0,
          statusText: data.statusText || '',
          sourceType: data.sourceType || 'fetch',
          duration: data.duration || 0,
          timestamp: Date.now()
        }
      }, '*');
    } catch (e) {}
  };

  const notifyWsCapture = (wsData) => {
    if (!window.__EH_SNIFFER_ACTIVE__) return;
    try {
      window.postMessage({
        type: '__EH_WS_EVENT__',
        data: {
          url: wsData.url,
          direction: wsData.direction, // 'sent' | 'received' | 'sse'
          payload: wsData.payload,
          timestamp: Date.now()
        }
      }, '*');
    } catch (e) {}
  };

  // ================================================================
  // 1️⃣ HOOK WINDOW.FETCH
  // ================================================================
  const originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    window.fetch = async function(...args) {
      const startTime = performance.now();
      let url = '';
      let method = 'GET';

      try {
        if (typeof args[0] === 'string') {
          url = args[0];
        } else if (args[0] instanceof URL) {
          url = args[0].href;
        } else if (args[0] && typeof args[0] === 'object' && args[0].url) {
          url = args[0].url;
          method = args[0].method || method;
        }

        if (args[1] && typeof args[1] === 'object') {
          method = args[1].method || method;
        }
      } catch (e) {}

      try {
        const response = await originalFetch.apply(this, args);
        const duration = Math.round(performance.now() - startTime);

        if (url) {
          notifyCapture({
            url: url,
            method: method,
            status: response.status,
            statusText: response.statusText,
            sourceType: 'fetch',
            duration: duration
          });
        }
        return response;
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        if (url) {
          notifyCapture({
            url: url,
            method: method,
            status: 0,
            statusText: 'Failed/Blocked',
            sourceType: 'fetch',
            duration: duration
          });
        }
        throw err;
      }
    };
  }

  // ================================================================
  // 2️⃣ HOOK XMLHTTPREQUEST (XHR, AXIOS, JQUERY)
  // ================================================================
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this.__eh_req = {
      method: method || 'GET',
      url: typeof url === 'string' ? url : (url ? url.toString() : ''),
      startTime: 0
    };
    return originalXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (this.__eh_req) {
      this.__eh_req.startTime = performance.now();

      this.addEventListener('loadend', () => {
        try {
          const duration = Math.round(performance.now() - (this.__eh_req.startTime || performance.now()));
          notifyCapture({
            url: this.__eh_req.url,
            method: this.__eh_req.method,
            status: this.status,
            statusText: this.statusText,
            sourceType: 'xhr',
            duration: duration
          });
        } catch (e) {}
      });
    }
    return originalXhrSend.apply(this, arguments);
  };

  // ================================================================
  // 3️⃣ HOOK WINDOW.WEBSOCKET (REAL-TIME WS FRAMES)
  // ================================================================
  if (typeof window.WebSocket === 'function') {
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      const ws = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);
      const wsUrl = typeof url === 'string' ? url : (url ? url.toString() : '');

      const formatPayload = (data) => {
        try {
          if (typeof data === 'string') {
            return data.length > 2000 ? data.substring(0, 2000) + '... [truncated]' : data;
          }
          if (data instanceof ArrayBuffer) return `[ArrayBuffer: ${data.byteLength} bytes]`;
          if (data instanceof Blob) return `[Blob: ${data.size} bytes]`;
          return typeof data === 'object' ? JSON.stringify(data).substring(0, 2000) : String(data);
        } catch (e) {
          return '[Binary Frame]';
        }
      };

      // Intercept outgoing client frame
      const originalSend = ws.send;
      ws.send = function(data) {
        notifyWsCapture({
          url: wsUrl,
          direction: 'sent',
          payload: formatPayload(data)
        });
        return originalSend.apply(this, arguments);
      };

      // Intercept incoming server frame
      ws.addEventListener('message', function(event) {
        notifyWsCapture({
          url: wsUrl,
          direction: 'received',
          payload: formatPayload(event.data)
        });
      });

      return ws;
    };
    window.WebSocket.prototype = OriginalWebSocket.prototype;
  }

  // ================================================================
  // 4️⃣ HOOK WINDOW.EVENTSOURCE (SERVER-SENT EVENTS - SSE)
  // ================================================================
  if (typeof window.EventSource === 'function') {
    const OriginalEventSource = window.EventSource;
    window.EventSource = function(url, config) {
      const es = new OriginalEventSource(url, config);
      const sseUrl = typeof url === 'string' ? url : (url ? url.toString() : '');

      es.addEventListener('message', function(event) {
        notifyWsCapture({
          url: sseUrl,
          direction: 'sse',
          payload: typeof event.data === 'string' ? event.data.substring(0, 2000) : String(event.data)
        });
      });
      return es;
    };
    window.EventSource.prototype = OriginalEventSource.prototype;
  }

  console.log('[ENDPOINT_HUNTER] ⚡ Main world runtime sniffer hooks ready (Fetch, XHR, WebSocket, SSE - Waiting for user activation)');
})();
