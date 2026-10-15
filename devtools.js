// ================================================================
// 🔗 ENDPOINT HUNTER - CHROME DEVTOOLS PANEL REGISTRATION (v3.0)
// ================================================================
// Author: Pratik Khairnar (https://github.com/pratik-khairnar-sec)
// Registers dedicated 'Endpoint Hunter' tab in Developer Tools (F12)
// ================================================================

(function() {
  'use strict';

  if (!chrome.devtools || !chrome.devtools.panels) return;

  chrome.devtools.panels.create(
    'Endpoint Hunter',
    'icon16.png',
    'sidepanel.html',
    function(panel) {
      // Panel initialized
      panel.onShown.addListener(function(panelWindow) {
        // DevTools panel visible
      });
    }
  );
})();
