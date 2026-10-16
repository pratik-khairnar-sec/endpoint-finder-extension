// ================================================================
// 🛡️ MODULE: SILENT BACKGROUND SENTINEL (ZERO USER INTERRUPTION)
// ================================================================
// Runs quietly in the background without stealing focus or lagging.
// Updates discreet Chrome Action icon badges and filters sensitive domains.
// ================================================================

import { SENSITIVE_EXCLUSIONS } from './auth.js';

export class SentinelEngine {
  constructor() {
    this.config = {
      enabled: false,
      badgeCounter: true,
      notifySecrets: false
    };
    this.tabEndpoints = new Map();
    this.tabSecrets = new Map();
  }

  setConfig(cfg) {
    this.config = { ...this.config, ...cfg };
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ sentinelConfig: this.config });
    }
  }

  isDomainExcluded(url) {
    if (!url) return false;
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return SENSITIVE_EXCLUSIONS.some(ex => hostname.includes(ex));
    } catch (e) {
      return false;
    }
  }

  handleFindings(data, tab) {
    if (!this.config.enabled) return;
    if (!tab || !tab.id) return;
    if (this.isDomainExcluded(data.url || tab.url)) return;

    const tabId = tab.id;
    const currentEps = this.tabEndpoints.get(tabId) || 0;
    const newEps = currentEps + (data.endpoints?.length || 0);
    this.tabEndpoints.set(tabId, newEps);

    const currentSecs = this.tabSecrets.get(tabId) || 0;
    const newSecs = currentSecs + (data.secrets?.length || 0);
    this.tabSecrets.set(tabId, newSecs);

    this.updateTabBadge(tabId);
  }

  updateTabBadge(tabId) {
    if (!chrome.action) return;

    const secrets = this.tabSecrets.get(tabId) || 0;
    const eps = this.tabEndpoints.get(tabId) || 0;

    if (secrets > 0) {
      chrome.action.setBadgeText({ text: `!${secrets}`, tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#f43f5e', tabId }); // Red alert badge
    } else if (eps > 0 && this.config.badgeCounter) {
      const text = eps > 99 ? '99+' : String(eps);
      chrome.action.setBadgeText({ text, tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#06b6d4', tabId }); // Cyan badge
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }

  clearTab(tabId) {
    this.tabEndpoints.delete(tabId);
    this.tabSecrets.delete(tabId);
    if (chrome.action) {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
}
