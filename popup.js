// ================================================================
// 🔗 ENDPOINT HUNTER v3.0 - POPUP & SIDEPANEL CONTROLLER
// ================================================================
// Author: Pratik Khairnar (https://github.com/pratik-khairnar-sec)
// Enterprise Reconnaissance Controller:
// - Live Discovery & Status Prober
// - TruffleHog-style Client Secrets Harvester
// - Runtime Fetch/XHR Interceptor & Sniffer
// - In-Browser Mini-Repeater (Postman/Burp style)
// - GraphQL Schema Introspection & Template Generator
// - Source-Map (.map) Unpacker & Route Extractor
// - Micro-Fuzzer & Sensitive Dictionary Scanner
// - Global Auth & Custom Header Manager
// - Postman v2.1, OpenAPI 3.0, JSON, TXT & PDF Exporters
// ================================================================

class PopupController {
  constructor() {
    this.endpoints = [];
    this.secrets = [];
    this.sniffedRequests = [];
    this.paths = [];
    this.logs = [];
    this.fuzzerHits = [];
    this.wsFrames = [];

    this.isScanning = false;
    this.isSniffing = false;
    this.isProbing = false;
    this.isFuzzing = false;
    this.statusInterval = null;

    // Filter states
    this.searchQuery = '';
    this.categoryFilter = '';
    this.statusFilter = '';

    // Active response cache for copy
    this.currentResponseText = '';

    this.setup();
    this.detectAndApplyViewMode();
    this.load();
    this.loadSettings();
    this.loadSentinelSettings();
    this.loadGlobalAuth();
    this.startRealtimeUpdates();
    this.loadLogs();
  }


  // ================================================================
  // 🪟 VIEWPORT / FULL TAB / WINDOW SWITCHER (v10.0)
  // ================================================================

  detectAndApplyViewMode() {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const isSidepanelFile = window.location.pathname.endsWith('sidepanel.html');
      const savedLayout = localStorage.getItem('eh_tabs_layout');

      if (isSidepanelFile) {
        if (view === 'tab') {
          if (this.viewModeBadge) this.viewModeBadge.textContent = 'Full Tab Dashboard • v10.0.0';
          if (this.openFullTabBtn) this.openFullTabBtn.style.display = 'none';
          if (this.openPopoutBtn) this.openPopoutBtn.style.display = 'inline-flex';
          if (this.dockToSidePanelBtn) this.dockToSidePanelBtn.style.display = 'inline-flex';
          document.body.classList.add('view-mode-tab');
          // Full Tab defaults to Vertical Tabs layout for elite experience
          const useVertical = savedLayout ? (savedLayout === 'vertical') : true;
          this.setTabsLayout(useVertical);
        } else if (view === 'window') {
          if (this.viewModeBadge) this.viewModeBadge.textContent = 'Detached Window (Maximize / Minimize) • v10.0.0';
          if (this.openPopoutBtn) this.openPopoutBtn.style.display = 'none';
          if (this.openFullTabBtn) this.openFullTabBtn.style.display = 'inline-flex';
          if (this.dockToSidePanelBtn) this.dockToSidePanelBtn.style.display = 'inline-flex';
          document.body.classList.add('view-mode-window');
          // Detached Window defaults to Vertical Tabs layout
          const useVertical = savedLayout ? (savedLayout === 'vertical') : true;
          this.setTabsLayout(useVertical);
        } else {
          if (this.viewModeBadge) this.viewModeBadge.textContent = 'Persistent Side Panel • v10.0.0';
          if (this.openFullTabBtn) this.openFullTabBtn.style.display = 'inline-flex';
          if (this.openPopoutBtn) this.openPopoutBtn.style.display = 'inline-flex';
          if (this.dockToSidePanelBtn) this.dockToSidePanelBtn.style.display = 'none';
          document.body.classList.add('view-mode-sidepanel');
          const useVertical = savedLayout === 'vertical';
          this.setTabsLayout(useVertical);
        }
      } else {
        const useVertical = savedLayout === 'vertical';
        this.setTabsLayout(useVertical);
      }
    } catch (e) {}
  }

  setTabsLayout(isVertical) {
    if (isVertical) {
      document.body.classList.add('layout-vertical');
    } else {
      document.body.classList.remove('layout-vertical');
    }
    const label = document.getElementById('tabsLayoutLabel');
    if (label) label.textContent = isVertical ? '▭ HORIZONTAL' : '📑 VERTICAL TABS';
    const icon = document.getElementById('tabsLayoutIcon');
    if (icon) icon.textContent = isVertical ? '▭' : '📑';
  }

  toggleTabsLayout() {
    const isNowVertical = !document.body.classList.contains('layout-vertical');
    this.setTabsLayout(isNowVertical);
    localStorage.setItem('eh_tabs_layout', isNowVertical ? 'vertical' : 'horizontal');
    this.log(isNowVertical ? '📑 Activated Vertical Sidebar Tabs' : '▭ Switched to Horizontal Top Tabs', 'info');
  }

  async openFullTab() {
    try {
      const url = chrome.runtime.getURL('sidepanel.html?view=tab');
      await chrome.tabs.create({ url, active: true });
      if (window.location.pathname.endsWith('popup.html')) {
        window.close();
      }
    } catch (e) {
      this.log('❌ Error opening full tab: ' + e.message, 'error');
    }
  }

  async openPopoutWindow() {
    try {
      const url = chrome.runtime.getURL('sidepanel.html?view=window');
      const width = Math.min(1440, (window.screen?.availWidth || 1440) - 80);
      const height = Math.min(920, (window.screen?.availHeight || 900) - 80);
      const left = Math.max(20, Math.round(((window.screen?.availWidth || 1440) - width) / 2));
      const top = Math.max(20, Math.round(((window.screen?.availHeight || 900) - height) / 2));

      await chrome.windows.create({
        url,
        type: 'popup',
        width,
        height,
        left,
        top,
        focused: true
      });
      if (window.location.pathname.endsWith('popup.html')) {
        window.close();
      }
    } catch (e) {
      this.log('❌ Error opening popout window: ' + e.message, 'error');
    }
  }

  async dockToSidePanel() {
    try {
      const targetTab = await this.getTargetWebTab();
      if (targetTab && chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ windowId: targetTab.windowId });
        this.log('🪟 Docked into Chrome Side Panel', 'success');
      } else {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && chrome.sidePanel && chrome.sidePanel.open) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
          this.log('🪟 Docked into Chrome Side Panel', 'success');
        }
      }
    } catch (e) {
      this.log('⚠️ Side Panel dock notice: ' + e.message, 'warning');
    }
  }

  async getTargetWebTab() {
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentTab && currentTab.url && (currentTab.url.startsWith('http://') || currentTab.url.startsWith('https://'))) {
        return currentTab;
      }
      const windowTabs = await chrome.tabs.query({ currentWindow: true });
      const candidateWin = windowTabs.find(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
      if (candidateWin) return candidateWin;

      const allTabs = await chrome.tabs.query({});
      const candidateAll = allTabs.find(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
      return candidateAll || currentTab;
    } catch (e) {
      return null;
    }
  }

  // ================================================================
  // 🔧 SETUP CONTROLS & LISTENERS
  // ================================================================

  setup() {
    // Primary Controls
    this.scanBtn = document.getElementById('scanBtn');
    this.scanCurrentBtn = document.getElementById('scanCurrentBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.resumeBtn = document.getElementById('resumeBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.openSidePanelBtn = document.getElementById('openSidePanelBtn');
    this.openFullTabBtn = document.getElementById('openFullTabBtn');
    this.openPopoutBtn = document.getElementById('openPopoutBtn');
    this.dockToSidePanelBtn = document.getElementById('dockToSidePanelBtn');
    this.viewModeBadge = document.getElementById('viewModeBadge');
    this.sentinelToggle = document.getElementById('sentinelToggle');
    this.sentinelStateLabel = document.getElementById('sentinelStateLabel');

    // Export Controls
    this.exportBtn = document.getElementById('exportBtn');
    this.pdfBtn = document.getElementById('pdfBtn');
    this.postmanBtn = document.getElementById('postmanBtn');
    this.openapiBtn = document.getElementById('openapiBtn');
    this.txtBtn = document.getElementById('txtBtn');
    this.exportSecretsBtn = document.getElementById('exportSecretsBtn');
    this.exportAllZipBtn = document.getElementById('exportAllZipBtn');

    // Sniffer & Prober Controls
    this.probeStatusBtn = document.getElementById('probeStatusBtn');
    this.toggleSnifferBtn = document.getElementById('toggleSnifferBtn');
    this.clearSnifferBtn = document.getElementById('clearSnifferBtn');

    // v4.0 Advanced Reconnaissance Controls
    this.harBtn = document.getElementById('harBtn');
    this.domWalkBtn = document.getElementById('domWalkBtn');
    this.mineParamsBtn = document.getElementById('mineParamsBtn');
    this.paramMinerBox = document.getElementById('paramMinerBox');
    this.paramMinerStatus = document.getElementById('paramMinerStatus');
    this.paramMinerList = document.getElementById('paramMinerList');
    this.clearWsBtn = document.getElementById('clearWsBtn');
    this.wsList = document.getElementById('wsList');
    this.wsCount = document.getElementById('wsBadge') || document.getElementById('wsCount');

    // Filter inputs
    this.endpointSearch = document.getElementById('endpointSearch');
    this.categoryFilterSelect = document.getElementById('categoryFilter');
    this.statusFilterSelect = document.getElementById('statusFilter');

    // Repeater elements (v3.0)
    this.repeaterMethod = document.getElementById('repeaterMethod');
    this.repeaterUrl = document.getElementById('repeaterUrl');
    this.repeaterHeaders = document.getElementById('repeaterHeaders');
    this.repeaterBody = document.getElementById('repeaterBody');
    this.repeaterSendBtn = document.getElementById('repeaterSendBtn');
    this.copyRepeaterRespBtn = document.getElementById('copyRepeaterRespBtn');
    this.repeaterStatusBadge = document.getElementById('repeaterStatusBadge');
    this.repeaterLatencyBadge = document.getElementById('repeaterLatencyBadge');
    this.repeaterSizeBadge = document.getElementById('repeaterSizeBadge');
    this.repeaterResponseBox = document.getElementById('repeaterResponseBox');

    // GraphQL elements (v3.0)
    this.graphqlEndpointInput = document.getElementById('graphqlEndpointInput');
    this.graphqlIntrospectBtn = document.getElementById('graphqlIntrospectBtn');
    this.graphqlResults = document.getElementById('graphqlResults');

    // Source Maps elements (v3.0)
    this.sourcemapInput = document.getElementById('sourcemapInput');
    this.unpackMapBtn = document.getElementById('unpackMapBtn');
    this.sourcemapResults = document.getElementById('sourcemapResults');

    // Fuzzer elements (v3.0)
    this.fuzzerBaseUrl = document.getElementById('fuzzerBaseUrl');
    this.fuzzerCategory = document.getElementById('fuzzerCategory');
    this.startFuzzerBtn = document.getElementById('startFuzzerBtn');
    this.bashBtn = document.getElementById('bashBtn');
    this.auditStorageBtn = document.getElementById('auditStorageBtn');
    this.analyzeHeadersBtn = document.getElementById('analyzeHeadersBtn');
    this.runCorsAuditBtn = document.getElementById('runCorsAuditBtn');
    this.inspectJwtBtn = document.getElementById('inspectJwtBtn');
    this.importSwaggerUrlBtn = document.getElementById('importSwaggerUrlBtn');
    this.importSwaggerJsonBtn = document.getElementById('importSwaggerJsonBtn');
    this.probeAllBucketsBtn = document.getElementById('probeAllBucketsBtn');
    this.verbTamperBtn = document.getElementById('verbTamperBtn');
    this.idorSeqBtn = document.getElementById('idorSeqBtn');
    this.htmlReportBtn = document.getElementById('htmlReportBtn');
    this.testGqlBatchBtn = document.getElementById('testGqlBatchBtn');
    this.probeGqlFieldsBtn = document.getElementById('probeGqlFieldsBtn');
    this.checkTakeoverBtn = document.getElementById('checkTakeoverBtn');
    this.detectWafBtn = document.getElementById('detectWafBtn');
    this.auditDomXssBtn = document.getElementById('auditDomXssBtn');
    this.probeCachePoisonBtn = document.getElementById('probeCachePoisonBtn');
    this.probeOpenRedirectBtn = document.getElementById('probeOpenRedirectBtn');
    this.auditOAuthBtn = document.getElementById('auditOAuthBtn');
    this.testRateLimitBtn = document.getElementById('testRateLimitBtn');
    this.refreshDorksBtn = document.getElementById('refreshDorksBtn');
    this.wordlistBtn = document.getElementById('wordlistBtn');
    this.nucleiBtn = document.getElementById('nucleiBtn');
    this.probeConcurrentBtn = document.getElementById('probeConcurrentBtn');
    this.probeSstiBtn = document.getElementById('probeSstiBtn');
    this.probeSqliBtn = document.getElementById('probeSqliBtn');
    this.probeXxeBtn = document.getElementById('probeXxeBtn');
    this.saveSnapshotBtn = document.getElementById('saveSnapshotBtn');
    this.computeDiffBtn = document.getElementById('computeDiffBtn');
    this.refreshSsrfBtn = document.getElementById('refreshSsrfBtn');
    this.burpXmlBtn = document.getElementById('burpXmlBtn');
    this.execSummaryBtn = document.getElementById('execSummaryBtn');
    this.runRegexBtn = document.getElementById('runRegexBtn');
    this.calcEntropyBtn = document.getElementById('calcEntropyBtn');
    this.auditCookiesBtn = document.getElementById('auditCookiesBtn');
    this.parseRobotsBtn = document.getElementById('parseRobotsBtn');
    this.evalCspBtn = document.getElementById('evalCspBtn');
    this.postmanEnvBtn = document.getElementById('postmanEnvBtn');
    this.generateVectorsBtn = document.getElementById('generateVectorsBtn');
    this.auditSriBtn = document.getElementById('auditSriBtn');
    this.probeCrlfBtn = document.getElementById('probeCrlfBtn');
    this.harvestFormsBtn = document.getElementById('harvestFormsBtn');
    this.auditCryptoBtn = document.getElementById('auditCryptoBtn');
    this.deepLinksBtn = document.getElementById('deepLinksBtn');
    this.probeEnvBtn = document.getElementById('probeEnvBtn');
    this.selectAdminRoleBtn = document.getElementById('selectAdminRoleBtn');
    this.selectUserBRoleBtn = document.getElementById('selectUserBRoleBtn');
    this.selectGuestRoleBtn = document.getElementById('selectGuestRoleBtn');
    this.saveProfileBtn = document.getElementById('saveProfileBtn');
    this.applyProfileToRepeaterBtn = document.getElementById('applyProfileToRepeaterBtn');
    this.complianceBtn = document.getElementById('complianceBtn');
    this.cliPipelineBtn = document.getElementById('cliPipelineBtn');
    this.refreshScorecardBtn = document.getElementById('refreshScorecardBtn');
    this.refreshMitreBtn = document.getElementById('refreshMitreBtn');
    this.drawTopologyBtn = document.getElementById('drawTopologyBtn');
    this.runOrchestratorBtn = document.getElementById('runOrchestratorBtn');
    this.stopFuzzerBtn = document.getElementById('stopFuzzerBtn');
    this.fuzzerPill = document.getElementById('fuzzerPill');
    this.fuzzerCountLabel = document.getElementById('fuzzerCountLabel');
    this.fuzzerList = document.getElementById('fuzzerList');

    // Global Auth settings (v3.0)
    this.authHeaderInput = document.getElementById('authHeaderInput');
    this.cookieHeaderInput = document.getElementById('cookieHeaderInput');
    this.customHdrName1 = document.getElementById('customHdrName1');
    this.customHdrVal1 = document.getElementById('customHdrVal1');
    this.saveGlobalAuthBtn = document.getElementById('saveGlobalAuthBtn');

    // Standard Settings elements
    this.telegramTokenInput = document.getElementById('telegramTokenInput');
    this.telegramChatIdInput = document.getElementById('telegramChatIdInput');
    this.telegramEnabledInput = document.getElementById('telegramEnabledInput');
    this.saveTelegramBtn = document.getElementById('saveTelegramBtn');
    this.testTelegramBtn = document.getElementById('testTelegramBtn');

    this.discordWebhookInput = document.getElementById('discordWebhookInput');
    this.discordEnabledInput = document.getElementById('discordEnabledInput');
    this.slackWebhookInput = document.getElementById('slackWebhookInput');
    this.slackEnabledInput = document.getElementById('slackEnabledInput');
    this.saveWebhooksBtn = document.getElementById('saveWebhooksBtn');

    this.maxPagesInput = document.getElementById('maxPagesInput');
    this.maxDepthInput = document.getElementById('maxDepthInput');
    this.stealthModeInput = document.getElementById('stealthModeInput');
    this.followExternalInput = document.getElementById('followExternalInput');
    this.saveCrawlBtn = document.getElementById('saveCrawlBtn');

    // Bind Primary Buttons
    if (this.scanBtn) this.scanBtn.addEventListener('click', () => this.scanAll());
    if (this.scanCurrentBtn) this.scanCurrentBtn.addEventListener('click', () => this.scanCurrent());
    if (this.stopBtn) this.stopBtn.addEventListener('click', () => this.stopScan());
    if (this.resumeBtn) this.resumeBtn.addEventListener('click', () => this.resumeScan());
    if (this.clearBtn) this.clearBtn.addEventListener('click', () => this.clear());
    if (this.openSidePanelBtn) this.openSidePanelBtn.addEventListener('click', () => this.openSidePanel());
    if (this.openFullTabBtn) this.openFullTabBtn.addEventListener('click', () => this.openFullTab());
    if (this.openPopoutBtn) this.openPopoutBtn.addEventListener('click', () => this.openPopoutWindow());
    if (this.dockToSidePanelBtn) this.dockToSidePanelBtn.addEventListener('click', () => this.dockToSidePanel());
    if (this.sentinelToggle) this.sentinelToggle.addEventListener('change', () => this.toggleSentinel());

    // 📑 Vertical Tabs Layout & Sidebar Navigation (v10.0)
    const toggleLayoutBtn = document.getElementById('toggleTabsLayoutBtn');
    if (toggleLayoutBtn) toggleLayoutBtn.addEventListener('click', () => this.toggleTabsLayout());

    const vtabSearchInput = document.getElementById('vtabSearchInput');
    const vtabClearSearch = document.getElementById('vtabClearSearch');
    if (vtabSearchInput) {
      vtabSearchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (vtabClearSearch) vtabClearSearch.style.display = q ? 'inline-block' : 'none';
        document.querySelectorAll('.vtab-item').forEach(item => {
          const txt = (item.textContent || '').toLowerCase();
          const match = !q || txt.includes(q);
          item.style.display = match ? 'flex' : 'none';
        });
        document.querySelectorAll('.vtab-category').forEach(cat => {
          const visible = cat.querySelectorAll('.vtab-item:not([style*="display: none"])');
          cat.style.display = (q && visible.length === 0) ? 'none' : 'flex';
        });
      });
    }
    if (vtabClearSearch) {
      vtabClearSearch.addEventListener('click', () => {
        if (vtabSearchInput) {
          vtabSearchInput.value = '';
          vtabSearchInput.dispatchEvent(new Event('input'));
          vtabSearchInput.focus();
        }
      });
    }

    const vtabCollapseBtn = document.getElementById('vtabCollapseBtn');
    const vtabSidebar = document.getElementById('verticalSidebar');
    const vtabCollapseIcon = document.getElementById('vtabCollapseIcon');
    const vtabCollapseText = document.getElementById('vtabCollapseText');
    if (vtabCollapseBtn && vtabSidebar) {
      vtabCollapseBtn.addEventListener('click', () => {
        const collapsed = vtabSidebar.classList.toggle('collapsed');
        if (vtabCollapseIcon) vtabCollapseIcon.textContent = collapsed ? '▶' : '◀';
        if (vtabCollapseText) vtabCollapseText.textContent = collapsed ? '' : 'Collapse Sidebar';
        localStorage.setItem('eh_sidebar_collapsed', collapsed ? 'true' : 'false');
      });
      if (localStorage.getItem('eh_sidebar_collapsed') === 'true') {
        vtabSidebar.classList.add('collapsed');
        if (vtabCollapseIcon) vtabCollapseIcon.textContent = '▶';
        if (vtabCollapseText) vtabCollapseText.textContent = '';
      }
    }


    // Bind Export Buttons
    if (this.exportBtn) this.exportBtn.addEventListener('click', () => this.exportJSON());
    if (this.pdfBtn) this.pdfBtn.addEventListener('click', () => this.exportPDF());
    if (this.postmanBtn) this.postmanBtn.addEventListener('click', () => this.exportPostman());
    if (this.openapiBtn) this.openapiBtn.addEventListener('click', () => this.exportOpenAPI());
    if (this.txtBtn) this.txtBtn.addEventListener('click', () => this.exportTXT());
    if (this.exportSecretsBtn) this.exportSecretsBtn.addEventListener('click', () => this.exportSecrets());
    if (this.exportAllZipBtn) this.exportAllZipBtn.addEventListener('click', () => this.exportAllAsZip());

    // Bind Sniffer & Prober
    if (this.probeStatusBtn) this.probeStatusBtn.addEventListener('click', () => this.probeEndpoints());
    if (this.toggleSnifferBtn) this.toggleSnifferBtn.addEventListener('click', () => this.toggleSniffer());
    if (this.clearSnifferBtn) this.clearSnifferBtn.addEventListener('click', () => this.clearSniffer());

    // Bind v4.0 Features
    if (this.harBtn) this.harBtn.addEventListener('click', () => this.exportHAR());
    if (this.domWalkBtn) this.domWalkBtn.addEventListener('click', () => this.walkDOM());
    if (this.mineParamsBtn) this.mineParamsBtn.addEventListener('click', () => this.mineParameters());
    if (this.clearWsBtn) this.clearWsBtn.addEventListener('click', () => this.clearWsFrames());
    if (this.bashBtn) this.bashBtn.addEventListener('click', () => this.exportBash());
    if (this.auditStorageBtn) this.auditStorageBtn.addEventListener('click', () => this.auditStorage());
    if (this.analyzeHeadersBtn) this.analyzeHeadersBtn.addEventListener('click', () => this.analyzeSecurityHeaders());
    if (this.runCorsAuditBtn) this.runCorsAuditBtn.addEventListener('click', () => this.runCorsAudit());
    if (this.inspectJwtBtn) this.inspectJwtBtn.addEventListener('click', () => this.inspectJwt());
    if (this.importSwaggerUrlBtn) this.importSwaggerUrlBtn.addEventListener('click', () => this.importSwaggerUrl());
    if (this.importSwaggerJsonBtn) this.importSwaggerJsonBtn.addEventListener('click', () => this.importSwaggerJson());
    if (this.probeAllBucketsBtn) this.probeAllBucketsBtn.addEventListener('click', () => this.probeAllBuckets());
    if (this.verbTamperBtn) this.verbTamperBtn.addEventListener('click', () => this.runVerbTamperMatrix());
    if (this.idorSeqBtn) this.idorSeqBtn.addEventListener('click', () => this.runIdorSequence());
    if (this.htmlReportBtn) this.htmlReportBtn.addEventListener('click', () => this.exportHTMLReport());
    if (this.testGqlBatchBtn) this.testGqlBatchBtn.addEventListener('click', () => this.testGraphQLBatch());
    if (this.probeGqlFieldsBtn) this.probeGqlFieldsBtn.addEventListener('click', () => this.probeGraphQLFields());
    if (this.checkTakeoverBtn) this.checkTakeoverBtn.addEventListener('click', () => this.checkSubdomainTakeover());
    if (this.detectWafBtn) this.detectWafBtn.addEventListener('click', () => this.detectWAF());
    if (this.auditDomXssBtn) this.auditDomXssBtn.addEventListener('click', () => this.auditDOMXSS());
    if (this.probeCachePoisonBtn) this.probeCachePoisonBtn.addEventListener('click', () => this.probeCachePoisoning());
    if (this.probeOpenRedirectBtn) this.probeOpenRedirectBtn.addEventListener('click', () => this.probeOpenRedirect());
    if (this.auditOAuthBtn) this.auditOAuthBtn.addEventListener('click', () => this.auditOAuth());
    if (this.testRateLimitBtn) this.testRateLimitBtn.addEventListener('click', () => this.testRateLimit());
    if (this.refreshDorksBtn) this.refreshDorksBtn.addEventListener('click', () => this.renderDorks());
    if (this.wordlistBtn) this.wordlistBtn.addEventListener('click', () => this.exportWordlist());
    if (this.nucleiBtn) this.nucleiBtn.addEventListener('click', () => this.exportNuclei());
    if (this.probeConcurrentBtn) this.probeConcurrentBtn.addEventListener('click', () => this.probeConcurrent());
    if (this.probeSstiBtn) this.probeSstiBtn.addEventListener('click', () => this.probeSSTI());
    if (this.probeSqliBtn) this.probeSqliBtn.addEventListener('click', () => this.probeSQLi());
    if (this.probeXxeBtn) this.probeXxeBtn.addEventListener('click', () => this.probeXXE());
    if (this.saveSnapshotBtn) this.saveSnapshotBtn.addEventListener('click', () => this.saveSnapshot());
    if (this.computeDiffBtn) this.computeDiffBtn.addEventListener('click', () => this.computeDiff());
    if (this.refreshSsrfBtn) this.refreshSsrfBtn.addEventListener('click', () => this.renderSSRFCandidates());
    if (this.burpXmlBtn) this.burpXmlBtn.addEventListener('click', () => this.exportBurpXml());
    if (this.execSummaryBtn) this.execSummaryBtn.addEventListener('click', () => this.exportExecutiveSummary());
    if (this.runRegexBtn) this.runRegexBtn.addEventListener('click', () => this.runCustomRegex());
    if (this.calcEntropyBtn) this.calcEntropyBtn.addEventListener('click', () => this.calcEntropy());
    if (this.auditCookiesBtn) this.auditCookiesBtn.addEventListener('click', () => this.auditCookies());
    if (this.parseRobotsBtn) this.parseRobotsBtn.addEventListener('click', () => this.parseRobots());
    if (this.evalCspBtn) this.evalCspBtn.addEventListener('click', () => this.evalCSPBypasses());
    if (this.postmanEnvBtn) this.postmanEnvBtn.addEventListener('click', () => this.exportPostmanEnvironment());
    if (this.generateVectorsBtn) this.generateVectorsBtn.addEventListener('click', () => this.generateSchemaVectors());
    if (this.auditSriBtn) this.auditSriBtn.addEventListener('click', () => this.auditSRI());
    if (this.probeCrlfBtn) this.probeCrlfBtn.addEventListener('click', () => this.probeCRLF());
    if (this.harvestFormsBtn) this.harvestFormsBtn.addEventListener('click', () => this.harvestForms());
    if (this.auditCryptoBtn) this.auditCryptoBtn.addEventListener('click', () => this.auditCrypto());
    if (this.deepLinksBtn) this.deepLinksBtn.addEventListener('click', () => this.harvestDeepLinks());
    if (this.probeEnvBtn) this.probeEnvBtn.addEventListener('click', () => this.probeEnvLeaks());
    if (this.selectAdminRoleBtn) this.selectAdminRoleBtn.addEventListener('click', () => this.switchSessionProfile('Admin'));
    if (this.selectUserBRoleBtn) this.selectUserBRoleBtn.addEventListener('click', () => this.switchSessionProfile('UserB'));
    if (this.selectGuestRoleBtn) this.selectGuestRoleBtn.addEventListener('click', () => this.switchSessionProfile('Guest'));
    if (this.saveProfileBtn) this.saveProfileBtn.addEventListener('click', () => this.saveSessionProfile());
    if (this.applyProfileToRepeaterBtn) this.applyProfileToRepeaterBtn.addEventListener('click', () => this.applySessionProfileToRepeater());
    if (this.complianceBtn) this.complianceBtn.addEventListener('click', () => this.exportComplianceReport());
    if (this.cliPipelineBtn) this.cliPipelineBtn.addEventListener('click', () => this.exportCLIPipelineScript());
    if (this.refreshScorecardBtn) this.refreshScorecardBtn.addEventListener('click', () => this.renderScorecard());
    if (this.refreshMitreBtn) this.refreshMitreBtn.addEventListener('click', () => this.renderMitreMatrix());
    if (this.drawTopologyBtn) this.drawTopologyBtn.addEventListener('click', () => this.drawTopologyGraph());
    if (this.runOrchestratorBtn) this.runOrchestratorBtn.addEventListener('click', () => this.runZeroDayOrchestrator());

    // Bind Repeater
    if (this.repeaterSendBtn) this.repeaterSendBtn.addEventListener('click', () => this.sendRepeaterRequest());
    if (this.copyRepeaterRespBtn) this.copyRepeaterRespBtn.addEventListener('click', () => this.copyRepeaterResponse());

    // Bind GraphQL
    if (this.graphqlIntrospectBtn) this.graphqlIntrospectBtn.addEventListener('click', () => this.runGraphQLIntrospection());

    // Bind Source Maps
    if (this.unpackMapBtn) this.unpackMapBtn.addEventListener('click', () => this.unpackSourceMap());

    // Bind Fuzzer
    if (this.startFuzzerBtn) this.startFuzzerBtn.addEventListener('click', () => this.startFuzzer());
    if (this.stopFuzzerBtn) this.stopFuzzerBtn.addEventListener('click', () => this.stopFuzzer());

    // Bind Global Auth
    if (this.saveGlobalAuthBtn) this.saveGlobalAuthBtn.addEventListener('click', () => this.saveGlobalAuth());

    // Bind Filters
    if (this.endpointSearch) {
      this.endpointSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderEndpoints();
      });
    }
    if (this.categoryFilterSelect) {
      this.categoryFilterSelect.addEventListener('change', (e) => {
        this.categoryFilter = e.target.value;
        this.renderEndpoints();
      });
    }
    if (this.statusFilterSelect) {
      this.statusFilterSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.renderEndpoints();
      });
    }

    // Bind Settings
    if (this.saveTelegramBtn) this.saveTelegramBtn.addEventListener('click', () => this.saveTelegramSettings());
    if (this.testTelegramBtn) this.testTelegramBtn.addEventListener('click', () => this.sendTelegramReportNow());
    if (this.saveWebhooksBtn) this.saveWebhooksBtn.addEventListener('click', () => this.saveWebhookSettings());
    if (this.saveCrawlBtn) this.saveCrawlBtn.addEventListener('click', () => this.saveCrawlSettings());

    // Bind Tabs
    document.querySelectorAll('.tab').forEach(tabEl => {
      tabEl.addEventListener('click', () => {
        const tabId = tabEl.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll(`.tab[data-tab="${tabId}"]`).forEach(t => t.classList.add('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

        const target = document.getElementById(tabId + 'Tab');
        if (target) target.style.display = 'block';

        if (tabId === 'logs') this.loadLogs();
        if (tabId === 'settings') {
          this.loadSettings();
          this.loadGlobalAuth();
        }
        if (tabId === 'secrets') this.renderSecrets();
        if (tabId === 'sniffer') this.renderSniffer();
        if (tabId === 'ws') this.loadWsFrames();
        if (tabId === 'repeater') this.initRepeaterTab();
        if (tabId === 'graphql') this.initGraphQLTab();
        if (tabId === 'fuzzer') this.initFuzzerTab();
        if (tabId === 'security') this.initSecurityTab();
        if (tabId === 'jwt') this.initJwtTab();
        if (tabId === 'swagger') this.initSwaggerTab();
        if (tabId === 'cloud') this.loadCloudBuckets();
        if (tabId === 'advanced') this.initAdvancedTab();
        if (tabId === 'dorks') this.initDorksTab();
        if (tabId === 'changelog') this.initChangelogTab();
        if (tabId === 'ssrf') this.renderSSRFCandidates();
        if (tabId === 'playground') this.initPlaygroundTab();
        if (tabId === 'fingerprint') this.initFingerprintTab();
      });
    });

    // Handle messages from background worker
    chrome.runtime.onMessage.addListener((req) => {
      if (req.action === 'endpointFound') {
        this.addEndpoint(req.endpoint || req);
        this.addLiveStripItem('🎯 ' + (req.endpoint?.url || req.url));
      }
      if (req.action === 'secretFound') {
        this.addSecret(req.secret || req);
        this.addLiveStripItem(`🔑 [${req.severity || 'SECRET'}] ${req.name || 'Credential'}`);
      }
      if (req.action === 'networkRequestSniffed') {
        this.addSniffedRequest(req.data || req);
      }
      if (req.action === 'endpointProbed') {
        this.updateProbedEndpoint(req);
      }
      if (req.action === 'probingStarted') {
        this.isProbing = true;
        if (this.probeStatusBtn) this.probeStatusBtn.textContent = '⏳ PROBING...';
        this.log(`🎯 Status probing started (${req.total} endpoints)...`, 'info');
      }
      if (req.action === 'probingComplete') {
        this.isProbing = false;
        if (this.probeStatusBtn) this.probeStatusBtn.textContent = '🎯 PROBE STATUS';
        this.log(`✅ Status probe completed for ${req.count} endpoints`, 'success');
        this.renderEndpoints();
      }
      if (req.action === 'snifferStateChanged') {
        this.isSniffing = !!req.active;
        this.updateSnifferUI();
      }
      if (req.action === 'pageChanged') {
        const curUrl = document.getElementById('currentUrl');
        if (curUrl) curUrl.textContent = '📍 ' + req.url;
        const pScanned = document.getElementById('pagesScanned');
        if (pScanned && req.pagesScanned) pScanned.textContent = req.pagesScanned;
      }
      if (req.action === 'statsUpdated') {
        this.updateStats();
      }
      if (req.action === 'scanComplete') {
        this.isScanning = false;
        this.updateButtonState('complete');
        this.log('✅ Scan complete!', 'success');
      }

      // Fuzzer events (v3.0)
      if (req.action === 'fuzzerHit' && req.hit) {
        this.addFuzzerHit(req.hit);
      }
      if (req.action === 'fuzzerProgress') {
        this.updateFuzzerProgress(req);
      }
      if (req.action === 'fuzzerComplete') {
        this.completeFuzzer(req);
      }

      // WebSocket & Parameter Miner events (v4.0)
      if (req.action === 'wsFrameReceived' && req.frame) {
        this.addWsFrame(req.frame);
      }
      if (req.action === 'paramMinerProgress') {
        this.updateParamMinerProgress(req);
      }
    });

    this.updateButtonState('idle');
  }

  // ================================================================
  // 🪟 SIDE PANEL INTEGRATION
  // ================================================================

  async openSidePanel() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
        window.close(); // Close popup so side panel takes over smoothly
      }
    } catch (e) {
      this.log(`⚠️ Side Panel error: ${e.message}`, 'warning');
    }
  }

  // ================================================================
  // 🎯 BUTTON STATE MANAGEMENT
  // ================================================================

  updateButtonState(state) {
    document.body.setAttribute('data-scan-state', state);
    const dot = document.getElementById('statusDot');
    const scanStatus = document.getElementById('scanStatus');

    if (dot) {
      const labels = { idle: '● READY', scanning: '● SCANNING', paused: '● PAUSED', complete: '● COMPLETE' };
      dot.textContent = labels[state] || '● READY';
    }

    if (scanStatus) {
      scanStatus.textContent = state.toUpperCase();
    }

    switch (state) {
      case 'idle':
      case 'complete':
        if (this.scanBtn) { this.scanBtn.disabled = false; this.scanBtn.textContent = '📡 SCAN (ALL)'; }
        if (this.scanCurrentBtn) { this.scanCurrentBtn.disabled = false; this.scanCurrentBtn.textContent = '🎯 SCAN CURRENT'; }
        if (this.stopBtn) this.stopBtn.style.display = 'none';
        if (this.resumeBtn) this.resumeBtn.style.display = 'none';
        break;

      case 'scanning':
        if (this.scanBtn) { this.scanBtn.disabled = true; this.scanBtn.textContent = '⏳ RUNNING...'; }
        if (this.scanCurrentBtn) { this.scanCurrentBtn.disabled = true; this.scanCurrentBtn.textContent = '⏳ RUNNING...'; }
        if (this.stopBtn) this.stopBtn.style.display = 'inline-block';
        if (this.resumeBtn) this.resumeBtn.style.display = 'none';
        break;

      case 'paused':
        if (this.stopBtn) this.stopBtn.style.display = 'none';
        if (this.resumeBtn) { this.resumeBtn.style.display = 'inline-block'; this.resumeBtn.textContent = '▶ RESUME'; }
        break;
    }
  }

  // ================================================================
  // 📡 SCAN ACTIONS (MANUAL START ONLY!)
  // ================================================================

  async scanAll() {
    try {
      const tab = await this.getTargetWebTab();
      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('brave://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://')) {
        this.log('⚠️ No active web target tab found. Please open your target website in a browser tab.', 'warning');
        return;
      }

      this.isScanning = true;
      this.updateButtonState('scanning');
      this.log(`🚀 Crawl started: ${tab.url}`, 'info');

      await chrome.runtime.sendMessage({
        action: 'startScan',
        tabId: tab.id,
        url: tab.url
      });

      this.startStatusCheck();
    } catch (e) {
      this.log(`❌ Error: ${e.message}`, 'error');
      this.isScanning = false;
      this.updateButtonState('idle');
    }
  }

  async scanCurrent() {
    try {
      const tab = await this.getTargetWebTab();
      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('brave://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://')) {
        this.log('⚠️ No active web target tab found. Please open your target website in a browser tab.', 'warning');
        return;
      }

      this.isScanning = true;
      this.updateButtonState('scanning');
      this.log(`🎯 Scanning current page: ${tab.url}`, 'info');

      await chrome.runtime.sendMessage({
        action: 'scanCurrent',
        tabId: tab.id,
        url: tab.url
      });

      this.startStatusCheck();
    } catch (e) {
      this.log(`❌ Error: ${e.message}`, 'error');
      this.isScanning = false;
      this.updateButtonState('idle');
    }
  }

  async stopScan() {
    try {
      this.log('⏹ Halting all scans, sniffer, and prober...', 'info');
      await chrome.runtime.sendMessage({ action: 'stopScan' });
      this.isScanning = false;
      this.isProbing = false;
      this.isSniffing = false;
      this.updateButtonState('idle');
      this.updateSnifferUI();
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
        this.statusInterval = null;
      }
    } catch (e) {
      this.log(`❌ Stop error: ${e.message}`, 'error');
    }
  }

  async resumeScan() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.runtime.sendMessage({ action: 'resumeScan', tabId: tab?.id });
      this.isScanning = true;
      this.updateButtonState('scanning');
      this.log('▶ Scan resumed', 'info');
      this.startStatusCheck();
    } catch (e) {
      this.log(`❌ Resume error: ${e.message}`, 'error');
    }
  }

  async clear() {
    if (!confirm('🗑️ Clear all discovered endpoints, secrets, and paths?')) return;
    await chrome.runtime.sendMessage({ action: 'clear' });
    this.endpoints = [];
    this.secrets = [];
    this.sniffedRequests = [];
    this.paths = [];
    this.logs = [];
    this.fuzzerHits = [];
    this.wsFrames = [];
    if (this.wsCount) this.wsCount.textContent = '0';
    this.updateUI();
    this.updateStats();
    this.log('🗑️ All data cleared', 'info');
  }

  // ================================================================
  // 🎯 LIVE STATUS PROBER
  // ================================================================

  async probeEndpoints() {
    if (this.endpoints.length === 0) {
      this.log('⚠️ No endpoints to probe. Scan pages first!', 'warning');
      return;
    }
    if (this.isProbing) return;
    this.isProbing = true;
    if (this.probeStatusBtn) this.probeStatusBtn.textContent = '⏳ PROBING...';
    this.log(`🎯 Probing HTTP status of ${this.endpoints.length} endpoints...`, 'info');
    await chrome.runtime.sendMessage({ action: 'probeEndpoints' });
  }

  updateProbedEndpoint(req) {
    if (req.url) {
      const ep = this.endpoints.find(e => e.url === req.url);
      if (ep) {
        ep.statusCode = req.status;
        ep.statusText = req.statusText;
        ep.vulnTags = req.vulnTags || [];
      }
    }
    this.renderEndpoints();
  }

  // ================================================================
  // ⚡ RUNTIME SNIFFER (MANUAL TRIGGER ONLY)
  // ================================================================

  async toggleSniffer() {
    this.isSniffing = !this.isSniffing;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.runtime.sendMessage({
      action: 'toggleSniffer',
      active: this.isSniffing,
      tabId: tab?.id
    });
    this.updateSnifferUI();
    this.log(`⚡ Runtime Network Sniffer: ${this.isSniffing ? 'STARTED' : 'STOPPED'}`, 'info');
  }

  updateSnifferUI() {
    if (this.toggleSnifferBtn) {
      this.toggleSnifferBtn.textContent = this.isSniffing ? '⏹ STOP SNIFFER' : '▶ START SNIFFER';
      this.toggleSnifferBtn.className = this.isSniffing ? 'btn btn-sm btn-danger' : 'btn btn-sm btn-primary';
    }
    const pill = document.getElementById('snifferStatePill');
    if (pill) {
      pill.textContent = this.isSniffing ? '🟢 LISTENING' : '🔴 INACTIVE';
      pill.style.color = this.isSniffing ? 'var(--success)' : 'var(--text-dim)';
    }
  }

  clearSniffer() {
    this.sniffedRequests = [];
    this.renderSniffer();
    this.log('🗑️ Sniffer log cleared', 'info');
  }

  addSniffedRequest(reqData) {
    this.sniffedRequests.unshift(reqData);
    if (this.sniffedRequests.length > 200) this.sniffedRequests.pop();
    this.renderSniffer();
  }

  // ================================================================
  // 🧪 IN-BROWSER MINI-REPEATER (v3.0)
  // ================================================================

  async initRepeaterTab() {
    if (!this.repeaterUrl || this.repeaterUrl.value.trim()) return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url && !tab.url.startsWith('chrome://')) {
        this.repeaterUrl.value = tab.url;
      } else if (this.endpoints.length > 0) {
        this.repeaterUrl.value = this.endpoints[0].url;
      }
    } catch (e) {}
  }

  openInRepeater(url, method = 'GET', headers = '', body = '') {
    // Switch to repeater tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const repeaterTabBtn = document.querySelector('.tab[data-tab="repeater"]');
    if (repeaterTabBtn) repeaterTabBtn.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    const target = document.getElementById('repeaterTab');
    if (target) target.style.display = 'block';

    if (this.repeaterUrl) this.repeaterUrl.value = url;
    if (this.repeaterMethod) this.repeaterMethod.value = (method || 'GET').toUpperCase();
    if (this.repeaterHeaders && headers) {
      this.repeaterHeaders.value = typeof headers === 'object' ? JSON.stringify(headers, null, 2) : headers;
    }
    if (this.repeaterBody && body) {
      this.repeaterBody.value = typeof body === 'object' ? JSON.stringify(body, null, 2) : body;
    }
  }

  async sendRepeaterRequest() {
    const url = this.repeaterUrl ? this.repeaterUrl.value.trim() : '';
    if (!url) {
      alert('Please enter a target URL in the Repeater');
      return;
    }

    const method = this.repeaterMethod ? this.repeaterMethod.value : 'GET';
    let headers = {};
    if (this.repeaterHeaders && this.repeaterHeaders.value.trim()) {
      const hText = this.repeaterHeaders.value.trim();
      try {
        if (hText.startsWith('{')) {
          headers = JSON.parse(hText);
        } else {
          hText.split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx > 0) {
              headers[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
            }
          });
        }
      } catch (e) {
        this.log('⚠️ Could not parse custom headers, sending without raw text', 'warning');
      }
    }

    const body = this.repeaterBody ? this.repeaterBody.value : '';

    if (this.repeaterSendBtn) {
      this.repeaterSendBtn.disabled = true;
      this.repeaterSendBtn.textContent = '⏳ SENDING...';
    }

    if (this.repeaterResponseBox) {
      this.repeaterResponseBox.textContent = 'Dispatching HTTP request...';
    }

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'sendRepeaterRequest',
        url,
        method,
        headers,
        body
      });

      if (this.repeaterSendBtn) {
        this.repeaterSendBtn.disabled = false;
        this.repeaterSendBtn.textContent = '🚀 SEND';
      }

      if (res?.success && res.response) {
        const resp = res.response;
        const status = resp.status;
        if (this.repeaterStatusBadge) {
          this.repeaterStatusBadge.textContent = `${status} ${resp.statusText || ''}`;
          this.repeaterStatusBadge.className = status >= 200 && status < 300
            ? 'badge status-ok'
            : (status >= 400 && status < 500 ? 'badge status-warn' : (status >= 500 ? 'badge status-bad' : 'badge'));
        }
        if (this.repeaterLatencyBadge) {
          this.repeaterLatencyBadge.textContent = `${resp.latencyMs} ms`;
        }
        if (this.repeaterSizeBadge) {
          this.repeaterSizeBadge.textContent = `${resp.sizeBytes || 0} B`;
        }

        const headersFormatted = Object.entries(resp.headers || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');

        const fullOutput = `--- RESPONSE HEADERS ---\n${headersFormatted}\n\n--- RESPONSE BODY ---\n${resp.body}`;
        this.currentResponseText = resp.body || fullOutput;
        if (this.repeaterResponseBox) {
          this.repeaterResponseBox.textContent = fullOutput;
        }
      } else {
        if (this.repeaterResponseBox) {
          this.repeaterResponseBox.textContent = `Request failed: ${res?.error || 'Unknown error'}`;
        }
      }
    } catch (e) {
      if (this.repeaterSendBtn) {
        this.repeaterSendBtn.disabled = false;
        this.repeaterSendBtn.textContent = '🚀 SEND';
      }
      if (this.repeaterResponseBox) {
        this.repeaterResponseBox.textContent = `Error: ${e.message}`;
      }
    }
  }

  copyRepeaterResponse() {
    if (!this.currentResponseText) return;
    navigator.clipboard.writeText(this.currentResponseText);
    if (this.copyRepeaterRespBtn) {
      this.copyRepeaterRespBtn.textContent = 'COPIED!';
      setTimeout(() => { this.copyRepeaterRespBtn.textContent = '📋 Copy Response'; }, 1500);
    }
  }

  // ================================================================
  // 🔍 IN-BROWSER PARAMETER MINER (v4.0)
  // ================================================================

  async mineParameters() {
    let target = this.repeaterUrl ? this.repeaterUrl.value.trim() : '';
    if (!target) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url && !tab.url.startsWith('chrome://')) target = tab.url;
      } catch (e) {}
    }
    if (!target) {
      alert('Please provide a target URL in the Repeater input or open a target page');
      return;
    }
    if (this.paramMinerBox) this.paramMinerBox.style.display = 'block';
    if (this.paramMinerStatus) this.paramMinerStatus.textContent = '● MINING...';
    if (this.paramMinerList) {
      this.paramMinerList.innerHTML = `<div style="color:var(--accent); font-size:7.5px;">🔍 Probing common query parameters on ${this.escape(target)}...</div>`;
    }
    if (this.mineParamsBtn) {
      this.mineParamsBtn.disabled = true;
      this.mineParamsBtn.textContent = '⏳ MINING...';
    }

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'mineParameters',
        url: target,
        delay: 150
      });
      if (this.mineParamsBtn) {
        this.mineParamsBtn.disabled = false;
        this.mineParamsBtn.textContent = '🔍 MINE PARAMS';
      }
      if (this.paramMinerStatus) this.paramMinerStatus.textContent = '● COMPLETED';
      if (res?.success && res.result) {
        this.renderParamMinerResults(res.result);
      } else {
        if (this.paramMinerList) {
          this.paramMinerList.innerHTML = `<div style="color:var(--danger); font-size:7.5px;">❌ Mining failed: ${this.escape(res?.error || 'Unknown error')}</div>`;
        }
      }
    } catch (e) {
      if (this.mineParamsBtn) {
        this.mineParamsBtn.disabled = false;
        this.mineParamsBtn.textContent = '🔍 MINE PARAMS';
      }
      if (this.paramMinerStatus) this.paramMinerStatus.textContent = '● ERROR';
      if (this.paramMinerList) {
        this.paramMinerList.innerHTML = `<div style="color:var(--danger); font-size:7.5px;">❌ Error: ${this.escape(e.message)}</div>`;
      }
    }
  }

  updateParamMinerProgress(prog) {
    if (!this.paramMinerList) return;
    const p = prog.percent || 0;
    this.paramMinerList.innerHTML = `
      <div style="font-size:7.5px; color:var(--text-dim); margin-bottom:3px;">
        Probing parameters (${prog.tested}/${prog.total}) • ${p}%
      </div>
      <div style="width:100%; height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden;">
        <div style="width:${p}%; height:100%; background:var(--accent); transition:width 0.2s;"></div>
      </div>
    `;
  }

  renderParamMinerResults(res) {
    if (!this.paramMinerList) return;
    const hits = res.discovered || [];
    if (hits.length === 0) {
      this.paramMinerList.innerHTML = `
        <div style="color:var(--text-dim); font-size:7.5px;">
          Baseline: Status <b>${res.baselineStatus}</b>, Length <b>${res.baselineLength} B</b>.<br>
          No hidden query parameters reacted to test values.
        </div>
      `;
      return;
    }

    let html = `
      <div style="font-size:7.5px; margin-bottom:4px; color:var(--text-dim);">
        Baseline: <b>${res.baselineStatus}</b> (${res.baselineLength} B) | Discovered: <b style="color:var(--accent);">${hits.length}</b>
      </div>
    `;
    html += hits.map(h => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:3px 2px; border-bottom:1px solid rgba(88,166,255,0.06); font-size:7.5px;">
        <span style="font-weight:700; color:var(--accent);">?${this.escape(h.parameter)}=</span>
        <span class="badge ${h.reflected ? 'status-ok' : 'status-warn'}" style="font-size:6.5px;">${this.escape(h.confidence)}</span>
        <button class="btn btn-sm btn-insert-param" data-param="${this.escape(h.parameter)}" style="padding:1px 5px; font-size:7px;">+ URL</button>
      </div>
    `).join('');

    this.paramMinerList.innerHTML = html;

    this.paramMinerList.querySelectorAll('.btn-insert-param').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.param;
        if (this.repeaterUrl) {
          try {
            const u = new URL(this.repeaterUrl.value);
            u.searchParams.set(p, 'test');
            this.repeaterUrl.value = u.toString();
          } catch (e) {
            this.repeaterUrl.value += (this.repeaterUrl.value.includes('?') ? '&' : '?') + `${p}=test`;
          }
        }
      });
    });
  }

  // ================================================================
  // 🌸 GRAPHQL SCHEMA INTROSPECTOR (v3.0)
  // ================================================================

  async initGraphQLTab() {
    if (!this.graphqlEndpointInput || this.graphqlEndpointInput.value.trim()) return;
    const gqlEndpoint = this.endpoints.find(e => e.type === 'graphql' || (e.url && e.url.includes('/graphql')));
    if (gqlEndpoint) {
      this.graphqlEndpointInput.value = gqlEndpoint.url;
    } else {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          const origin = new URL(tab.url).origin;
          this.graphqlEndpointInput.value = `${origin}/graphql`;
        }
      } catch (e) {}
    }
  }

  openInGraphQL(url) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const gqlTab = document.querySelector('.tab[data-tab="graphql"]');
    if (gqlTab) gqlTab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    const target = document.getElementById('graphqlTab');
    if (target) target.style.display = 'block';

    if (this.graphqlEndpointInput) {
      this.graphqlEndpointInput.value = url;
      this.runGraphQLIntrospection();
    }
  }

  async runGraphQLIntrospection() {
    const url = this.graphqlEndpointInput ? this.graphqlEndpointInput.value.trim() : '';
    if (!url) {
      alert('Enter a GraphQL endpoint URL');
      return;
    }

    if (this.graphqlIntrospectBtn) {
      this.graphqlIntrospectBtn.disabled = true;
      this.graphqlIntrospectBtn.textContent = '⏳ INTROSPECTING...';
    }

    if (this.graphqlResults) {
      this.graphqlResults.innerHTML = `<div class="empty">Sending standard IntrospectionQuery to ${this.escape(url)}...</div>`;
    }

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'introspectGraphQL',
        url
      });

      if (this.graphqlIntrospectBtn) {
        this.graphqlIntrospectBtn.disabled = false;
        this.graphqlIntrospectBtn.textContent = '🌸 INTROSPECT';
      }

      if (res?.success && res.schema) {
        this.renderGraphQLSchema(res.schema);
      } else {
        if (this.graphqlResults) {
          this.graphqlResults.innerHTML = `
            <div class="empty" style="color:var(--danger);">
              ❌ Introspection Failed: ${this.escape(res?.error || 'Endpoint did not return schema')}
            </div>
          `;
        }
      }
    } catch (e) {
      if (this.graphqlIntrospectBtn) {
        this.graphqlIntrospectBtn.disabled = false;
        this.graphqlIntrospectBtn.textContent = '🌸 INTROSPECT';
      }
      if (this.graphqlResults) {
        this.graphqlResults.innerHTML = `<div class="empty" style="color:var(--danger);">❌ Error: ${this.escape(e.message)}</div>`;
      }
    }
  }

  renderGraphQLSchema(schema) {
    if (!this.graphqlResults) return;

    if (!schema.enabled) {
      this.graphqlResults.innerHTML = `
        <div class="empty" style="color:var(--warning);">
          ⚠️ Introspection appears to be DISABLED on this endpoint.<br>
          <span style="font-size:7px; color:var(--text-faint);">${this.escape(schema.error || '')}</span>
        </div>
      `;
      return;
    }

    const qCount = schema.queries ? schema.queries.length : 0;
    const mCount = schema.mutations ? schema.mutations.length : 0;
    const tCount = schema.types ? schema.types.length : 0;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:7.5px;">
        <span class="status-pill">SCHEMA INTROSPECTED</span>
        <span>Queries: <b>${qCount}</b> | Mutations: <b>${mCount}</b> | Types: <b>${tCount}</b></span>
      </div>
    `;

    // Render Queries
    if (schema.queries && schema.queries.length > 0) {
      html += `<div style="font-weight:700; color:var(--accent); font-size:8px; margin:4px 0;">🔍 QUERIES (${schema.queries.length})</div>`;
      html += schema.queries.map(q => {
        const argsStr = (q.args || []).map(a => `${a.name}: ${a.type}`).join(', ');
        return `
          <div class="schema-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:700; color:#58a6ff;">${this.escape(q.name)}</span>
              <button class="btn btn-sm btn-repeater-gql" data-name="${this.escape(q.name)}" data-sample="${this.escape(q.sampleQuery)}">🧪 Test in Repeater</button>
            </div>
            ${argsStr ? `<div style="font-size:7px; color:var(--text-dim); margin-top:1px;">args: (${this.escape(argsStr)})</div>` : ''}
            <div style="font-size:7px; color:var(--text-faint); margin-top:1px;">returns: ${this.escape(q.returnType)}</div>
          </div>
        `;
      }).join('');
    }

    // Render Mutations
    if (schema.mutations && schema.mutations.length > 0) {
      html += `<div style="font-weight:700; color:var(--warning); font-size:8px; margin:6px 0 4px 0;">⚡ MUTATIONS (${schema.mutations.length})</div>`;
      html += schema.mutations.map(m => {
        const argsStr = (m.args || []).map(a => `${a.name}: ${a.type}`).join(', ');
        return `
          <div class="schema-card" style="border-left-color:var(--warning);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:700; color:#f0883e;">${this.escape(m.name)}</span>
              <button class="btn btn-sm btn-repeater-gql" data-name="${this.escape(m.name)}" data-sample="${this.escape(m.sampleMutation)}">🧪 Test in Repeater</button>
            </div>
            ${argsStr ? `<div style="font-size:7px; color:var(--text-dim); margin-top:1px;">args: (${this.escape(argsStr)})</div>` : ''}
            <div style="font-size:7px; color:var(--text-faint); margin-top:1px;">returns: ${this.escape(m.returnType)}</div>
          </div>
        `;
      }).join('');
    }

    this.graphqlResults.innerHTML = html;

    // Attach "Test in Repeater" listeners
    this.graphqlResults.querySelectorAll('.btn-repeater-gql').forEach(btn => {
      btn.addEventListener('click', () => {
        const sample = btn.dataset.sample;
        const url = this.graphqlEndpointInput ? this.graphqlEndpointInput.value.trim() : '';
        this.openInRepeater(url, 'POST', { 'Content-Type': 'application/json' }, JSON.stringify({ query: sample }, null, 2));
      });
    });
  }

  // ================================================================
  // 🗺️ SOURCE MAP UNPACKER (v3.0)
  // ================================================================

  async unpackSourceMap() {
    const url = this.sourcemapInput ? this.sourcemapInput.value.trim() : '';
    if (!url) {
      alert('Enter a .map URL to unpack');
      return;
    }

    if (this.unpackMapBtn) {
      this.unpackMapBtn.disabled = true;
      this.unpackMapBtn.textContent = '⏳ UNPACKING...';
    }

    if (this.sourcemapResults) {
      this.sourcemapResults.innerHTML = `<div class="empty">Downloading and parsing ${this.escape(url)}...</div>`;
    }

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'unpackSourceMap',
        url
      });

      if (this.unpackMapBtn) {
        this.unpackMapBtn.disabled = false;
        this.unpackMapBtn.textContent = '🗺️ UNPACK';
      }

      if (res?.success && res.result) {
        this.renderSourceMapResult(res.result);
      } else {
        if (this.sourcemapResults) {
          this.sourcemapResults.innerHTML = `
            <div class="empty" style="color:var(--danger);">
              ❌ Unpack failed: ${this.escape(res?.error || 'Could not parse source map')}
            </div>
          `;
        }
      }
    } catch (e) {
      if (this.unpackMapBtn) {
        this.unpackMapBtn.disabled = false;
        this.unpackMapBtn.textContent = '🗺️ UNPACK';
      }
      if (this.sourcemapResults) {
        this.sourcemapResults.innerHTML = `<div class="empty" style="color:var(--danger);">❌ Error: ${this.escape(e.message)}</div>`;
      }
    }
  }

  renderSourceMapResult(result) {
    if (!this.sourcemapResults) return;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:7.5px;">
        <span class="status-pill">SOURCE MAP UNPACKED</span>
        <span>Original Files: <b>${result.totalFiles || 0}</b> | Routes Extracted: <b>${result.routesFound ? result.routesFound.length : 0}</b></span>
      </div>
    `;

    // Discovered Routes
    if (result.routesFound && result.routesFound.length > 0) {
      html += `<div style="font-weight:700; color:var(--accent); font-size:8px; margin:4px 0;">🎯 EXTRACTED HIDDEN ROUTES (${result.routesFound.length})</div>`;
      html += result.routesFound.slice(0, 50).map(r => `
        <div class="endpoint-item">
          <div class="endpoint-header">
            <span class="badge get">ROUTE</span>
            <span class="endpoint-url">${this.escape(r)}</span>
            <button class="btn btn-sm btn-repeater" data-url="${this.escape(r)}" data-method="GET">🧪 Repeater</button>
          </div>
        </div>
      `).join('');
    }

    // Source files tree
    if (result.sources && result.sources.length > 0) {
      html += `<div style="font-weight:700; color:var(--text); font-size:8px; margin:6px 0 4px 0;">📁 ORIGINAL SOURCE TREE (Top ${Math.min(result.sources.length, 50)})</div>`;
      html += result.sources.slice(0, 50).map(s => `
        <div style="font-size:7.5px; padding:2px 4px; border-bottom:1px solid rgba(88,166,255,0.04); color:var(--text-dim); word-break:break-all;">
          📄 ${this.escape(s)}
        </div>
      `).join('');
    }

    this.sourcemapResults.innerHTML = html;

    // Attach repeater buttons
    this.sourcemapResults.querySelectorAll('.btn-repeater').forEach(btn => {
      btn.addEventListener('click', () => {
        let targetUrl = btn.dataset.url;
        if (targetUrl.startsWith('/')) {
          try {
            const u = new URL(result.url);
            targetUrl = `${u.origin}${targetUrl}`;
          } catch (e) {}
        }
        this.openInRepeater(targetUrl, 'GET');
      });
    });
  }

  // ================================================================
  // 🕷️ MICRO-FUZZER (v3.0)
  // ================================================================

  async initFuzzerTab() {
    if (!this.fuzzerBaseUrl || this.fuzzerBaseUrl.value.trim()) return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url && !tab.url.startsWith('chrome://')) {
        this.fuzzerBaseUrl.value = new URL(tab.url).origin;
      }
    } catch (e) {}
  }

  async startFuzzer() {
    const baseUrl = this.fuzzerBaseUrl ? this.fuzzerBaseUrl.value.trim() : '';
    if (!baseUrl) {
      alert('Please enter a target Base URL for the fuzzer');
      return;
    }

    const category = this.fuzzerCategory ? this.fuzzerCategory.value : 'all';

    this.isFuzzing = true;
    this.fuzzerHits = [];
    if (this.startFuzzerBtn) this.startFuzzerBtn.style.display = 'none';
    if (this.stopFuzzerBtn) this.stopFuzzerBtn.style.display = 'inline-block';
    if (this.fuzzerPill) {
      this.fuzzerPill.textContent = '● FUZZING...';
      this.fuzzerPill.className = 'status-pill scanning';
    }
    if (this.fuzzerList) {
      this.fuzzerList.innerHTML = `<div class="empty">Probing dictionary routes on ${this.escape(baseUrl)} with stealth delay...</div>`;
    }

    await chrome.runtime.sendMessage({
      action: 'startFuzzer',
      baseUrl,
      category,
      delay: 250
    });
  }

  async stopFuzzer() {
    await chrome.runtime.sendMessage({ action: 'stopFuzzer' });
    this.isFuzzing = false;
    if (this.startFuzzerBtn) this.startFuzzerBtn.style.display = 'inline-block';
    if (this.stopFuzzerBtn) this.stopFuzzerBtn.style.display = 'none';
    if (this.fuzzerPill) {
      this.fuzzerPill.textContent = '● STOPPED';
      this.fuzzerPill.className = 'status-pill';
    }
  }

  addFuzzerHit(hit) {
    this.fuzzerHits.push(hit);
    if (this.fuzzerCountLabel) {
      this.fuzzerCountLabel.textContent = `${this.fuzzerHits.length} Hits`;
    }
    this.renderFuzzer();
  }

  updateFuzzerProgress(data) {
    if (this.fuzzerPill && this.isFuzzing) {
      this.fuzzerPill.textContent = `● ${data.percent}% (${data.tested}/${data.total})`;
    }
  }

  completeFuzzer(data) {
    this.isFuzzing = false;
    if (this.startFuzzerBtn) this.startFuzzerBtn.style.display = 'inline-block';
    if (this.stopFuzzerBtn) this.stopFuzzerBtn.style.display = 'none';
    if (this.fuzzerPill) {
      this.fuzzerPill.textContent = '● FINISHED';
      this.fuzzerPill.className = 'status-pill';
    }
    this.log(`🕷️ Micro-fuzzer completed. Discovered ${this.fuzzerHits.length} alive routes!`, 'success');
  }

  renderFuzzer() {
    if (!this.fuzzerList) return;

    if (this.fuzzerHits.length === 0) {
      this.fuzzerList.innerHTML = `<div class="empty">No interesting routes discovered yet.</div>`;
      return;
    }

    this.fuzzerList.innerHTML = this.fuzzerHits.map(hit => {
      const cls = hit.status >= 200 && hit.status < 300 ? 'ok' : (hit.status === 401 || hit.status === 403 ? 'auth' : 'err');
      const badgeCls = hit.status >= 200 && hit.status < 300 ? 'status-ok' : (hit.status === 401 || hit.status === 403 ? 'status-warn' : 'status-bad');
      return `
        <div class="fuzz-hit ${cls}">
          <div style="display:flex; align-items:center; gap:6px; flex:1; overflow:hidden;">
            <span class="badge ${badgeCls}">${hit.status}</span>
            <span style="font-weight:700; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${this.escape(hit.path)}</span>
          </div>
          <button class="btn btn-sm btn-repeater" data-url="${this.escape(hit.url)}" data-method="GET">🧪 Repeater</button>
        </div>
      `;
    }).join('');

    this.fuzzerList.querySelectorAll('.btn-repeater').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openInRepeater(btn.dataset.url, 'GET');
      });
    });
  }

  // ================================================================
  // 🔑 GLOBAL AUTH & CUSTOM HEADERS (v3.0)
  // ================================================================

  async loadGlobalAuth() {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'getGlobalHeaders' });
      if (res?.headers) {
        const h = res.headers;
        if (this.authHeaderInput) this.authHeaderInput.value = h.authorization || '';
        if (this.cookieHeaderInput) this.cookieHeaderInput.value = h.cookie || '';
        if (this.customHdrName1) this.customHdrName1.value = h.customHeaderName1 || '';
        if (this.customHdrVal1) this.customHdrVal1.value = h.customHeaderValue1 || '';
      }
    } catch (e) {}
  }

  async saveGlobalAuth() {
    const headers = {
      authorization: this.authHeaderInput ? this.authHeaderInput.value.trim() : '',
      cookie: this.cookieHeaderInput ? this.cookieHeaderInput.value.trim() : '',
      customHeaderName1: this.customHdrName1 ? this.customHdrName1.value.trim() : '',
      customHeaderValue1: this.customHdrVal1 ? this.customHdrVal1.value.trim() : ''
    };

    await chrome.runtime.sendMessage({
      action: 'setGlobalHeaders',
      headers
    });

    if (this.saveGlobalAuthBtn) {
      this.saveGlobalAuthBtn.textContent = 'SAVED!';
      setTimeout(() => { this.saveGlobalAuthBtn.textContent = '💾 Save Global Auth Headers'; }, 1500);
    }
    this.log('🔑 Global authentication headers updated & stored', 'success');
  }

  // ================================================================
  // 📦 EXPORT HANDLERS
  // ================================================================

  async exportPostman() {
    await chrome.runtime.sendMessage({ action: 'exportPostman' });
    this.log('📦 Exporting Postman Collection v2.1...', 'info');
  }

  async exportOpenAPI() {
    await chrome.runtime.sendMessage({ action: 'exportOpenAPI' });
    this.log('📜 Exporting OpenAPI 3.0 specification...', 'info');
  }

  async exportTXT() {
    await chrome.runtime.sendMessage({ action: 'exportTXT' });
    this.log('📋 Exporting TXT URLs list for CLI...', 'info');
  }

  async exportJSON() {
    await chrome.runtime.sendMessage({ action: 'exportResults' });
    this.log('💾 Exporting full JSON dataset...', 'info');
  }

  async exportPDF() {
    await chrome.runtime.sendMessage({ action: 'exportPDF' });
    this.log('📄 Exporting printable HTML report...', 'info');
  }

  async exportSecrets() {
    await chrome.runtime.sendMessage({ action: 'exportSecrets' });
    this.log('🔑 Exporting discovered secrets...', 'info');
  }

  async exportHAR() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportHAR' });
      this.log('📦 Exporting HTTP Archive (HAR 1.2) for Burp/Caido...', 'info');
    } catch (e) {
      this.log(`❌ HAR Export error: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 📊 DATA LOADING & INITIAL SYNC
  // ================================================================

  async load() {
    try {
      const statsRes = await chrome.runtime.sendMessage({ action: 'getStats' });
      if (statsRes?.stats) {
        const s = statsRes.stats;
        this.endpoints = s.endpoints || [];
        this.secrets = s.secrets || [];
        this.sniffedRequests = s.sniffedRequests || [];
        this.paths = s.paths || [];
        this.isScanning = !!s.isRunning;
        this.isSniffing = !!s.isSniffing;
        this.isProbing = !!s.isProbing;

        this.updateButtonState(s.isRunning ? 'scanning' : (s.isPaused ? 'paused' : 'idle'));
        this.updateSnifferUI();
        this.updateUI();
        this.updateStats();
      }
      this.loadWsFrames();
    } catch (e) {}
  }

  // ================================================================
  // 🎨 RENDERING
  // ================================================================

  updateUI() {
    this.renderEndpoints();
    this.renderSecrets();
    this.renderSniffer();
    this.renderPaths();
  }

  renderEndpoints() {
    const list = document.getElementById('endpointList');
    if (!list) return;

    let filtered = this.endpoints;

    // Search query filter
    if (this.searchQuery) {
      filtered = filtered.filter(ep =>
        ep.url.toLowerCase().includes(this.searchQuery) ||
        (ep.method && ep.method.toLowerCase().includes(this.searchQuery)) ||
        (ep.type && ep.type.toLowerCase().includes(this.searchQuery))
      );
    }

    // Category filter
    if (this.categoryFilter) {
      filtered = filtered.filter(ep => ep.type === this.categoryFilter);
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(ep => {
        const sc = ep.statusCode;
        if (!sc) return false;
        if (this.statusFilter === '200') return sc >= 200 && sc < 300;
        if (this.statusFilter === '40x') return sc === 401 || sc === 403;
        if (this.statusFilter === '50x') return sc >= 500;
        if (this.statusFilter === '404') return sc === 404;
        return true;
      });
    }

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty">No matching endpoints found.</div>`;
      return;
    }

    list.innerHTML = filtered.slice(0, 100).map(ep => {
      let statusClass = '';
      let statusBadge = '';
      if (ep.statusCode) {
        if (ep.statusCode >= 200 && ep.statusCode < 300) {
          statusClass = 'status-200';
          statusBadge = `<span class="badge status-ok">${ep.statusCode} OK</span>`;
        } else if (ep.statusCode === 401 || ep.statusCode === 403) {
          statusClass = 'status-40x';
          statusBadge = `<span class="badge status-warn">${ep.statusCode} AUTH</span>`;
        } else if (ep.statusCode >= 500) {
          statusClass = 'status-50x';
          statusBadge = `<span class="badge status-bad">${ep.statusCode} ERR</span>`;
        } else {
          statusClass = 'status-404';
          statusBadge = `<span class="badge">${ep.statusCode}</span>`;
        }
      }

      const vulnTagsHtml = (ep.vulnTags || []).map(v =>
        `<span class="tag-vuln ${v.color}">${this.escape(v.tag)}</span>`
      ).join(' ');

      const isGraphQL = ep.type === 'graphql' || (ep.url && ep.url.includes('/graphql'));

      return `
        <div class="endpoint-item ${statusClass}">
          <div class="endpoint-header">
            <span class="badge ${(ep.method || 'GET').toLowerCase()}">${ep.method || 'GET'}</span>
            <span class="endpoint-url">${this.escape(ep.url)}</span>
            ${statusBadge}
          </div>
          ${vulnTagsHtml ? `<div style="margin:2px 0;">${vulnTagsHtml}</div>` : ''}
          <div class="endpoint-footer">
            <span>📎 ${this.escape(ep.source || 'crawl')} ${ep.type ? `• [${ep.type}]` : ''}</span>
            <div style="display:flex; gap:3px;">
              <button class="btn btn-sm btn-repeater" data-url="${this.escape(ep.url)}" data-method="${ep.method || 'GET'}">🧪 Repeater</button>
              ${isGraphQL ? `<button class="btn btn-sm btn-purple btn-graphql-quick" data-url="${this.escape(ep.url)}">🌸 Schema</button>` : ''}
              <button class="btn btn-sm btn-curl" data-url="${this.escape(ep.url)}" data-method="${ep.method || 'GET'}">📋 cURL</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach cURL copy buttons
    list.querySelectorAll('.btn-curl').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        const method = btn.dataset.method;
        const curlCmd = `curl -i -k -s -X ${method} "${url}"`;
        navigator.clipboard.writeText(curlCmd);
        btn.textContent = 'COPIED!';
        setTimeout(() => { btn.textContent = '📋 cURL'; }, 1500);
      });
    });

    // Attach Repeater buttons
    list.querySelectorAll('.btn-repeater').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openInRepeater(btn.dataset.url, btn.dataset.method);
      });
    });

    // Attach GraphQL quick introspect buttons
    list.querySelectorAll('.btn-graphql-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openInGraphQL(btn.dataset.url);
      });
    });
  }

  renderSecrets() {
    const list = document.getElementById('secretsList') || document.getElementById('secretList');
    if (!list) return;

    if (!this.secrets || this.secrets.length === 0) {
      list.innerHTML = `<div class="empty">No secrets or API tokens discovered yet.<br>Scripts and HTML will be analyzed during scan.</div>`;
      return;
    }

    list.innerHTML = this.secrets.map((sec, idx) => {
      const sev = (sec.severity || 'HIGH').toUpperCase();
      const sevClass = sev.toLowerCase();
      const rawVal = sec.value || sec.raw || '';
      const maskedVal = sec.masked || (rawVal.length > 8 ? rawVal.slice(0, 4) + '••••••••' + rawVal.slice(-4) : '••••••••');
      const timeStr = sec.foundAt || (sec.timestamp ? new Date(sec.timestamp).toLocaleTimeString() : 'Discovered');

      // Direct vulnerability verdict analysis
      let vulVerdict = '⚠️ EXPOSURE RISK: High-entropy secret token exposed in client asset.';
      let verdictColor = 'var(--accent-amber)';
      const typeLower = (sec.name || '').toLowerCase();

      if (typeLower.includes('aws') || rawVal.startsWith('AKIA')) {
        vulVerdict = '🚨 CRITICAL VULNERABILITY: AWS IAM Access Key exposed! May allow complete cloud infrastructure takeover via AWS CLI.';
        verdictColor = 'var(--accent-rose)';
      } else if (rawVal.startsWith('sk_live_')) {
        vulVerdict = '🚨 CRITICAL VULNERABILITY: Live Stripe Secret Key! Grants full access to customer charges, refunds, and bank account balances.';
        verdictColor = 'var(--accent-rose)';
      } else if (rawVal.startsWith('sk_test_')) {
        vulVerdict = '⚠️ TEST KEY RISK: Stripe Test Environment Key. Reveals testing pipelines and staging transaction data.';
        verdictColor = 'var(--accent-amber)';
      } else if (rawVal.startsWith('pk_')) {
        vulVerdict = 'ℹ️ PUBLIC CLIENT KEY: Publishable Stripe key (Intended for frontend Elements, not a direct vulnerability).';
        verdictColor = 'var(--accent-teal)';
      } else if (typeLower.includes('google') || rawVal.startsWith('AIza')) {
        vulVerdict = '⚠️ CLOUD KEY EXPOSURE: Google Cloud API Key. Vulnerable if unrestricted (can incur unauthorized API billing).';
        verdictColor = 'var(--accent-amber)';
      } else if (typeLower.includes('github') || rawVal.startsWith('ghp_')) {
        vulVerdict = '🚨 CRITICAL VULNERABILITY: GitHub Personal Access Token! Grants read/write access to private code repositories.';
        verdictColor = 'var(--accent-rose)';
      } else if (typeLower.includes('firebase')) {
        vulVerdict = '🚨 DATABASE EXPOSURE: Firebase Realtime Database. Vulnerable if /.json allows unauthenticated public read/write.';
        verdictColor = 'var(--accent-rose)';
      } else if (typeLower.includes('jwt') || rawVal.startsWith('eyJ')) {
        vulVerdict = 'ℹ️ AUTH TOKEN: Client-side JSON Web Token. Check claims, signature algorithm, and expiration.';
        verdictColor = 'var(--cyan)';
      }

      return `
        <div class="secret-card ${sevClass}" style="margin-bottom:8px; border:1px solid var(--border); border-left:3px solid ${verdictColor}; background:var(--bg-glass); border-radius:var(--radius-xs); padding:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-weight:800; font-size:9.5px; color:var(--text-main);">🔑 ${this.escape(sec.name || 'API Token')}</span>
            <span class="badge" style="background:${verdictColor}; color:#000; font-weight:800; font-size:7.5px;">${sev}</span>
          </div>

          <!-- DIRECT VULNERABILITY VERDICT BANNER -->
          <div style="background:rgba(0,0,0,0.35); border-left:2px solid ${verdictColor}; padding:4px 6px; margin:4px 0; font-size:7.5px; line-height:1.4; color:var(--text-main);">
            <b>Verdict:</b> ${this.escape(vulVerdict)}
          </div>

          <!-- MASKED / RAW VALUE BOX -->
          <div class="secret-raw" id="secVal_${idx}" style="font-family:var(--font-mono); font-size:8px; color:var(--cyan); word-break:break-all; padding:4px 6px; background:var(--bg-inset); border-radius:3px; margin:4px 0;">
            ${this.escape(maskedVal)}
          </div>

          <!-- ACTION BUTTONS -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <span style="font-size:7px; color:var(--text-faint);">Found: ${this.escape(timeStr)}</span>
            <div style="display:flex; gap:3px;">
              <button class="btn-sm-action toggle-sec" data-idx="${idx}" data-raw="${this.escape(rawVal)}" data-masked="${this.escape(maskedVal)}" title="Toggle Reveal / Hide">👁 Reveal</button>
              <button class="btn-sm-action copy-sec" data-val="${this.escape(rawVal)}" title="Copy Full Raw Key">📋 Copy</button>
              <button class="btn-sm-action verify-sec-btn" data-idx="${idx}" style="color:var(--cyan); border-color:rgba(56,189,248,0.4);" title="Directly check if this key is active or unrestricted">⚡ Verify Key</button>
            </div>
          </div>

          <!-- LIVE VERDICT RESULTS CONTAINER -->
          <div id="secVerdictBox_${idx}" style="margin-top:4px;"></div>

          <div style="font-size:6.5px; color:var(--text-muted); margin-top:4px; word-break:break-all;">
            <b>Source:</b> ${this.escape(sec.source || 'inline')}
          </div>
        </div>
      `;
    }).join('');

    // Attach toggle reveal & copy listeners
    list.querySelectorAll('.toggle-sec').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.idx;
        const valEl = document.getElementById(`secVal_${idx}`);
        if (valEl.textContent.trim() === btn.dataset.masked) {
          valEl.textContent = btn.dataset.raw;
          valEl.style.color = '#fca5a5';
          btn.textContent = '🔒 Hide';
        } else {
          valEl.textContent = btn.dataset.masked;
          valEl.style.color = 'var(--cyan)';
          btn.textContent = '👁 Reveal';
        }
      });
    });

    list.querySelectorAll('.copy-sec').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.val);
        btn.textContent = '✔ Copied!';
        setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
      });
    });

    // Attach ⚡ Verify Key Live listeners
    list.querySelectorAll('.verify-sec-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const sec = this.secrets[idx];
        const vBox = document.getElementById(`secVerdictBox_${idx}`);
        if (!sec || !vBox) return;

        btn.disabled = true;
        btn.textContent = '⏳ Testing...';
        vBox.innerHTML = '<div style="font-size:7px; color:var(--cyan);">⏳ Testing key validity & restrictions with target API...</div>';

        try {
          const res = await chrome.runtime.sendMessage({ action: 'verifySecretKey', secret: sec });
          const r = res?.result;
          if (r) {
            const isCrit = r.severity === 'CRITICAL';
            const color = isCrit ? 'var(--accent-rose)' : r.severity === 'LOW' ? 'var(--accent-teal)' : 'var(--accent-amber)';
            vBox.innerHTML = `
              <div style="background:var(--bg-inset); border:1px solid ${color}; border-radius:3px; padding:4px 6px; font-size:7px; line-height:1.4;">
                <div style="font-weight:800; color:${color}; font-size:8px;">${this.escape(r.verdict)}</div>
                <div style="color:var(--text-main); margin-top:2px;">${this.escape(r.details)}</div>
                ${r.remediation ? `<div style="color:var(--text-muted); margin-top:2px;"><b>Remediation:</b> ${this.escape(r.remediation)}</div>` : ''}
              </div>
            `;
            btn.textContent = '✔ Tested';
          } else {
            vBox.innerHTML = '<div style="font-size:7px; color:var(--accent-amber);">⚠️ Test completed without response data.</div>';
            btn.textContent = '⚡ Verify Key';
            btn.disabled = false;
          }
        } catch (e) {
          vBox.innerHTML = '<div style="font-size:7px; color:var(--accent-rose);">❌ ' + this.escape(e.message) + '</div>';
          btn.textContent = '⚡ Verify Key';
          btn.disabled = false;
        }
      });
    });
  }

  renderSniffer() {
    const list = document.getElementById('snifferList');
    if (!list) return;

    if (this.sniffedRequests.length === 0) {
      list.innerHTML = `<div class="empty">${this.isSniffing ? 'Listening for runtime requests... Click around the page!' : 'Sniffer inactive. Click "START SNIFFER" to intercept API calls.'}</div>`;
      return;
    }

    list.innerHTML = this.sniffedRequests.slice(0, 100).map(req => {
      let statusBadge = '';
      if (req.status) {
        const cls = req.status >= 200 && req.status < 300 ? 'status-ok' : (req.status >= 500 ? 'status-bad' : 'status-warn');
        statusBadge = `<span class="badge ${cls}">${req.status}</span>`;
      }
      const timeStr = req.timestamp ? new Date(req.timestamp).toLocaleTimeString() : '';
      return `
        <div class="sniff-item">
          <span class="badge ${(req.method || 'GET').toLowerCase()}">${req.method || 'GET'}</span>
          ${statusBadge}
          <span class="sniff-url" title="${this.escape(req.url)}">${this.escape(req.url)}</span>
          <div style="display:flex; gap:2px; flex-shrink:0;">
            <button class="btn btn-sm btn-repeater" data-url="${this.escape(req.url)}" data-method="${req.method || 'GET'}">🧪</button>
            <button class="btn btn-sm btn-curl" data-url="${this.escape(req.url)}" data-method="${req.method || 'GET'}">📋</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.btn-repeater').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openInRepeater(btn.dataset.url, btn.dataset.method);
      });
    });

    list.querySelectorAll('.btn-curl').forEach(btn => {
      btn.addEventListener('click', () => {
        const curlCmd = `curl -i -k -s -X ${btn.dataset.method} "${btn.dataset.url}"`;
        navigator.clipboard.writeText(curlCmd);
        btn.textContent = '✔';
        setTimeout(() => { btn.textContent = '📋'; }, 1500);
      });
    });
  }

  // ================================================================
  // 🤖 HEADLESS DOM WALKER (v4.0)
  // ================================================================

  async walkDOM() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id || tab.url.startsWith('chrome://')) {
        alert('Open an active target website first to perform SPA DOM walk.');
        return;
      }

      if (this.domWalkBtn) {
        this.domWalkBtn.disabled = true;
        this.domWalkBtn.textContent = '🤖 WALKING DOM...';
      }
      this.log('🤖 Triggering non-destructive SPA DOM Walker to surface dynamic APIs...', 'info');

      const res = await chrome.runtime.sendMessage({
        action: 'triggerDOMWalk',
        tabId: tab.id
      });

      if (this.domWalkBtn) {
        this.domWalkBtn.disabled = false;
        this.domWalkBtn.textContent = '🤖 WALK SPA';
      }

      if (res?.clickedCount !== undefined) {
        this.log(`✅ DOM Walk finished: safely clicked ${res.clickedCount} interactive elements`, 'success');
      } else {
        this.log('✅ DOM Walk initiated on active tab', 'success');
      }
    } catch (e) {
      if (this.domWalkBtn) {
        this.domWalkBtn.disabled = false;
        this.domWalkBtn.textContent = '🤖 WALK SPA';
      }
      this.log(`⚠️ DOM Walk notice: ${e.message}`, 'warning');
    }
  }

  // ================================================================
  // 🔌 WEBSOCKET & SSE FRAME MONITOR (v4.0)
  // ================================================================

  async loadWsFrames() {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'getWsFrames' });
      this.wsFrames = res?.frames || [];
      this.renderWsFrames();
    } catch (e) {}
  }

  addWsFrame(frame) {
    if (!frame) return;
    this.wsFrames.unshift(frame);
    if (this.wsFrames.length > 300) this.wsFrames.pop();
    if (this.wsCount) this.wsCount.textContent = this.wsFrames.length;
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.dataset.tab === 'ws') {
      this.renderWsFrames();
    }
  }

  async clearWsFrames() {
    try {
      await chrome.runtime.sendMessage({ action: 'clearWsFrames' });
      this.wsFrames = [];
      if (this.wsCount) this.wsCount.textContent = '0';
      this.renderWsFrames();
      this.log('🗑️ WebSocket/SSE event log cleared', 'info');
    } catch (e) {}
  }

  renderWsFrames() {
    if (!this.wsList) return;
    if (this.wsCount) this.wsCount.textContent = this.wsFrames.length;

    if (this.wsFrames.length === 0) {
      this.wsList.innerHTML = '<div class="empty">No WebSocket or SSE traffic captured yet.<br>Click "⚡ SNIFFER" and interact with real-time web applications.</div>';
      return;
    }

    this.wsList.innerHTML = this.wsFrames.map(f => {
      const isSend = f.direction === 'SEND';
      const isSSE = f.type === 'SSE';
      const badgeClass = isSSE ? 'status-pill' : (isSend ? 'status-warn' : 'status-ok');
      const typeLabel = isSSE ? 'SSE' : (isSend ? 'WS ⬆ SEND' : 'WS ⬇ RECV');
      const preview = typeof f.data === 'string' ? f.data : JSON.stringify(f.data);
      const timeStr = new Date(f.timestamp || Date.now()).toLocaleTimeString();

      return `
        <div class="endpoint-item" style="padding:6px 8px;">
          <div class="endpoint-header" style="margin-bottom:3px;">
            <span class="badge ${badgeClass}" style="font-size:7px;">${typeLabel}</span>
            <span style="font-size:7px; color:var(--text-faint); margin-left:6px;">${timeStr}</span>
            <span class="endpoint-url" style="margin-left:auto; font-size:7px; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${this.escape(f.url)}">${this.escape(f.url)}</span>
          </div>
          <pre style="margin:2px 0 0 0; padding:4px 6px; background:rgba(0,0,0,0.4); border-radius:3px; font-size:7.5px; color:#58a6ff; max-height:80px; overflow-y:auto; word-break:break-all; white-space:pre-wrap;">${this.escape(preview)}</pre>
        </div>
      `;
    }).join('');
  }

  renderPaths() {
    const list = document.getElementById('pathList');
    if (!list) return;

    if (this.paths.length === 0) {
      list.innerHTML = `<div class="empty">No paths discovered yet.</div>`;
      return;
    }

    list.innerHTML = this.paths.slice(0, 150).map(p => `
      <div style="font-size:8.5px; padding:2px 4px; border-bottom:1px solid rgba(88,166,255,0.04); color:var(--text-dim); word-break:break-all;">
        ${this.escape(p)}
      </div>
    `).join('');
  }

  // ================================================================
  // 📊 STATS
  // ================================================================

  updateStats() {
    const total = this.endpoints.length;
    const critical = this.endpoints.filter(e =>
      e.type === 'admin' || e.type === 'auth' || e.type === 'payment' || (e.vulnTags && e.vulnTags.length > 0)
    ).length;
    const high = this.endpoints.filter(e =>
      e.type === 'api' || e.type === 'graphql' || e.type === 'debug'
    ).length;

    const elTotal = document.getElementById('totalEndpoints');
    if (elTotal) elTotal.textContent = total;

    const elCrit = document.getElementById('criticalEndpoints');
    if (elCrit) elCrit.textContent = critical;

    const elHigh = document.getElementById('highEndpoints');
    if (elHigh) elHigh.textContent = high;

    const elPaths = document.getElementById('pathsFound');
    if (elPaths) elPaths.textContent = this.paths.length;

    const elSec = document.getElementById('secretsFound');
    if (elSec) elSec.textContent = this.secrets.length;

    const badgeSec = document.getElementById('secretsBadge');
    if (badgeSec) badgeSec.textContent = this.secrets.length;

    const vtabSec = document.getElementById('vtabSecretsBadge');
    if (vtabSec) vtabSec.textContent = this.secrets.length;

    const vtabEp = document.getElementById('vtabEndpointsBadge');
    if (vtabEp) vtabEp.textContent = this.endpoints.length;

    const vtabWs = document.getElementById('vtabWsBadge');
    if (vtabWs) vtabWs.textContent = this.wsFrames ? this.wsFrames.length : 0;
  }

  addEndpoint(ep) {
    if (!this.endpoints.find(e => e.url === ep.url)) {
      this.endpoints.push(ep);
      this.renderEndpoints();
      this.updateStats();
    }
  }

  addSecret(sec) {
    if (!sec) return;
    const val = sec.value || sec.raw;
    if (!val) return;
    sec.value = val;
    sec.raw = val;
    sec.masked = sec.masked || (val.length > 8 ? val.slice(0, 4) + '••••••••' + val.slice(-4) : '••••••••');
    sec.timestamp = sec.timestamp || Date.now();
    sec.foundAt = sec.foundAt || new Date().toLocaleTimeString();

    if (!this.secrets.find(s => (s.value || s.raw) === val)) {
      this.secrets.unshift(sec);
      this.renderSecrets();
      this.updateStats();
    }
  }

  addLiveStripItem(text) {
    const strip = document.getElementById('liveStripList');
    if (!strip) return;
    const item = document.createElement('div');
    item.className = 'live-strip-item';
    item.textContent = `${new Date().toLocaleTimeString()} ${text}`;
    strip.prepend(item);
    if (strip.children.length > 25) {
      strip.removeChild(strip.lastChild);
    }
  }

  // ================================================================
  // 📝 LOGS
  // ================================================================

  log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const container = document.getElementById('logContainer');
    if (!container) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="time">[${time}]</span><span class="msg ${type}">${this.escape(msg)}</span>`;
    container.prepend(entry);
    this.addLiveStripItem(msg);
  }

  async loadLogs() {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'getLogs' });
      if (res?.logs && Array.isArray(res.logs)) {
        const container = document.getElementById('logContainer');
        if (!container) return;
        container.innerHTML = res.logs.map(l =>
          `<div class="log-entry"><span class="time">[${l.time}]</span><span class="msg ${l.type}">${this.escape(l.message)}</span></div>`
        ).join('');
      }
    } catch (e) {}
  }

  // ================================================================
  // ⚙️ SETTINGS
  // ================================================================

  async loadSettings() {
    try {
      const tgRes = await chrome.runtime.sendMessage({ action: 'getTelegramConfig' });
      if (tgRes?.config) {
        if (this.telegramTokenInput) this.telegramTokenInput.value = tgRes.config.token || '';
        if (this.telegramChatIdInput) this.telegramChatIdInput.value = tgRes.config.chatId || '';
        if (this.telegramEnabledInput) this.telegramEnabledInput.checked = !!tgRes.config.enabled;
      }

      const whRes = await chrome.runtime.sendMessage({ action: 'getWebhookConfig' });
      if (whRes?.config) {
        if (this.discordWebhookInput) this.discordWebhookInput.value = whRes.config.discord || '';
        if (this.discordEnabledInput) this.discordEnabledInput.checked = !!whRes.config.discordEnabled;
        if (this.slackWebhookInput) this.slackWebhookInput.value = whRes.config.slack || '';
        if (this.slackEnabledInput) this.slackEnabledInput.checked = !!whRes.config.slackEnabled;
      }

      const crawlRes = await chrome.runtime.sendMessage({ action: 'getCrawlConfig' });
      if (crawlRes?.config) {
        if (this.maxPagesInput) this.maxPagesInput.value = crawlRes.config.maxPages || 999999;
        if (this.maxDepthInput) this.maxDepthInput.value = crawlRes.config.maxDepth || 999;
        if (this.stealthModeInput) this.stealthModeInput.checked = crawlRes.config.stealthMode !== false;
        if (this.followExternalInput) this.followExternalInput.checked = !!crawlRes.config.followExternal;
      }
    } catch (e) {}
  }


  async exportAllAsZip() {
    this.log('📦 Compiling complete domain ZIP archive (all findings & reports)...', 'info');
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'exportAllAsZip' });
      if (resp && resp.success) {
        this.log('✅ Exported domain ZIP archive: ' + (resp.filename || 'recon_<domain>_full_audit.zip'), 'success');
      } else {
        this.log('❌ ZIP Export error: ' + (resp?.error || 'Unknown error'), 'error');
      }
    } catch (e) {
      this.log('❌ ZIP Export error: ' + e.message, 'error');
    }
  }

  async sendTelegramReportNow() {
    this.log('🚀 Generating domain ZIP & dispatching Telegram alert...', 'info');
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'sendTelegramReport' });
      if (resp && resp.success) {
        this.log('✅ Telegram alert & domain ZIP (' + (resp.filename || 'recon_audit.zip') + ') dispatched successfully!', 'success');
      } else {
        this.log('⚠️ Telegram alert note: ' + (resp?.error || resp?.reason || 'Check Telegram settings & logs'), 'warning');
      }
    } catch (e) {
      this.log('❌ Telegram dispatch error: ' + e.message, 'error');
    }
  }


  async toggleSentinel() {
    try {
      const enabled = this.sentinelToggle ? this.sentinelToggle.checked : false;
      await chrome.runtime.sendMessage({
        action: 'setSentinelConfig',
        config: { enabled }
      });
      if (this.sentinelStateLabel) {
        this.sentinelStateLabel.textContent = enabled ? '⚡ ACTIVE' : 'OFF';
        this.sentinelStateLabel.style.color = enabled ? '#38bdf8' : 'var(--text-muted)';
      }
      // Notify active tab
      const tab = await this.getTargetWebTab();
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'setSnifferState',
          active: enabled
        }).catch(() => {});
      }
      this.log(enabled ? '🛡️ Silent Background Sentinel ACTIVE (Zero User Interruption)' : '🛡️ Background Sentinel PAUSED', enabled ? 'success' : 'info');
    } catch (e) {
      this.log('❌ Sentinel toggle error: ' + e.message, 'error');
    }
  }

  async loadSentinelSettings() {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'getSentinelConfig' });
      if (res && res.config) {
        const enabled = !!res.config.enabled;
        if (this.sentinelToggle) this.sentinelToggle.checked = enabled;
        if (this.sentinelStateLabel) {
          this.sentinelStateLabel.textContent = enabled ? '⚡ ACTIVE' : 'OFF';
          this.sentinelStateLabel.style.color = enabled ? '#38bdf8' : 'var(--text-muted)';
        }
      }
    } catch (e) {}
  }

  async saveTelegramSettings() {
    const config = {
      token: this.telegramTokenInput ? this.telegramTokenInput.value.trim() : '',
      chatId: this.telegramChatIdInput ? this.telegramChatIdInput.value.trim() : '',
      enabled: this.telegramEnabledInput ? this.telegramEnabledInput.checked : false
    };
    await chrome.runtime.sendMessage({ action: 'setTelegramConfig', config });
    this.log('💾 Telegram configuration saved', 'success');
  }

  async saveWebhookSettings() {
    const config = {
      discord: this.discordWebhookInput ? this.discordWebhookInput.value.trim() : '',
      discordEnabled: this.discordEnabledInput ? this.discordEnabledInput.checked : false,
      slack: this.slackWebhookInput ? this.slackWebhookInput.value.trim() : '',
      slackEnabled: this.slackEnabledInput ? this.slackEnabledInput.checked : false
    };
    await chrome.runtime.sendMessage({ action: 'setWebhookConfig', config });
    this.log('💾 Discord & Slack webhook settings saved', 'success');
  }

  async saveCrawlSettings() {
    const config = {
      maxPages: parseInt(this.maxPagesInput ? this.maxPagesInput.value : '999999'),
      maxDepth: parseInt(this.maxDepthInput ? this.maxDepthInput.value : '999'),
      stealthMode: this.stealthModeInput ? this.stealthModeInput.checked : true,
      followExternal: this.followExternalInput ? this.followExternalInput.checked : false
    };
    await chrome.runtime.sendMessage({ action: 'setCrawlConfig', config });
    this.log('💾 Crawl configuration saved', 'success');
  }

  // ================================================================
  // 🔁 STATUS UPDATER
  // ================================================================

  startStatusCheck() {
    if (this.statusInterval) clearInterval(this.statusInterval);
    this.statusInterval = setInterval(async () => {
      try {
        const s = await chrome.runtime.sendMessage({ action: 'getStats' });
        if (s?.stats) {
          if (s.stats.isRunning) {
            this.updateButtonState('scanning');
          } else if (s.stats.isPaused) {
            this.updateButtonState('paused');
          } else {
            this.updateButtonState('idle');
            clearInterval(this.statusInterval);
            this.statusInterval = null;
          }
        }
      } catch (e) {}
    }, 2000);
  }

  startRealtimeUpdates() {
    setInterval(async () => {
      try {
        const s = await chrome.runtime.sendMessage({ action: 'getStats' });
        if (s?.stats) {
          const stats = s.stats;
          const pagesScanned = document.getElementById('pagesScanned');
          if (pagesScanned) pagesScanned.textContent = stats.totalPages || 0;
          const queueSize = document.getElementById('queueSize');
          if (queueSize) queueSize.textContent = stats.queueSize || 0;
          if (stats.currentUrl && stats.currentUrl !== 'None') {
            const curUrl = document.getElementById('currentUrl');
            if (curUrl) curUrl.textContent = '📍 ' + stats.currentUrl;
          }
          if (stats.startTime) {
            const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
            const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
            const seconds = String(elapsed % 60).padStart(2, '0');
            const scanTime = document.getElementById('scanTime');
            if (scanTime) scanTime.textContent = `${hours}:${minutes}:${seconds}`;
          }
        }
      } catch (e) {}
    }, 2000);
  }

  escape(t) {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  // ================================================================
  // 📦 V8.0 EXPORT BURP XML & EXECUTIVE SUMMARY
  // ================================================================
  async exportBurpXml() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportBurpXml' });
      this.log('📦 Exporting Burp Suite Site Map XML (burp_sitemap.xml)...', 'info');
    } catch (e) {
      this.log('❌ Burp XML export error: ' + e.message, 'error');
    }
  }

  async exportExecutiveSummary() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportExecutiveSummary' });
      this.log('📝 Exporting Markdown Executive Summary Report...', 'info');
    } catch (e) {
      this.log('❌ Executive summary export error: ' + e.message, 'error');
    }
  }

  // ================================================================
  // 🔬 V8.0 SECURITY PLAYGROUND & ENTROPY LAB
  // ================================================================
  initPlaygroundTab() {}

  async runCustomRegex() {
    const pattern = (document.getElementById('regexPatternInput')?.value || '').trim();
    const box = document.getElementById('regexMatchesBox');
    if (!pattern) {
      alert('Please enter a regular expression pattern.');
      return;
    }
    if (box) box.innerHTML = '<span style="color:var(--cyan);">Scanning crawled routes and secrets...</span>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'runCustomRegex', pattern });
      const r = res?.result;
      if (r && box) {
        if (r.error) {
          box.innerHTML = '<span style="color:var(--accent-rose);">❌ Invalid Regex: ' + r.error + '</span>';
        } else if (r.totalMatches === 0) {
          box.innerHTML = '<span style="color:var(--text-muted);">No matches found across discovered targets.</span>';
        } else {
          box.innerHTML = '<div style="color:var(--accent-emerald); font-weight:700; margin-bottom:2px;">Found ' + r.totalMatches + ' matches:</div>' +
            r.matches.map(m => '<div style="color:var(--cyan); font-family:var(--font-mono);">' + m.match + '</div>').join('');
        }
      }
    } catch (e) {
      if (box) box.innerHTML = '<span style="color:var(--accent-rose);">Err</span>';
    }
  }

  async calcEntropy() {
    const text = (document.getElementById('entropyInputText')?.value || '').trim();
    const box = document.getElementById('entropyScoreBox');
    if (!text) {
      alert('Please enter text to calculate Shannon Entropy.');
      return;
    }

    try {
      const res = await chrome.runtime.sendMessage({ action: 'calculateEntropy', text });
      const r = res?.result;
      if (r && box) {
        const col = r.entropy >= 5.5 ? 'var(--accent-rose)' : r.entropy >= 4.0 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
        box.innerHTML = `
          <div style="font-weight:800; color:${col};">Entropy Score: ${r.entropy} / 8.0 (${r.category})</div>
          <div style="font-size:7.5px; color:var(--text-muted); margin-top:2px;">💡 ${r.recommendation}</div>
        `;
      }
    } catch (e) {
      if (box) box.innerHTML = '<span style="color:var(--accent-rose);">Err</span>';
    }
  }

  // ================================================================
  // 🏗️ V8.0 STACK FINGERPRINT & POLICY EVALUATOR
  // ================================================================
  initFingerprintTab() {
    this.detectTechStack();
  }

  async detectTechStack() {
    const box = document.getElementById('stackFindingsBox');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl || !activeUrl.startsWith('http')) return;
      if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Fingerprinting web servers, frameworks & languages...</div>';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'fingerprintTech', url: activeUrl });
        const r = res?.result;
        if (r && box) {
          if (!r.technologies || r.technologies.length === 0) {
            box.innerHTML = '<div style="color:var(--text-muted);">No distinct server headers or frontend framework markers uncovered.</div>';
          } else {
            box.innerHTML = r.technologies.map(t => `
              <div style="background:var(--bg-glass); border-left:2px solid var(--accent-emerald); padding:4px 6px; margin-bottom:4px; border-radius:2px;">
                <div style="font-weight:700; color:var(--accent-emerald);">${t.name} <span style="font-size:7px; color:var(--text-muted); font-weight:normal;">(${t.category})</span></div>
                ${t.version ? `<div style="font-family:var(--font-mono); font-size:7px; color:var(--text-muted);">${t.version}</div>` : ''}
              </div>
            `).join('');
          }
        }
      } catch (e) {
        if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    });
  }

  async auditCookies() {
    const box = document.getElementById('stackFindingsBox');
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Auditing cookies for HttpOnly, Secure & SameSite hygiene...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'auditCookies' });
      const r = res?.result;
      if (r && box) {
        if (!r.findings || r.findings.length === 0) {
          box.innerHTML = '<div style="color:var(--accent-emerald);">✅ No cookies set for the active domain.</div>';
        } else {
          box.innerHTML = `<div style="font-weight:800; color:var(--accent-amber); margin-bottom:4px;">🍪 ${r.vulnerableCount} of ${r.totalAudited} cookies missing security flags:</div>` +
            r.findings.map(c => `
              <div style="background:var(--bg-glass); border-left:2px solid ${c.isVulnerable ? 'var(--accent-rose)' : 'var(--accent-emerald)'}; padding:4px 6px; margin-bottom:4px; border-radius:2px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:700; font-family:var(--font-mono); color:var(--cyan);">${c.name}</span>
                  <span style="font-size:7px; color:var(--text-muted);">SameSite=${c.sameSite}</span>
                </div>
                ${c.issues.map(iss => `<div style="color:var(--accent-rose); font-size:7px;">⚠️ ${iss}</div>`).join('')}
              </div>
            `).join('');
        }
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async parseRobots() {
    const box = document.getElementById('stackFindingsBox');
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Fetching and parsing robots.txt...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'parseRobotsTxt' });
      const r = res?.result;
      if (r && box) {
        if (!r.found) {
          box.innerHTML = '<div style="color:var(--text-muted);">robots.txt not found (HTTP 404).</div>';
        } else {
          box.innerHTML = `
            <div style="font-weight:800; color:var(--accent-emerald); margin-bottom:4px;">🤖 Found ${r.disallowedCount} Disallowed Paths (Added to Endpoints):</div>
            <div style="font-family:var(--font-mono); font-size:7.5px; color:var(--cyan);">
              ${r.disallowed.map(p => '<div>🚫 ' + p + '</div>').join('')}
            </div>
          `;
          this.load();
        }
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async evalCSPBypasses() {
    const box = document.getElementById('stackFindingsBox');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl) return;
      if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Evaluating CSP directives against CDN bypass catalogs...</div>';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'evaluateCSPBypasses', url: activeUrl });
        const r = res?.result;
        if (r && box) {
          if (!r.hasCsp) {
            box.innerHTML = '<div style="color:var(--accent-rose); font-weight:700;">⚠️ No Content Security Policy detected! Full XSS exposure.</div>';
          } else if (r.bypassFound) {
            box.innerHTML = `
              <div style="color:var(--accent-rose); font-weight:800; margin-bottom:4px;">🚨 Known CSP Bypasses Detected in script-src!</div>
              ${r.bypasses.map(b => `
                <div style="background:var(--bg-glass); border-left:2px solid var(--accent-rose); padding:4px 6px; margin-bottom:4px;">
                  <b>${b.cdn}</b>: ${b.reason}
                </div>
              `).join('')}
            `;
          } else {
            box.innerHTML = '<div style="color:var(--accent-emerald); font-weight:700;">✅ Safe: No standard vulnerable CDN endpoints permitted in script-src directive.</div>';
          }
        }
      } catch (e) {
        if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    });
  }


  // ================================================================
  // 📐 V9.0 SCHEMA FUZZER, DEEP AUDIT+ & MULTI-ROLE SESSIONS
  // ================================================================

  async exportPostmanEnvironment() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportPostmanEnvironment' });
      this.log('🌐 Exporting Postman Environment JSON...', 'info');
    } catch (e) {
      this.log('❌ Postman Environment export error: ' + e.message, 'error');
    }
  }

  async generateSchemaVectors() {
    const param = (document.getElementById('schemaParamInput')?.value || 'id').trim();
    const type = document.getElementById('schemaTypeSelect')?.value || 'string';
    const box = document.getElementById('schemaVectorsBox');
    if (!box) return;

    box.innerHTML = '<div style="color:var(--cyan);">⏳ Generating boundary & edge-case test vectors...</div>';
    try {
      const res = await chrome.runtime.sendMessage({
        action: 'generateSchemaVectors',
        param,
        type
      });

      const r = res?.result;
      if (!r || !r.vectors || r.vectors.length === 0) {
        box.innerHTML = '<div class="empty">No vectors generated for this type.</div>';
        return;
      }

      box.innerHTML = `
        <div style="color:var(--cyan); font-weight:700; margin-bottom:6px;">
          Generated ${r.totalVectors} Boundary Vectors for Parameter: "${this.escape(r.param)}" (${r.type.toUpperCase()})
        </div>
        ${r.vectors.map(v => `
          <div style="background:var(--bg-glass); border:1px solid var(--border); border-radius:var(--radius-xs); padding:4px 6px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; color:${v.risk === 'CRITICAL' ? 'var(--accent-rose)' : v.risk === 'HIGH' ? 'var(--accent-amber)' : 'var(--text-main)'};">
                ${this.escape(v.name)} <span class="badge" style="font-size:7px;">${v.risk}</span>
              </div>
              <div style="color:var(--text-muted); font-size:7px;">${this.escape(v.rationale)}</div>
              <code style="color:var(--cyan); font-family:var(--font-mono); font-size:7.5px; word-break:break-all;">${this.escape(v.payload)}</code>
            </div>
            <div style="display:flex; gap:3px;">
              <button class="btn-sm-action copy-vector-btn" data-payload="${this.escape(v.payload)}">Copy</button>
            </div>
          </div>
        `).join('')}
      `;

      box.querySelectorAll('.copy-vector-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const payload = e.target.getAttribute('data-payload');
          navigator.clipboard.writeText(payload);
          e.target.innerText = 'Copied!';
          setTimeout(() => { e.target.innerText = 'Copy'; }, 1000);
        });
      });
    } catch (e) {
      box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async auditSRI() {
    const box = document.getElementById('auditPlusBox');
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Scanning DOM for external scripts lacking Subresource Integrity...</div>';

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs && tabs[0] ? tabs[0].id : null;
      if (!tabId) return;

      try {
        const res = await chrome.tabs.sendMessage(tabId, { action: 'auditSRI' });
        if (!res || !res.success) {
          if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ Failed to inspect scripts on active page.</div>';
          return;
        }

        if (box) {
          box.innerHTML = `
            <div style="font-weight:800; color:var(--accent-purple); margin-bottom:4px;">
              🛡️ Subresource Integrity (SRI) Report
            </div>
            <div style="margin-bottom:6px; color:var(--text-muted);">
              Total External Resources: ${res.externalCount} | Missing SRI Hashes: ${res.missingSriCount}
            </div>
            ${res.missingSri.length === 0 ? `
              <div style="color:var(--accent-emerald); font-weight:700;">✅ Safe: All external script & stylesheet dependencies enforce Subresource Integrity!</div>
            ` : res.missingSri.map(item => `
              <div style="background:var(--bg-glass); border-left:2px solid var(--accent-amber); padding:4px 6px; margin-bottom:4px;">
                <div style="color:var(--accent-amber); font-weight:700;">⚠️ Missing SRI Hash</div>
                <div style="font-family:var(--font-mono); font-size:7px; word-break:break-all;">${this.escape(item.src || item.href)}</div>
              </div>
            `).join('')}
          `;
        }
      } catch (e) {
        if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    });
  }

  async probeCRLF() {
    const box = document.getElementById('auditPlusBox');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl) return;
      if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Testing parameter reflection for CRLF response splitting...</div>';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'probeCRLF', url: activeUrl });
        const r = res?.result;
        if (r && box) {
          box.innerHTML = `
            <div style="font-weight:800; color:${r.isVulnerable ? 'var(--accent-rose)' : 'var(--accent-emerald)'}; margin-bottom:4px;">
              ${r.isVulnerable ? '🚨 CRLF Header Injection Confirmed!' : '✅ CRLF Sanitization Verified'}
            </div>
            <div style="color:var(--text-muted); font-size:7.5px; margin-bottom:4px;">${this.escape(r.details)}</div>
            <div style="font-family:var(--font-mono); font-size:7px; color:var(--text-faint);">Tested: ${this.escape(r.testedUrl)}</div>
          `;
        }
      } catch (e) {
        if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    });
  }

  async harvestForms() {
    const box = document.getElementById('auditPlusBox');
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Harvesting forms & verifying anti-CSRF protection...</div>';

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs && tabs[0] ? tabs[0].id : null;
      if (!tabId) return;

      try {
        const res = await chrome.tabs.sendMessage(tabId, { action: 'harvestHiddenFields' });
        if (!res || !res.success) {
          if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ Failed to inspect forms.</div>';
          return;
        }

        if (box) {
          box.innerHTML = `
            <div style="font-weight:800; color:var(--accent-purple); margin-bottom:4px;">
              📥 Form & CSRF Token Posture
            </div>
            <div style="margin-bottom:6px; color:var(--text-muted);">
              Total Forms: ${res.totalForms} | Forms Lacking CSRF Tokens: ${res.formsWithIssues}
            </div>
            ${res.forms.map(f => `
              <div style="background:var(--bg-glass); border-left:2px solid ${f.csrfWarning ? 'var(--accent-rose)' : 'var(--accent-emerald)'}; padding:4px 6px; margin-bottom:4px;">
                <div style="font-weight:700;">
                  Form #${f.formIndex} [${f.method}] -> ${this.escape(f.action)}
                  ${f.csrfWarning ? '<span class="badge" style="background:var(--accent-rose); color:#000; margin-left:4px;">NO CSRF TOKEN</span>' : ''}
                </div>
                <div style="color:var(--text-muted); font-size:7px;">Hidden inputs: ${f.hiddenCount}</div>
                ${f.hiddenInputs.map(inp => `
                  <div style="font-family:var(--font-mono); font-size:7px; color:var(--cyan);">
                    • ${this.escape(inp.name)} = "${this.escape(inp.value.slice(0, 30))}${inp.value.length > 30 ? '...' : ''}"
                  </div>
                `).join('')}
              </div>
            `).join('')}
          `;
        }
      } catch (e) {
        if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    });
  }

  async auditCrypto() {
    const box = document.getElementById('auditPlusBox');
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Auditing loaded scripts for weak client-side cryptography...</div>';

    try {
      const endpoints = this.endpoints || [];
      const jsUrls = endpoints.filter(e => e.url.endsWith('.js')).slice(0, 5).map(e => e.url);
      
      const scriptTexts = [];
      for (const url of jsUrls) {
        try {
          const resp = await fetch(url);
          if (resp.ok) scriptTexts.push(await resp.text());
        } catch (e) {}
      }

      const res = await chrome.runtime.sendMessage({ action: 'auditClientCrypto', scripts: scriptTexts });
      const r = res?.result;

      if (r && box) {
        box.innerHTML = `
          <div style="font-weight:800; color:var(--accent-purple); margin-bottom:4px;">
            🔐 Client-Side Cryptographic Audit
          </div>
          <div style="margin-bottom:6px; color:var(--text-muted);">
            Scripts Analyzed: ${r.totalScriptsAnalyzed} | Cryptographic Weaknesses: ${r.vulnerabilityCount}
          </div>
          ${r.findings.length === 0 ? `
            <div style="color:var(--accent-emerald); font-weight:700;">✅ Clean: No Math.random tokens, weak MD5/SHA-1, or hardcoded AES keys detected!</div>
          ` : r.findings.map(f => `
            <div style="background:var(--bg-glass); border-left:2px solid var(--accent-rose); padding:4px 6px; margin-bottom:4px;">
              <div style="color:var(--accent-rose); font-weight:700;">${this.escape(f.type)}</div>
              <div style="font-family:var(--font-mono); font-size:7px; color:var(--text-main);">${this.escape(f.snippet)}</div>
              <div style="color:var(--text-muted); font-size:7px;">Recommendation: ${this.escape(f.recommendation)}</div>
            </div>
          `).join('')}
        `;
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async harvestDeepLinks() {
    const box = document.getElementById('auditPlusBox');
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Searching for mobile deep link schemes & universal links...</div>';

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs && tabs[0] ? tabs[0].id : null;
      if (!tabId) return;

      try {
        const res = await chrome.tabs.sendMessage(tabId, { action: 'harvestDeepLinksDOM' });
        if (!res || !res.success) {
          if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ Failed to harvest deep links.</div>';
          return;
        }

        if (box) {
          box.innerHTML = `
            <div style="font-weight:800; color:var(--accent-purple); margin-bottom:4px;">
              📱 Discovered Mobile Deep Link Schemes
            </div>
            <div style="margin-bottom:6px; color:var(--text-muted);">
              Total Deep Links: ${res.totalDeepLinks}
            </div>
            ${res.deepLinks.length === 0 ? `
              <div style="color:var(--text-muted);">No custom deep link schemes (slack://, intent://) found in DOM anchors.</div>
            ` : res.deepLinks.map(dl => `
              <div style="background:var(--bg-glass); border-left:2px solid var(--cyan); padding:4px 6px; margin-bottom:4px;">
                <div style="font-weight:700; color:var(--cyan);">Scheme: ${this.escape(dl.scheme)}://</div>
                <div style="font-family:var(--font-mono); font-size:7px; word-break:break-all;">${this.escape(dl.raw)}</div>
              </div>
            `).join('')}
          `;
        }
      } catch (e) {
        if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    });
  }

  async probeEnvLeaks() {
    const box = document.getElementById('auditPlusBox');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl) return;
      if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Probing .env, .git/config, docker-compose on origin...</div>';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'probeEnvLeaks', url: activeUrl });
        const r = res?.result;
        if (r && box) {
          box.innerHTML = `
            <div style="font-weight:800; color:${r.exposedCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}; margin-bottom:4px;">
              📁 Configuration & Environment File Prober
            </div>
            <div style="margin-bottom:6px; color:var(--text-muted);">
              Total Probed: ${r.totalProbed} | Verified Leaks: ${r.exposedCount}
            </div>
            ${r.findings.length === 0 ? `
              <div style="color:var(--accent-emerald); font-weight:700;">✅ Clean: No exposed .env, .git/config, or docker-compose files discovered!</div>
            ` : r.findings.map(f => `
              <div style="background:var(--bg-glass); border-left:2px solid var(--accent-rose); padding:4px 6px; margin-bottom:4px;">
                <div style="color:var(--accent-rose); font-weight:700;">🚨 EXPOSED: ${this.escape(f.type)}</div>
                <div style="font-family:var(--font-mono); font-size:7px; word-break:break-all;">URL: ${this.escape(f.url)} [Status: ${f.statusCode}]</div>
                <div style="font-family:var(--font-mono); font-size:6.5px; color:var(--text-muted);">Snippet: ${this.escape(f.snippet)}</div>
              </div>
            `).join('')}
          `;
        }
      } catch (e) {
        if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    });
  }

  async switchSessionProfile(roleName) {
    const badge = document.getElementById('activeProfileBadge');
    const textarea = document.getElementById('profileHeadersTextarea');
    try {
      await chrome.runtime.sendMessage({ action: 'setActiveSessionProfile', name: roleName });
      const res = await chrome.runtime.sendMessage({ action: 'getSessionProfiles' });
      const p = res?.result?.profiles?.[roleName];
      if (badge) badge.innerText = 'Active: ' + roleName;
      if (textarea && p) {
        textarea.value = JSON.stringify(p.headers, null, 2);
      }
      this.log('👥 Switched active session profile to: ' + roleName, 'info');
    } catch (e) {
      this.log('❌ Switch session error: ' + e.message, 'error');
    }
  }

  async saveSessionProfile() {
    const badge = document.getElementById('activeProfileBadge');
    const textarea = document.getElementById('profileHeadersTextarea');
    const roleName = badge?.innerText.replace('Active: ', '').trim() || 'Admin';

    try {
      let headers = {};
      try {
        headers = JSON.parse(textarea.value);
      } catch (e) {
        textarea.value.split('\n').forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) headers[parts[0].trim()] = parts.slice(1).join(':').trim();
        });
      }

      await chrome.runtime.sendMessage({
        action: 'setSessionProfile',
        name: roleName,
        headers,
        description: 'Custom profile for ' + roleName
      });
      this.log('💾 Saved profile headers for: ' + roleName, 'success');
    } catch (e) {
      this.log('❌ Save profile error: ' + e.message, 'error');
    }
  }

  async applySessionProfileToRepeater() {
    const textarea = document.getElementById('profileHeadersTextarea');
    const repeaterHeaders = document.getElementById('repeaterHeaders');
    if (textarea && repeaterHeaders) {
      repeaterHeaders.value = textarea.value;
      this.log('🧪 Applied active session headers to Mini-Repeater', 'success');
    }
  }

  // ================================================================
  // 🎖️ V10.0 ENTERPRISE SCORECARD, MITRE, TOPOLOGY & ORCHESTRATOR
  // ================================================================

  async exportComplianceReport() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportComplianceReport' });
      this.log('📋 Exporting Enterprise Compliance Audit Report...', 'info');
    } catch (e) {
      this.log('❌ Compliance export error: ' + e.message, 'error');
    }
  }

  async exportCLIPipelineScript() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportCLIPipelineScript' });
      this.log('💻 Exporting CLI Automation Pipeline (recon_pipeline.sh)...', 'info');
    } catch (e) {
      this.log('❌ CLI Pipeline export error: ' + e.message, 'error');
    }
  }

  async renderScorecard() {
    const box = document.getElementById('scorecardFindingsBox');
    const gradeDisplay = document.getElementById('scorecardGradeDisplay');
    const pointsDisplay = document.getElementById('scorecardPointsDisplay');
    const statusBadge = document.getElementById('scorecardStatusBadge');

    try {
      const res = await chrome.runtime.sendMessage({ action: 'getSecurityScorecard' });
      const r = res?.result;
      if (!r) return;

      if (gradeDisplay) {
        gradeDisplay.innerText = r.grade;
        gradeDisplay.style.color = r.gradeColor;
      }
      if (pointsDisplay) {
        pointsDisplay.innerText = `${r.totalRiskPoints} / 100`;
      }
      if (statusBadge) {
        statusBadge.innerText = r.postureStatus;
        statusBadge.style.background = r.gradeColor;
      }

      if (box) {
        if (r.findings.length === 0) {
          box.innerHTML = '<div style="color:var(--accent-emerald); font-weight:700;">✅ Pristine Attack Surface: No high-risk CVEs or exposed credentials detected.</div>';
        } else {
          box.innerHTML = r.findings.map(f => `
            <div style="background:var(--bg-glass); border-left:2px solid ${f.severity === 'CRITICAL' ? 'var(--accent-rose)' : 'var(--accent-amber)'}; padding:4px 6px; margin-bottom:4px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:700; color:var(--text-main);">${this.escape(f.name)}</span>
                <span class="badge" style="background:${f.severity === 'CRITICAL' ? 'var(--accent-rose)' : 'var(--accent-amber)'}; color:#000;">${f.severity}</span>
              </div>
              <div style="font-family:var(--font-mono); font-size:7px; color:var(--cyan); margin-top:2px;">${this.escape(f.cvss)}</div>
              <div style="font-size:7px; color:var(--text-muted);">Occurrences: ${f.count} | Impact: +${f.points} risk points</div>
            </div>
          `).join('');
        }
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async renderMitreMatrix() {
    const box = document.getElementById('mitreMatrixBox');
    if (!box) return;

    box.innerHTML = '<div style="color:var(--cyan);">⏳ Correlating findings against MITRE ATT&CK Enterprise Matrix...</div>';
    try {
      const res = await chrome.runtime.sendMessage({ action: 'getMitreMatrix' });
      const r = res?.result;
      if (!r || !r.techniques) return;

      box.innerHTML = `
        <div style="color:var(--accent-purple); font-weight:700; margin-bottom:6px;">
          Mapped ${r.totalTechniques} Techniques to MITRE ATT&CK Enterprise Matrix
        </div>
        ${r.techniques.map(t => `
          <div style="background:var(--bg-glass); border-left:2px solid var(--accent-purple); padding:4px 6px; margin-bottom:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:700; color:var(--text-main);">${t.id}: ${this.escape(t.name)}</span>
              <span class="badge" style="background:var(--accent-purple); color:#000;">${t.status}</span>
            </div>
            <div style="font-size:7px; color:var(--cyan); margin-top:2px;">${this.escape(t.tactic)}</div>
            <div style="font-size:7px; color:var(--text-muted); margin-top:1px;">${this.escape(t.details)}</div>
          </div>
        `).join('')}
      `;
    } catch (e) {
      box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async drawTopologyGraph() {
    const canvas = document.getElementById('topologyCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const res = await chrome.runtime.sendMessage({ action: 'getEndpointTopology' });
      const r = res?.result;
      const endpoints = r?.endpoints || [];
      const origin = r?.origin || 'target.com';

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Central Origin Node
      const centerX = width / 2;
      const centerY = height / 2;

      // Draw cluster categories
      const categories = ['/api', '/auth', '/admin', '/static', '/users', '/v1', '/v2'];
      const catCount = categories.length;

      // Group endpoints by category
      categories.forEach((cat, idx) => {
        const angle = (idx / catCount) * Math.PI * 2;
        const catRadius = 65;
        const catX = centerX + Math.cos(angle) * catRadius;
        const catY = centerY + Math.sin(angle) * catRadius;

        // Draw line from center to category
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(catX, catY);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw category node
        ctx.beginPath();
        ctx.arc(catX, catY, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#0e2238';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cat, catX, catY + 18);

        // Draw leaf nodes around category
        const leafCount = 3;
        for (let j = 0; j < leafCount; j++) {
          const leafAngle = angle + ((j - 1) * 0.35);
          const leafRadius = 32;
          const leafX = catX + Math.cos(leafAngle) * leafRadius;
          const leafY = catY + Math.sin(leafAngle) * leafRadius;

          ctx.beginPath();
          ctx.moveTo(catX, catY);
          ctx.lineTo(leafX, leafY);
          ctx.strokeStyle = 'rgba(45, 212, 191, 0.18)';
          ctx.lineWidth = 0.8;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(leafX, leafY, 4, 0, Math.PI * 2);
          ctx.fillStyle = j === 0 ? '#34d399' : j === 1 ? '#38bdf8' : '#fbbf24';
          ctx.fill();
        }
      });

      // Draw Center Origin Node
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#061325';
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(origin.slice(0, 14), centerX, centerY + 3);

      this.log('🌐 Rendered attack surface topology graph (' + endpoints.length + ' indexed nodes)', 'success');
    } catch (e) {
      this.log('❌ Topology render error: ' + e.message, 'error');
    }
  }

  async runZeroDayOrchestrator() {
    const box = document.getElementById('orchestratorResultsBox');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl) return;

      if (box) box.innerHTML = '<div style="color:var(--accent-rose); font-weight:800;">🚀 Executing unified multi-layer mission audit... (CORS, CRLF, Env files, Tech stack, CSP bypasses)</div>';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'runZeroDayOrchestrator', url: activeUrl });
        const r = res?.result;
        if (!r || !box) return;

        const m = r.modules;
        box.innerHTML = `
          <div style="font-weight:800; color:var(--cyan); margin-bottom:6px;">
            🎖️ Mission Audit Complete for: ${this.escape(r.origin)}
          </div>
          
          <div style="background:var(--bg-glass); border-left:2px solid var(--accent-emerald); padding:4px 6px; margin-bottom:4px;">
            <b>📁 Sensitive Config Prober:</b> ${m.envLeaks?.exposedCount > 0 ? '<span style="color:var(--accent-rose); font-weight:700;">' + m.envLeaks.exposedCount + ' Leaks Found</span>' : '<span style="color:var(--accent-emerald);">Secure</span>'}
          </div>

          <div style="background:var(--bg-glass); border-left:2px solid var(--accent-emerald); padding:4px 6px; margin-bottom:4px;">
            <b>✈️ CORS Preflight Simulator:</b> ${m.corsPreflight?.isVulnerable ? '<span style="color:var(--accent-rose); font-weight:700;">CORS Issue Detected</span>' : '<span style="color:var(--accent-emerald);">Origin Hardened</span>'}
          </div>

          <div style="background:var(--bg-glass); border-left:2px solid var(--accent-emerald); padding:4px 6px; margin-bottom:4px;">
            <b>💉 CRLF Response Splitting:</b> ${m.crlf?.isVulnerable ? '<span style="color:var(--accent-rose); font-weight:700;">Vulnerable</span>' : '<span style="color:var(--accent-emerald);">Sanitized</span>'}
          </div>

          <div style="background:var(--bg-glass); border-left:2px solid var(--accent-emerald); padding:4px 6px; margin-bottom:4px;">
            <b>🛡️ CSP Whitelist Bypasses:</b> ${m.cspBypass?.bypassFound ? '<span style="color:var(--accent-amber); font-weight:700;">CDN Whitelist Risk</span>' : '<span style="color:var(--accent-emerald);">No Bypass Known</span>'}
          </div>
        `;
        this.log('🎖️ Full mission audit completed successfully', 'success');
      } catch (e) {
        if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    });
  }

  // ================================================================
  // 📖 V7.0 EXPORT WORDLIST & NUCLEI TEMPLATE
  // ================================================================
  async exportWordlist() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportWordlist' });
      this.log('📖 Exporting contextual recon wordlist (wordlist.txt)...', 'info');
    } catch (e) {
      this.log('❌ Wordlist export error: ' + e.message, 'error');
    }
  }

  async exportNuclei() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportNucleiTemplate' });
      this.log('🧬 Exporting automated Nuclei YAML template...', 'info');
    } catch (e) {
      this.log('❌ Nuclei export error: ' + e.message, 'error');
    }
  }

  // ================================================================
  // ⚡ V7.0 CONCURRENT PROBER WORKER POOL
  // ================================================================
  async probeConcurrent() {
    this.log('⚡ Starting high-concurrency multi-worker status probe (8 threads)...', 'info');
    try {
      await chrome.runtime.sendMessage({ action: 'probeBatchConcurrent', concurrency: 8 });
      this.load();
    } catch (e) {
      this.log('❌ Concurrent probe error: ' + e.message, 'error');
    }
  }

  // ================================================================
  // 🎯 V7.0 REPEATER ACTIVE PROBERS (SSTI, SQLI, XXE)
  // ================================================================
  async probeSSTI() {
    const url = (document.getElementById('repeaterUrl')?.value || '').trim();
    const box = document.getElementById('repeaterResponseBox');
    if (!url) {
      alert('Please enter a target URL with query parameters in the Repeater.');
      return;
    }
    if (box) box.innerHTML = '<div style="color:var(--accent-amber);">⏳ Probing parameters with polyglot template injection vectors...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'probeSSTI', url });
      const r = res?.result;
      if (r && box) {
        if (r.isVulnerable) {
          box.innerHTML = r.findings.map(f => `
            <div style="background:rgba(244,63,94,0.15); border:1px solid var(--accent-rose); color:var(--accent-rose); padding:6px; border-radius:2px;">
              <b>🚨 ${f.message}</b>
              <div style="font-size:7.5px; color:var(--text-muted); margin-top:2px;">Injected: ${f.payload} | Evaluated To: ${f.evaluated}</div>
            </div>
          `).join('');
        } else {
          box.innerHTML = '<div style="color:var(--accent-emerald); font-weight:700;">✅ Safe: Injected template expressions were not evaluated by the backend.</div>';
        }
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async probeSQLi() {
    const url = (document.getElementById('repeaterUrl')?.value || '').trim();
    const box = document.getElementById('repeaterResponseBox');
    if (!url) {
      alert('Please enter a target URL in the Repeater.');
      return;
    }

    try {
      const u = new URL(url);
      const firstParam = Array.from(u.searchParams.keys())[0];
      if (!firstParam) {
        alert('URL has no query parameters to test for SQLi.');
        return;
      }

      if (box) box.innerHTML = `<div style="color:var(--accent-rose);">⏳ Testing parameter "${firstParam}" for SQL error disclosure and differential length...</div>`;

      const res = await chrome.runtime.sendMessage({ action: 'probeSQLi', url, param: firstParam });
      const r = res?.result;
      if (r && box) {
        const col = r.isVulnerable ? 'var(--accent-rose)' : 'var(--accent-emerald)';
        box.innerHTML = `
          <div style="font-family:var(--font-mono); font-size:8px;">
            <div style="font-weight:800; color:${col}; margin-bottom:4px;">[${r.severity}] ${r.message}</div>
            <div style="color:var(--text-muted);">Baseline HTTP: ${r.baselineStatus} | Injected HTTP: ${r.injectedStatus} | Length Δ: ${r.deltaBytes} bytes</div>
          </div>
        `;
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async probeXXE() {
    const url = (document.getElementById('repeaterUrl')?.value || '').trim();
    const box = document.getElementById('repeaterResponseBox');
    if (!url) {
      alert('Please enter an endpoint URL in the Repeater.');
      return;
    }
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Dispatching safe XML External Entity expansion probe...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'probeXXE', url });
      const r = res?.result;
      if (r && box) {
        const col = r.entityExpanded ? 'var(--accent-rose)' : 'var(--text-muted)';
        box.innerHTML = `
          <div style="font-family:var(--font-mono); font-size:8px;">
            <div style="font-weight:800; color:${col};">[${r.severity}] ${r.message}</div>
            <div style="color:var(--text-muted); margin-top:2px;">HTTP Status: ${r.status}</div>
          </div>
        `;
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  // ================================================================
  // 📊 V7.0 CHANGELOG & ROUTE DIFF CONTROLLER
  // ================================================================
  initChangelogTab() {}

  async saveSnapshot() {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'saveSnapshot' });
      if (res && res.snapshot) {
        alert(`Saved snapshot with ${res.snapshot.endpoints.length} routes at ${new Date().toLocaleTimeString()}!`);
      }
    } catch (e) {
      alert('Error saving snapshot: ' + e.message);
    }
  }

  async computeDiff() {
    const box = document.getElementById('changelogDiffBox');
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Computing attack surface route delta...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'computeChangelogDiff' });
      if (!res || !res.success || !res.diff) throw new Error(res?.error || 'Could not compute diff');

      const d = res.diff;
      let html = '<div style="font-family:var(--font-mono); font-size:8px;">';
      html += `<div style="display:flex; gap:12px; margin-bottom:6px; font-weight:800;">
        <span style="color:var(--accent-emerald);">+ ${d.addedCount} NEW ROUTES</span>
        <span style="color:var(--accent-rose);">- ${d.removedCount} REMOVED</span>
        <span style="color:var(--accent-amber);">~ ${d.changedCount} STATUS CHANGED</span>
      </div>`;

      if (d.added.length > 0) {
        html += '<div style="color:var(--accent-emerald); font-weight:800; margin-bottom:2px;">Newly Exposed Routes:</div>';
        d.added.forEach(ep => {
          html += `<div style="color:var(--accent-emerald); margin-bottom:2px;">+ [${ep.method}] ${ep.url}</div>`;
        });
      }

      if (d.removed.length > 0) {
        html += '<div style="color:var(--accent-rose); font-weight:800; margin-top:4px; margin-bottom:2px;">Hidden / Removed Routes:</div>';
        d.removed.forEach(ep => {
          html += `<div style="color:var(--accent-rose); margin-bottom:2px;">- [${ep.method}] ${ep.url}</div>`;
        });
      }

      if (d.added.length === 0 && d.removed.length === 0) {
        html += '<div style="color:var(--text-muted);">No route additions or deletions between the last two snapshots.</div>';
      }

      html += '</div>';
      if (box) box.innerHTML = html;
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  // ================================================================
  // 🌐 V7.0 SSRF CANDIDATE HARVESTER CONTROLLER
  // ================================================================
  async renderSSRFCandidates() {
    const list = document.getElementById('ssrfCandidatesList');
    if (!list) return;
    list.innerHTML = '<div style="color:var(--cyan);">⏳ Extracting candidate URL and fetch parameters...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'getSSRFCandidates' });
      const candidates = res?.candidates || [];

      if (candidates.length === 0) {
        list.innerHTML = '<div class="empty">No parameters matching SSRF candidate heuristics found across discovered endpoints.</div>';
        return;
      }

      list.innerHTML = candidates.map((c, i) => `
        <div style="background:var(--bg-glass); border:1px solid var(--border); border-radius:var(--radius-xs); padding:6px; margin-bottom:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <span style="font-weight:700; color:var(--accent-amber); font-size:8px;">Parameter: ${c.param}</span>
            <button class="btn-sm-action" style="font-size:7px;" id="sendSsrfRepeaterBtn_${i}">Send to Repeater</button>
          </div>
          <div style="font-family:var(--font-mono); font-size:7.5px; color:var(--cyan); word-break:break-all; margin-bottom:2px;">${c.url}</div>
          <div style="font-size:7px; color:var(--text-muted);">Test payloads: ${c.testPayloads.slice(0, 2).join(' | ')}</div>
        </div>
      `).join('');

      candidates.forEach((c, i) => {
        document.getElementById('sendSsrfRepeaterBtn_' + i)?.addEventListener('click', () => {
          this.sendToRepeater(c.url, 'GET');
        });
      });
    } catch (e) {
      list.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }


  // ================================================================
  // 📄 V6.0 EXPORT INTERACTIVE HTML REPORT
  // ================================================================
  async exportHTMLReport() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportHTMLReport' });
      this.log('📄 Exporting standalone Interactive HTML Recon Report (recon_report.html)...', 'info');
    } catch (e) {
      this.log('❌ HTML report export error: ' + e.message, 'error');
    }
  }

  // ================================================================
  // 🌸 V6.0 GRAPHQL BATCH & FIELD LEAKAGE CONTROLLERS
  // ================================================================
  async testGraphQLBatch() {
    const url = (document.getElementById('graphqlUrlInput')?.value || '').trim();
    const box = document.getElementById('graphqlSchemaBox');
    if (!url) {
      alert('Please specify a GraphQL endpoint URL.');
      return;
    }
    if (box) box.innerHTML = '<div style="color:var(--accent-amber);">⏳ Probing GraphQL batch query execution support...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'testGraphQLBatching', url });
      if (!res || !res.success || !res.result) throw new Error(res?.error || 'Batch test failed');
      const r = res.result;
      const col = r.batchSupported ? 'var(--accent-rose)' : 'var(--accent-emerald)';
      if (box) {
        box.innerHTML = `
          <div style="font-family:var(--font-mono); font-size:8px;">
            <div style="font-weight:800; color:${col}; margin-bottom:4px;">[${r.severity}] ${r.message}</div>
            <pre style="white-space:pre-wrap; background:var(--bg-elevated); padding:4px;">${JSON.stringify(r.response || {}, null, 2)}</pre>
          </div>
        `;
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async probeGraphQLFields() {
    const url = (document.getElementById('graphqlUrlInput')?.value || '').trim();
    const box = document.getElementById('graphqlSchemaBox');
    if (!url) {
      alert('Please specify a GraphQL endpoint URL.');
      return;
    }
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Probing GraphQL error suggestions for schema leaks...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'probeGraphQLFieldSuggestions', url });
      if (!res || !res.success || !res.result) throw new Error(res?.error || 'Field suggestions probe failed');
      const r = res.result;
      if (box) {
        box.innerHTML = `
          <div style="font-family:var(--font-mono); font-size:8px;">
            <div style="font-weight:800; color:var(--cyan); margin-bottom:4px;">🔍 GRAPHQL FIELD SUGGESTIONS LEAK</div>
            <div style="color:var(--text-main); margin-bottom:4px;">Discovered suggestions: ${r.suggestions.length > 0 ? r.suggestions.map(s => '<span class="badge" style="color:var(--cyan);">' + s + '</span>').join(' ') : 'None detected'}</div>
            <pre style="white-space:pre-wrap; background:var(--bg-elevated); padding:4px;">${JSON.stringify(r.rawErrors || [], null, 2)}</pre>
          </div>
        `;
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  // ================================================================
  // ⚡ V6.0 ADVANCED AUDITORS CONTROLLER
  // ================================================================
  initAdvancedTab() {
    const takeoverTarget = document.getElementById('takeoverTargetInput');
    if (takeoverTarget && !takeoverTarget.value) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          try {
            const u = new URL(tabs[0].url);
            takeoverTarget.value = u.hostname;
          } catch (e) {}
        }
      });
    }
  }

  async checkSubdomainTakeover() {
    const target = (document.getElementById('takeoverTargetInput')?.value || '').trim();
    const box = document.getElementById('takeoverResultBox');
    if (!target) {
      alert('Please enter a target domain/subdomain.');
      return;
    }
    if (box) box.innerHTML = '<div style="color:var(--cyan);">⏳ Inspecting DNS fingerprints for dangling pointers...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'checkSubdomainTakeover', target });
      if (!res || !res.success || !res.result) throw new Error(res?.error || 'Takeover probe failed');
      const r = res.result;
      const col = r.isVulnerable ? 'var(--accent-rose)' : 'var(--accent-emerald)';
      if (box) {
        box.innerHTML = `<div style="color:${col}; font-weight:700;">${r.message}</div>`;
      }
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async detectWAF() {
    const outBox = document.getElementById('advOutputBox');
    const badge = document.getElementById('advStatusBadge');

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl || !activeUrl.startsWith('http')) {
        alert('Active tab is not an HTTP/HTTPS URL.');
        return;
      }

      if (outBox) outBox.innerHTML = '<div style="color:var(--cyan);">⏳ Fingerprinting headers and server signatures...</div>';
      if (badge) badge.textContent = 'DETECTING';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'detectWAF', url: activeUrl });
        if (!res || !res.success || !res.result) throw new Error(res?.error || 'WAF detection failed');
        const r = res.result;
        if (badge) badge.textContent = r.detected ? 'WAF PRESENT' : 'NO WAF';

        if (outBox) {
          outBox.innerHTML = `
            <div style="font-weight:800; color:var(--cyan); margin-bottom:4px;">🛡️ WAF DETECTION RESULT</div>
            <div style="margin-bottom:2px;">Primary: <b style="color:var(--accent-amber);">${r.primaryWAF}</b></div>
            ${r.wafs.map(w => `<div style="color:var(--text-muted); font-size:7.5px;">• ${w.name} (${w.type}) [Confidence: ${w.confidence}]</div>`).join('')}
          `;
        }
      } catch (e) {
        if (outBox) outBox.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    });
  }

  async auditDOMXSS() {
    const outBox = document.getElementById('advOutputBox');
    const badge = document.getElementById('advStatusBadge');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (!activeTab || !activeTab.id) {
        alert('No active web page.');
        return;
      }

      if (outBox) outBox.innerHTML = '<div style="color:var(--cyan);">⏳ Auditing DOM sources & execution sinks...</div>';
      if (badge) badge.textContent = 'AUDITING';

      chrome.tabs.sendMessage(activeTab.id, { action: 'auditDOMXSS' }, (res) => {
        if (chrome.runtime.lastError || !res || !res.success) {
          if (outBox) outBox.innerHTML = '<div style="color:var(--accent-rose);">❌ DOM XSS audit failed. Refresh target tab.</div>';
          return;
        }

        const items = res.findings || [];
        if (badge) badge.textContent = items.length + ' SINKS';

        if (items.length === 0) {
          if (outBox) outBox.innerHTML = '<div style="color:var(--accent-emerald);">✅ No direct source-to-sink DOM XSS flows detected in inline scripts.</div>';
          return;
        }

        if (outBox) {
          outBox.innerHTML = items.map(f => `
            <div style="background:var(--bg-glass); border-left:2px solid var(--accent-rose); padding:3px 5px; margin-bottom:3px;">
              <div style="font-weight:700; color:var(--accent-rose);">💥 ${f.type}: ${f.source || f.param} ➔ ${f.sink || f.element}</div>
              <div style="color:var(--text-muted); font-size:7px;">${f.location || ''} ${f.snippet || ''}</div>
            </div>
          `).join('');
        }
      });
    });
  }

  async probeCachePoisoning() {
    const box = document.getElementById('cachePoisonResult');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl) return;
      if (box) box.innerHTML = '<span style="color:var(--cyan);">Probing unkeyed headers...</span>';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'probeCachePoisoning', url: activeUrl });
        const r = res?.result;
        if (r && box) {
          if (r.isPoisonable) {
            box.innerHTML = r.findings.map(f => `<div style="color:var(--accent-rose);">🚨 ${f.header} reflected!</div>`).join('');
          } else {
            box.innerHTML = '<span style="color:var(--accent-emerald);">✅ Safe: No unkeyed header reflection.</span>';
          }
        }
      } catch (e) {
        if (box) box.innerHTML = '<span style="color:var(--accent-rose);">Err</span>';
      }
    });
  }

  async probeOpenRedirect() {
    const box = document.getElementById('openRedirectResult');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl) return;
      if (box) box.innerHTML = '<span style="color:var(--cyan);">Scanning parameters...</span>';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'probeOpenRedirect', url: activeUrl });
        const r = res?.result;
        if (r && box) {
          if (r.isVulnerable) {
            box.innerHTML = r.findings.map(f => `<div style="color:var(--accent-rose); font-weight:700;">🚨 ${f.param} ➔ ${f.location}</div>`).join('');
          } else {
            box.innerHTML = '<span style="color:var(--text-muted);">' + (r.message || 'No redirect detected') + '</span>';
          }
        }
      } catch (e) {
        if (box) box.innerHTML = '<span style="color:var(--accent-rose);">Err</span>';
      }
    });
  }

  async auditOAuth() {
    const box = document.getElementById('oauthResultBox');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl) return;
      if (box) box.innerHTML = '<span style="color:var(--cyan);">Checking OAuth spec...</span>';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'auditOAuthFlow', url: activeUrl });
        const r = res?.result;
        if (r && box) {
          if (!r.isOAuth) {
            box.innerHTML = '<span style="color:var(--text-muted); font-size:7px;">Not an OAuth authorization URL</span>';
          } else if (r.isVulnerable) {
            box.innerHTML = r.issues.map(iss => `<div style="color:var(--accent-rose);">⚠️ ${iss.title}</div>`).join('');
          } else {
            box.innerHTML = '<span style="color:var(--accent-emerald);">✅ Valid OAuth state & secure flow</span>';
          }
        }
      } catch (e) {
        if (box) box.innerHTML = '<span style="color:var(--accent-rose);">Err</span>';
      }
    });
  }

  async testRateLimit() {
    const box = document.getElementById('rateLimitResultBox');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl) return;
      if (box) box.innerHTML = '<span style="color:var(--cyan);">Sending burst (6x)...</span>';

      try {
        const res = await chrome.runtime.sendMessage({ action: 'analyzeRateLimit', url: activeUrl, burst: 6 });
        const r = res?.result;
        if (r && box) {
          const col = r.rateLimited ? 'var(--accent-emerald)' : 'var(--accent-amber)';
          box.innerHTML = `<div style="color:${col}; font-weight:700;">${r.verdict}</div>`;
        }
      } catch (e) {
        if (box) box.innerHTML = '<span style="color:var(--accent-rose);">Err</span>';
      }
    });
  }

  // ================================================================
  // 🕵️ V6.0 RECON DORKS CONTROLLER
  // ================================================================
  initDorksTab() {
    const input = document.getElementById('dorkDomainInput');
    if (input && !input.value) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          try {
            const u = new URL(tabs[0].url);
            input.value = u.hostname;
            this.renderDorks();
          } catch (e) {}
        }
      });
    }
  }

  async renderDorks() {
    const input = document.getElementById('dorkDomainInput');
    const list = document.getElementById('dorksList');
    const domain = (input?.value || 'target.com').trim();
    if (!list) return;

    list.innerHTML = '<div style="color:var(--cyan);">⏳ Generating high-impact recon dorks...</div>';

    try {
      const res = await chrome.runtime.sendMessage({ action: 'generateGitDorks', domain });
      const dorks = res?.dorks || [];

      list.innerHTML = dorks.map(d => `
        <div style="background:var(--bg-glass); border:1px solid var(--border); border-radius:var(--radius-xs); padding:6px; margin-bottom:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <span style="font-weight:700; color:var(--accent-amber); font-size:8px;">${d.category}</span>
            <a href="${d.url}" target="_blank" class="btn-sm-action" style="text-decoration:none; display:inline-block; font-size:7px;">🔎 Search</a>
          </div>
          <div style="font-family:var(--font-mono); font-size:7.5px; color:var(--text-muted); word-break:break-all;">${d.query}</div>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }


  // ================================================================
  // 🐚 V5.0 EXPORT BASH SCRIPT
  // ================================================================
  async exportBash() {
    try {
      await chrome.runtime.sendMessage({ action: 'exportBashScript' });
      this.log('🐚 Exporting executable Recon Bash script (recon_audit.sh)...', 'info');
    } catch (e) {
      this.log('❌ Bash export error: ' + e.message, 'error');
    }
  }

  // ================================================================
  // 🛡️ V5.0 SECURITY AUDITOR CONTROLLER
  // ================================================================
  initSecurityTab() {
    const corsTarget = document.getElementById('corsTargetUrl');
    if (corsTarget && !corsTarget.value) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          corsTarget.value = tabs[0].url;
        }
      });
    }
  }

  async runCorsAudit() {
    const targetUrl = (document.getElementById('corsTargetUrl')?.value || '').trim();
    const origin = (document.getElementById('corsOriginInput')?.value || 'https://evil-attacker.com').trim();
    const resBox = document.getElementById('corsAuditResult');
    if (!targetUrl) {
      alert('Please specify a target URL to audit for CORS.');
      return;
    }

    if (resBox) {
      resBox.style.display = 'block';
      resBox.innerHTML = '<div style="color:var(--cyan);">⏳ Probing CORS preflight & origin reflection...</div>';
    }

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'auditCORS',
        url: targetUrl,
        origin
      });

      if (!res || !res.success || !res.result) {
        throw new Error(res?.error || 'Failed to probe CORS');
      }

      const r = res.result;
      const secColor = r.severity === 'CRITICAL' ? 'var(--accent-rose)' :
                       r.severity === 'HIGH' ? 'var(--accent-amber)' :
                       r.severity === 'MEDIUM' ? 'var(--accent-purple)' : 'var(--accent-emerald)';

      if (resBox) {
        resBox.innerHTML = `
          <div style="background:var(--bg-glass); border:1px solid ${secColor}; border-radius:var(--radius-xs); padding:6px; margin-top:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-weight:800; color:${secColor}; font-size:9px;">[${r.severity}] ${r.title}</span>
              <span style="font-family:var(--font-mono); color:var(--text-muted);">HTTP ${r.status || '0'}</span>
            </div>
            <div style="color:var(--text-main); font-size:8px; margin-bottom:4px;">${r.details}</div>
            <div style="font-family:var(--font-mono); font-size:7.5px; color:var(--text-muted); background:var(--bg-elevated); padding:4px; border-radius:2px; margin-bottom:4px;">
              <div>ACAO: <span style="color:${r.acao ? 'var(--accent-rose)' : 'var(--text-muted)'};">${r.acao || '(none)'}</span></div>
              <div>ACAC: <span style="color:${r.acac === 'true' ? 'var(--accent-rose)' : 'var(--text-muted)'};">${r.acac || '(none)'}</span></div>
            </div>
            <button class="btn-sm-action" style="font-size:7.5px; width:100%;" id="copyCorsCurlBtn">📋 Copy cURL Proof Command</button>
          </div>
        `;

        document.getElementById('copyCorsCurlBtn')?.addEventListener('click', () => {
          navigator.clipboard.writeText(r.curlProof || '');
          alert('Copied cURL command to clipboard!');
        });
      }
    } catch (e) {
      if (resBox) {
        resBox.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
      }
    }
  }

  async analyzeSecurityHeaders() {
    const list = document.getElementById('headerFindingsList');
    const badge = document.getElementById('headerScoreBadge');

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeUrl = tabs && tabs[0] ? tabs[0].url : '';
      if (!activeUrl || !activeUrl.startsWith('http')) {
        alert('Active tab is not an HTTP/HTTPS URL.');
        return;
      }

      if (list) list.innerHTML = '<div style="color:var(--cyan); padding:4px;">⏳ Analyzing security headers...</div>';

      try {
        const res = await chrome.runtime.sendMessage({
          action: 'analyzeSecurityHeaders',
          url: activeUrl
        });

        if (!res || !res.success || !res.result) {
          throw new Error(res?.error || 'Failed to inspect headers');
        }

        const r = res.result;
        if (badge) {
          const gColor = r.grade.startsWith('A') ? 'var(--accent-emerald)' :
                         r.grade === 'B' ? 'var(--cyan)' :
                         r.grade === 'C' ? 'var(--accent-amber)' : 'var(--accent-rose)';
          badge.style.color = gColor;
          badge.textContent = 'GRADE: ' + r.grade + ' (' + r.score + '/100)';
        }

        if (list) {
          if (!r.findings || r.findings.length === 0) {
            list.innerHTML = '<div style="color:var(--accent-emerald); padding:4px;">✅ Outstanding! All critical security headers are configured.</div>';
            return;
          }

          list.innerHTML = r.findings.map(f => {
            const fColor = f.severity === 'HIGH' ? 'var(--accent-rose)' :
                           f.severity === 'MEDIUM' ? 'var(--accent-amber)' : 'var(--text-muted)';
            return `
              <div style="background:var(--bg-glass); border-left:2px solid ${fColor}; padding:4px 6px; margin-bottom:4px; border-radius:2px;">
                <div style="font-weight:700; color:${fColor};">${f.header}: ${f.issue}</div>
                <div style="color:var(--text-muted); font-size:7.5px;">💡 Recommendation: ${f.recommendation}</div>
              </div>
            `;
          }).join('');
        }
      } catch (e) {
        if (list) list.innerHTML = '<div style="color:var(--accent-rose); padding:4px;">❌ ' + e.message + '</div>';
      }
    });
  }

  async auditStorage() {
    const list = document.getElementById('storageFindingsList');
    const badge = document.getElementById('storageCountBadge');
    const secBadge = document.getElementById('secBadge');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (!activeTab || !activeTab.id) {
        alert('No active web page found.');
        return;
      }

      if (list) list.innerHTML = '<div style="color:var(--cyan); padding:4px;">⏳ Scanning localStorage, sessionStorage & cookies...</div>';

      chrome.tabs.sendMessage(activeTab.id, { action: 'auditStorage' }, (res) => {
        if (chrome.runtime.lastError || !res || !res.success) {
          if (list) list.innerHTML = '<div style="color:var(--accent-rose); padding:4px;">❌ Could not audit storage. Refresh page and try again.</div>';
          return;
        }

        const items = res.findings || [];
        if (badge) badge.textContent = items.length + ' ITEMS';
        if (secBadge) secBadge.textContent = items.length;

        if (items.length === 0) {
          if (list) list.innerHTML = '<div style="color:var(--accent-emerald); padding:4px;">✅ No sensitive auth tokens or exposed cookies detected in client storage.</div>';
          return;
        }

        if (list) {
          list.innerHTML = items.map(item => {
            const isWarn = item.warning || item.isJWT;
            const bColor = isWarn ? 'var(--accent-rose)' : 'var(--accent-amber)';
            return `
              <div style="background:var(--bg-glass); border-left:2px solid ${bColor}; padding:4px 6px; margin-bottom:4px; border-radius:2px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:700; color:var(--text-main); font-family:var(--font-mono);">${item.key}</span>
                  <span style="font-size:7px; color:${bColor}; font-weight:800;">${item.isJWT ? '⚡ JWT DETECTED' : item.storageType}</span>
                </div>
                <div style="font-family:var(--font-mono); font-size:7.5px; color:var(--text-muted); word-break:break-all;">${item.preview}</div>
                ${item.warning ? `<div style="color:var(--accent-rose); font-size:7px; font-weight:700;">⚠️ ${item.warning}</div>` : ''}
              </div>
            `;
          }).join('');
        }
      });
    });
  }

  // ================================================================
  // 🔑 V5.0 JWT INSPECTOR CONTROLLER
  // ================================================================
  initJwtTab() {
    const input = document.getElementById('jwtInputArea');
    if (input && !input.value) {
      const foundJwt = (this.secrets || []).find(s => s.type && s.type.toLowerCase().includes('jwt'));
      if (foundJwt && foundJwt.value) {
        input.value = foundJwt.value;
        this.inspectJwt();
      }
    }
  }

  async inspectJwt() {
    const input = document.getElementById('jwtInputArea');
    const headerBox = document.getElementById('jwtDecodedHeader');
    const payloadBox = document.getElementById('jwtDecodedPayload');
    const issuesBox = document.getElementById('jwtAuditIssues');
    const vectorsBox = document.getElementById('jwtAttackVectors');

    const token = (input?.value || '').trim();
    if (!token) {
      alert('Please paste a JWT token to decode and audit.');
      return;
    }

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'inspectJWT',
        token
      });

      if (!res || !res.valid) {
        throw new Error(res?.error || 'Invalid JWT structure');
      }

      if (headerBox) headerBox.textContent = JSON.stringify(res.header, null, 2);
      if (payloadBox) payloadBox.textContent = JSON.stringify(res.payload, null, 2);

      if (issuesBox) {
        if (!res.issues || res.issues.length === 0) {
          issuesBox.innerHTML = '<span style="color:var(--accent-emerald);">✅ Standard algorithm and valid expiration.</span>';
        } else {
          issuesBox.innerHTML = res.issues.map(iss => {
            const col = iss.severity === 'CRITICAL' ? 'var(--accent-rose)' :
                        iss.severity === 'WARNING' ? 'var(--accent-amber)' : 'var(--cyan)';
            return `<div style="color:${col}; margin-bottom:2px;">• [${iss.severity}] ${iss.message}</div>`;
          }).join('');
        }
      }

      if (vectorsBox && res.attackVectors) {
        vectorsBox.innerHTML = res.attackVectors.map((vec, i) => `
          <div style="background:var(--bg-glass); border:1px solid var(--border); border-radius:2px; padding:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
              <span style="font-weight:700; color:var(--accent-amber); font-size:7.5px;">⚡ ${vec.name}</span>
              <button class="btn-sm-action" style="font-size:7px;" id="copyVecBtn_${i}">Copy Token</button>
            </div>
            <div style="font-size:7px; color:var(--text-muted); margin-bottom:2px;">${vec.description}</div>
            <div style="font-family:var(--font-mono); font-size:7px; color:var(--cyan); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${vec.token}</div>
          </div>
        `).join('');

        res.attackVectors.forEach((vec, i) => {
          document.getElementById('copyVecBtn_' + i)?.addEventListener('click', () => {
            navigator.clipboard.writeText(vec.token);
            alert('Copied attack token: ' + vec.name);
          });
        });
      }
    } catch (e) {
      if (issuesBox) issuesBox.innerHTML = '<span style="color:var(--accent-rose);">❌ ' + e.message + '</span>';
    }
  }

  // ================================================================
  // 📜 V5.0 SWAGGER / OPENAPI IMPORTER CONTROLLER
  // ================================================================
  initSwaggerTab() {}

  async importSwaggerUrl() {
    const input = document.getElementById('swaggerUrlInput');
    const statusBox = document.getElementById('swaggerImportStatus');
    const url = (input?.value || '').trim();
    if (!url) {
      alert('Please specify an OpenAPI / Swagger JSON URL.');
      return;
    }

    if (statusBox) statusBox.innerHTML = '<div style="color:var(--cyan);">⏳ Fetching and parsing spec...</div>';

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'importSwagger',
        url
      });

      if (!res || !res.success || !res.result) {
        throw new Error(res?.error || 'Failed to import spec');
      }

      const r = res.result;
      if (statusBox) {
        statusBox.innerHTML = `<div style="color:var(--accent-emerald); font-weight:700;">✅ Successfully imported ${r.count} endpoints from ${r.title} v${r.version}!</div>`;
      }
      this.load();
    } catch (e) {
      if (statusBox) statusBox.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  async importSwaggerJson() {
    const area = document.getElementById('swaggerJsonArea');
    const statusBox = document.getElementById('swaggerImportStatus');
    const jsonStr = (area?.value || '').trim();
    if (!jsonStr) {
      alert('Please paste raw OpenAPI / Swagger JSON.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonStr);
      if (statusBox) statusBox.innerHTML = '<div style="color:var(--cyan);">⏳ Parsing specification JSON...</div>';

      const res = await chrome.runtime.sendMessage({
        action: 'importSwagger',
        json: parsed,
        source: 'pasted-json'
      });

      if (!res || !res.success || !res.result) {
        throw new Error(res?.error || 'Failed to import spec');
      }

      const r = res.result;
      if (statusBox) {
        statusBox.innerHTML = `<div style="color:var(--accent-emerald); font-weight:700;">✅ Successfully loaded ${r.count} endpoints into database!</div>`;
      }
      this.load();
    } catch (e) {
      if (statusBox) statusBox.innerHTML = '<div style="color:var(--accent-rose);">❌ Invalid JSON: ' + e.message + '</div>';
    }
  }

  // ================================================================
  // ☁️ V5.0 CLOUD BUCKET CONTROLLER
  // ================================================================
  async loadCloudBuckets() {
    const list = document.getElementById('cloudBucketList');
    const badge = document.getElementById('cloudBadge');

    try {
      const res = await chrome.runtime.sendMessage({ action: 'getCloudBuckets' });
      const buckets = (res && res.buckets) || [];
      if (badge) badge.textContent = buckets.length;

      if (!list) return;
      if (buckets.length === 0) {
        list.innerHTML = '<div class="empty">No AWS S3, GCP, or Azure blob storage buckets discovered yet.<br>Buckets are automatically harvested from page source and API traffic.</div>';
        return;
      }

      list.innerHTML = buckets.map((b, i) => `
        <div style="background:var(--bg-glass); border:1px solid var(--border); border-radius:var(--radius-xs); padding:6px; margin-bottom:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <div style="display:flex; gap:6px; align-items:center;">
              <span class="badge" style="background:rgba(192,132,252,0.15); color:var(--accent-purple);">${b.provider}</span>
              <span style="font-family:var(--font-mono); font-weight:700; color:var(--cyan); font-size:8.5px;">${b.name}</span>
            </div>
            <button class="btn-sm-action" style="font-size:7px;" id="probeBucketBtn_${i}">Probe Access</button>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:7px; color:var(--text-muted);">
            <span>${b.url}</span>
            <span id="bucketStatus_${i}" style="font-weight:800; color:${b.status === 'UNPROBED' ? 'var(--text-muted)' : 'var(--accent-amber)'};">${b.status}</span>
          </div>
        </div>
      `).join('');

      buckets.forEach((b, i) => {
        document.getElementById('probeBucketBtn_' + i)?.addEventListener('click', async () => {
          const sLabel = document.getElementById('bucketStatus_' + i);
          if (sLabel) sLabel.innerHTML = '<span style="color:var(--cyan);">Probing...</span>';
          try {
            const pRes = await chrome.runtime.sendMessage({ action: 'probeCloudBucket', url: b.url });
            if (pRes && pRes.result && sLabel) {
              const r = pRes.result;
              const pColor = r.severity === 'CRITICAL' ? 'var(--accent-rose)' :
                             r.severity === 'HIGH' ? 'var(--accent-amber)' : 'var(--accent-emerald)';
              sLabel.innerHTML = `<span style="color:${pColor}; font-weight:800;">${r.status}</span>`;
              alert(`[${r.status}] ${r.message}`);
            }
          } catch (e) {
            if (sLabel) sLabel.textContent = 'ERR';
          }
        });
      });
    } catch (e) {}
  }

  async probeAllBuckets() {
    this.log('☁️ Batch probing all discovered cloud storage buckets...', 'info');
    const buttons = document.querySelectorAll('[id^="probeBucketBtn_"]');
    buttons.forEach(btn => btn.click());
  }

  // ================================================================
  // ⚡ V5.0 VERB TAMPERING MATRIX
  // ================================================================
  async runVerbTamperMatrix() {
    const url = (document.getElementById('repeaterUrl')?.value || '').trim();
    const box = document.getElementById('repeaterResponseBox');
    if (!url) {
      alert('Please specify a URL in the Repeater tab.');
      return;
    }

    if (box) box.innerHTML = '<div style="color:var(--accent-rose); font-weight:700;">⏳ Testing HTTP Verbs (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS) for Auth Bypass...</div>';

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'testVerbTampering',
        url
      });

      if (!res || !res.success || !res.result) {
        throw new Error(res?.error || 'Verb tampering probe failed');
      }

      const r = res.result;
      let html = '<div style="font-family:var(--font-mono); font-size:8px;">';
      html += '<div style="font-weight:800; color:var(--cyan); margin-bottom:4px;">⚡ HTTP VERB TAMPERING AUDIT MATRIX</div>';

      if (r.bypassDetected) {
        html += '<div style="background:rgba(244,63,94,0.15); border:1px solid var(--accent-rose); color:var(--accent-rose); font-weight:800; padding:4px; border-radius:2px; margin-bottom:6px;">🚨 POTENTIAL AUTHENTICATION BYPASS DETECTED! ' + (r.anomalies.join(' | ')) + '</div>';
      }

      html += '<table style="width:100%; border-collapse:collapse; margin-top:4px;">';
      html += '<tr style="color:var(--text-muted); border-bottom:1px solid var(--border);"><th style="text-align:left; padding:2px;">Method</th><th style="text-align:left; padding:2px;">Status</th><th style="text-align:left; padding:2px;">Bytes</th><th style="text-align:left; padding:2px;">Type</th></tr>';

      r.results.forEach(row => {
        const sColor = row.status === 200 || row.status === 201 || row.status === 204 ? 'var(--accent-emerald)' :
                       row.status === 401 || row.status === 403 ? 'var(--accent-rose)' :
                       row.status >= 300 && row.status < 400 ? 'var(--accent-amber)' : 'var(--text-muted)';
        html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
          <td style="font-weight:800; color:var(--cyan); padding:2px;">${row.method}</td>
          <td style="color:${sColor}; font-weight:700; padding:2px;">${row.status} ${row.statusText}</td>
          <td style="color:var(--text-muted); padding:2px;">${row.length}</td>
          <td style="color:var(--text-muted); font-size:7px; padding:2px;">${row.contentType}</td>
        </tr>`;
      });
      html += '</table></div>';

      if (box) box.innerHTML = html;
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

  // ================================================================
  // 🎯 V5.0 NUMERIC IDOR SEQUENCER
  // ================================================================
  async runIdorSequence() {
    const url = (document.getElementById('repeaterUrl')?.value || '').trim();
    const box = document.getElementById('repeaterResponseBox');
    if (!url) {
      alert('Please specify a URL in the Repeater tab containing a numeric ID (e.g. /users/100 or ?id=100).');
      return;
    }

    if (box) box.innerHTML = '<div style="color:var(--accent-purple); font-weight:700;">⏳ Sequentially probing numeric IDs to detect potential IDOR vulnerabilities...</div>';

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'sequenceIDOR',
        url,
        offsets: [-2, -1, 1, 2],
        delay: 200
      });

      if (!res || !res.success || !res.result) {
        throw new Error(res?.error || 'IDOR sequencing failed');
      }

      const r = res.result;
      let html = '<div style="font-family:var(--font-mono); font-size:8px;">';
      html += '<div style="font-weight:800; color:var(--accent-purple); margin-bottom:4px;">🎯 NUMERIC IDOR SEQUENCER RESULTS</div>';

      if (r.potentialVulnerability) {
        html += '<div style="background:rgba(192,132,252,0.15); border:1px solid var(--accent-purple); color:var(--accent-purple); font-weight:800; padding:4px; border-radius:2px; margin-bottom:6px;">⚠️ POTENTIAL IDOR: Neighboring IDs returned HTTP 200 OK with distinct payload lengths!</div>';
      }

      html += `<div style="color:var(--text-muted); font-size:7.5px; margin-bottom:4px;">Baseline ID ${r.baseline.id} -> Status ${r.baseline.status} (${r.baseline.length} bytes)</div>`;

      html += '<table style="width:100%; border-collapse:collapse; margin-top:4px;">';
      html += '<tr style="color:var(--text-muted); border-bottom:1px solid var(--border);"><th style="text-align:left; padding:2px;">Test ID</th><th style="text-align:left; padding:2px;">Status</th><th style="text-align:left; padding:2px;">Length</th><th style="text-align:left; padding:2px;">Δ Delta</th></tr>';

      r.sequencedResults.forEach(item => {
        const sColor = item.status === 200 ? 'var(--accent-emerald)' : 'var(--text-muted)';
        html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
          <td style="font-weight:800; color:var(--cyan); padding:2px;">#${item.id}</td>
          <td style="color:${sColor}; font-weight:700; padding:2px;">${item.status}</td>
          <td style="color:var(--text-muted); padding:2px;">${item.length || 0}</td>
          <td style="color:${item.deltaFromBaseline === 0 ? 'var(--text-muted)' : 'var(--accent-amber)'}; padding:2px;">${item.deltaFromBaseline > 0 ? '+' : ''}${item.deltaFromBaseline || 0}</td>
        </tr>`;
      });
      html += '</table></div>';

      if (box) box.innerHTML = html;
    } catch (e) {
      if (box) box.innerHTML = '<div style="color:var(--accent-rose);">❌ ' + e.message + '</div>';
    }
  }

}

// Launch on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.ui = new PopupController();
});