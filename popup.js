// ================================================================
// 🔗 ENDPOINT HUNTER - POPUP CONTROLLER (FIXED)
// ================================================================

class PopupController {
  constructor() {
    this.endpoints = [];
    this.paths = [];
    this.isScanning = false;
    this.statusInterval = null;
    this.logs = [];  // ✅ Always initialize as array
    this.setup();
    this.load();
    this.loadSettings();
    this.startRealtimeUpdates();
    this.loadLogs();
  }

  // ================================================================
  // 🔧 SETUP
  // ================================================================

  setup() {
    // Main Controls
    this.scanBtn = document.getElementById('scanBtn');
    this.scanCurrentBtn = document.getElementById('scanCurrentBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.resumeBtn = document.getElementById('resumeBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.pdfBtn = document.getElementById('pdfBtn');
    this.telegramBtn = document.getElementById('telegramBtn');

    // Settings
    this.telegramTokenInput = document.getElementById('telegramTokenInput');
    this.telegramChatIdInput = document.getElementById('telegramChatIdInput');
    this.telegramEnabledInput = document.getElementById('telegramEnabledInput');
    this.saveTelegramBtn = document.getElementById('saveTelegramBtn');

    this.maxPagesInput = document.getElementById('maxPagesInput');
    this.maxDepthInput = document.getElementById('maxDepthInput');
    this.stealthModeInput = document.getElementById('stealthModeInput');
    this.followExternalInput = document.getElementById('followExternalInput');
    this.saveCrawlBtn = document.getElementById('saveCrawlBtn');

    // Event Listeners
    if (this.scanBtn) {
      this.scanBtn.addEventListener('click', () => this.scanAll());
    }

    if (this.scanCurrentBtn) {
      this.scanCurrentBtn.addEventListener('click', () => this.scanCurrent());
    }

    if (this.stopBtn) {
      this.stopBtn.addEventListener('click', () => this.stopScan());
    }

    if (this.resumeBtn) {
      this.resumeBtn.addEventListener('click', () => this.resumeScan());
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clear());
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.export());
    }

    if (this.pdfBtn) {
      this.pdfBtn.addEventListener('click', () => this.exportPDF());
    }

    if (this.telegramBtn) {
      this.telegramBtn.addEventListener('click', () => this.sendTelegramReport());
    }

    if (this.saveTelegramBtn) {
      this.saveTelegramBtn.addEventListener('click', () => this.saveTelegramSettings());
    }

    if (this.saveCrawlBtn) {
      this.saveCrawlBtn.addEventListener('click', () => this.saveCrawlSettings());
    }

    // Tabs
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t2 => t2.classList.remove('active'));
        t.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        const tabId = t.dataset.tab;
        const target = document.getElementById(tabId + 'Tab');
        if (target) target.style.display = 'block';
        if (tabId === 'logs') {
          this.loadLogs();
        }
        if (tabId === 'settings') {
          this.loadSettings();
        }
      });
    });

    // Messages from background
    chrome.runtime.onMessage.addListener((req) => {
      if (req.action === 'endpointFound') {
        this.addEndpoint(req);
        this.updateLiveEndpoint(req);
        this.updateStats();
      }
      if (req.action === 'pageChanged') {
        this.updateStats();
        document.getElementById('currentUrl').textContent = '📍 ' + req.url;
        document.getElementById('pagesScanned').textContent = req.totalPages || 0;
        document.getElementById('linksFound').textContent = req.totalLinks || 0;
        document.getElementById('endpointsFound').textContent = req.totalEndpoints || 0;
        if (req.queueSize !== undefined) {
          document.getElementById('queueSize').textContent = req.queueSize;
        }
      }
      if (req.action === 'queueUpdate') {
        document.getElementById('queueSize').textContent = req.queueSize || 0;
        document.getElementById('pagesScanned').textContent = req.pagesCrawled || 0;
      }
      if (req.action === 'linkDiscovered') {
        this.updateStats();
      }
      if (req.action === 'newLog') {
        this.addLogDirect(req.log);
        // ✅ Ensure logs is array before pushing
        if (Array.isArray(this.logs)) {
          this.logs.push(req.log);
        } else {
          this.logs = [req.log];
        }
      }
      if (req.action === 'crawlComplete') {
        this.isScanning = false;
        this.updateButtonState('complete');
        this.log(`✅ Crawl complete! Pages: ${req.pages}, Endpoints: ${req.endpoints}`, 'success');
        document.getElementById('scanStatus').textContent = 'COMPLETE';
        if (this.statusInterval) {
          clearInterval(this.statusInterval);
          this.statusInterval = null;
        }
        this.load();
      }
      if (req.action === 'crawlStopped') {
        this.isScanning = false;
        this.updateButtonState('idle');
        this.log('⏹ Scan stopped', 'info');
        document.getElementById('scanStatus').textContent = 'STOPPED';
        if (this.statusInterval) {
          clearInterval(this.statusInterval);
          this.statusInterval = null;
        }
      }
      if (req.action === 'crawlPaused') {
        this.updateButtonState('paused');
        this.log('⏸ Scan paused', 'info');
        document.getElementById('scanStatus').textContent = 'PAUSED';
      }
      if (req.action === 'crawlResumed') {
        this.isScanning = true;
        this.updateButtonState('scanning');
        this.log('▶ Scan resumed', 'info');
        document.getElementById('scanStatus').textContent = 'SCANNING';
      }
      if (req.action === 'currentPageScanComplete') {
        this.isScanning = false;
        this.updateButtonState('idle');
        this.log('✅ Current page scan complete', 'success');
        document.getElementById('scanStatus').textContent = 'IDLE';
        this.load();
      }
      if (req.action === 'dataCleared') {
        this.endpoints = [];
        this.paths = [];
        this.logs = [];
        this.updateUI();
        this.updateStats();
        this.log('🗑️ All data cleared', 'info');
      }
    });

    this.updateButtonState('idle');
  }

  // ================================================================
  // 🎯 BUTTON STATE MANAGEMENT
  // ================================================================

  updateButtonState(state) {
    document.body.setAttribute('data-scan-state', state);
    const dot = document.getElementById('statusDot');
    if (dot) {
      const labels = { idle: '● READY', scanning: '● SCANNING', paused: '● PAUSED', complete: '● COMPLETE' };
      dot.textContent = labels[state] || '● READY';
    }

    switch (state) {
      case 'idle':
        this.scanBtn.style.display = 'inline-block';
        this.scanBtn.disabled = false;
        this.scanBtn.textContent = '📡 SCAN (ALL)';
        this.scanCurrentBtn.style.display = 'inline-block';
        this.scanCurrentBtn.disabled = false;
        this.scanCurrentBtn.textContent = '🎯 SCAN CURRENT';
        this.stopBtn.style.display = 'none';
        this.resumeBtn.style.display = 'none';
        document.getElementById('scanStatus').textContent = 'IDLE';
        break;

      case 'scanning':
        this.scanBtn.style.display = 'inline-block';
        this.scanBtn.disabled = true;
        this.scanBtn.textContent = '⏳ SCANNING...';
        this.scanCurrentBtn.style.display = 'inline-block';
        this.scanCurrentBtn.disabled = true;
        this.scanCurrentBtn.textContent = '⏳ SCANNING...';
        this.stopBtn.style.display = 'inline-block';
        this.stopBtn.textContent = '⏹ STOP';
        this.resumeBtn.style.display = 'none';
        document.getElementById('scanStatus').textContent = 'SCANNING';
        break;

      case 'paused':
        this.scanBtn.style.display = 'inline-block';
        this.scanBtn.disabled = true;
        this.scanBtn.textContent = '⏸ PAUSED';
        this.scanCurrentBtn.style.display = 'inline-block';
        this.scanCurrentBtn.disabled = true;
        this.scanCurrentBtn.textContent = '⏸ PAUSED';
        this.stopBtn.style.display = 'none';
        this.resumeBtn.style.display = 'inline-block';
        this.resumeBtn.textContent = '▶ RESUME';
        document.getElementById('scanStatus').textContent = 'PAUSED';
        break;

      case 'complete':
        this.scanBtn.style.display = 'inline-block';
        this.scanBtn.disabled = false;
        this.scanBtn.textContent = '📡 SCAN (ALL)';
        this.scanCurrentBtn.style.display = 'inline-block';
        this.scanCurrentBtn.disabled = false;
        this.scanCurrentBtn.textContent = '🎯 SCAN CURRENT';
        this.stopBtn.style.display = 'none';
        this.resumeBtn.style.display = 'none';
        document.getElementById('scanStatus').textContent = 'COMPLETE';
        break;
    }
  }

  // ================================================================
  // 📡 SCAN ALL PAGES
  // ================================================================

  async scanAll() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('brave://')) {
        this.log('❌ Cannot scan browser pages', 'error');
        return;
      }

      this.isScanning = true;
      this.updateButtonState('scanning');
      this.log(`🚀 Crawl started: ${tab.url}`, 'info');
      document.getElementById('scanStatus').textContent = 'SCANNING (Crawl)';
      document.getElementById('currentUrl').textContent = '📍 ' + tab.url;

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

  // ================================================================
  // 🎯 SCAN CURRENT PAGE
  // ================================================================

  async scanCurrent() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('brave://')) {
        this.log('❌ Cannot scan browser pages', 'error');
        return;
      }

      this.isScanning = true;
      this.updateButtonState('scanning');
      this.log(`🎯 Scanning current page: ${tab.url}`, 'info');
      document.getElementById('scanStatus').textContent = 'SCANNING (Current)';
      document.getElementById('currentUrl').textContent = '📍 ' + tab.url;

      await chrome.runtime.sendMessage({
        action: 'scanCurrent',
        tabId: tab.id,
        url: tab.url
      });

      setTimeout(() => {
        this.isScanning = false;
        this.updateButtonState('idle');
        this.log('✅ Current page scan complete', 'success');
        document.getElementById('scanStatus').textContent = 'IDLE';
        this.load();
      }, 10000);

    } catch (e) {
      this.log(`❌ Error: ${e.message}`, 'error');
      this.isScanning = false;
      this.updateButtonState('idle');
    }
  }

  // ================================================================
  // 🔁 STATUS CHECK
  // ================================================================

  startStatusCheck() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
    this.statusInterval = setInterval(async () => {
      try {
        const s = await chrome.runtime.sendMessage({ action: 'getStats' });
        if (!s?.stats) return;

        if (s.stats.isPaused) {
          this.isScanning = false;
          this.updateButtonState('paused');
        } else if (s.stats.isRunning) {
          this.isScanning = true;
          this.updateButtonState('scanning');
        } else {
          this.isScanning = false;
          this.updateButtonState('idle');
          clearInterval(this.statusInterval);
          this.statusInterval = null;
        }
      } catch (e) {
        console.error('[ENDPOINT_HUNTER] Status check error:', e);
      }
    }, 1500);
  }

  // ================================================================
  // ⏹ STOP SCAN
  // ================================================================

  async stopScan() {
    try {
      this.log('⏹ Stopping scan...', 'info');
      await chrome.runtime.sendMessage({ action: 'stopScan' });

      this.isScanning = false;
      this.updateButtonState('idle');
      document.getElementById('scanStatus').textContent = 'STOPPED';

      if (this.statusInterval) {
        clearInterval(this.statusInterval);
        this.statusInterval = null;
      }

      const s = await chrome.runtime.sendMessage({ action: 'getStats' });
      if (s?.stats) {
        this.log(`📊 Scan stopped. Found ${s.stats.totalEndpoints || 0} endpoints`, 'info');
      }

    } catch (e) {
      this.log(`❌ Stop error: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // ▶ RESUME SCAN
  // ================================================================

  async resumeScan() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.runtime.sendMessage({ action: 'resumeScan', tabId: tab?.id });
      this.isScanning = true;
      this.updateButtonState('scanning');
      this.log('▶ Scan resumed', 'info');
      document.getElementById('scanStatus').textContent = 'SCANNING';
      this.startStatusCheck();
    } catch (e) {
      this.log(`❌ Resume error: ${e.message}`, 'error');
    }
  }

  // ================================================================
  // 🗑️ CLEAR
  // ================================================================

  async clear() {
    if (!confirm('🗑️ Clear all discovered endpoints and paths?')) return;
    await chrome.runtime.sendMessage({ action: 'clear' });
    this.endpoints = [];
    this.paths = [];
    this.logs = [];
    this.updateUI();
    this.updateStats();
    this.log('🗑️ All data cleared', 'info');
  }

  // ================================================================
  // 📤 EXPORT
  // ================================================================

  async export() {
    await chrome.runtime.sendMessage({ action: 'exportResults' });
    this.log('📤 Exporting results...', 'info');
  }

  // ================================================================
  // 📄 PDF EXPORT
  // ================================================================

  async exportPDF() {
    await chrome.runtime.sendMessage({ action: 'exportPDF' });
    this.log('📄 PDF report generation started', 'info');
  }

  // ================================================================
  // 📤 SEND TELEGRAM REPORT
  // ================================================================

  async sendTelegramReport() {
    await chrome.runtime.sendMessage({ action: 'sendTelegramReport' });
    this.log('📤 Sending Telegram report...', 'info');
  }

  // ================================================================
  // 📊 LOAD
  // ================================================================

  async load() {
    try {
      const e = await chrome.runtime.sendMessage({ action: 'getEndpoints' });
      this.endpoints = e?.endpoints || [];

      const p = await chrome.runtime.sendMessage({ action: 'getPaths' });
      this.paths = p?.paths || [];

      this.updateUI();
      this.updateStats();

      const s = await chrome.runtime.sendMessage({ action: 'getStats' });
      if (s?.stats) {
        this.isScanning = !!s.stats.isRunning;
        if (s.stats.isPaused) {
          this.updateButtonState('paused');
        } else if (s.stats.isRunning) {
          this.updateButtonState('scanning');
          if (!this.statusInterval) {
            this.startStatusCheck();
          }
        } else {
          this.updateButtonState('idle');
        }
        document.getElementById('queueSize').textContent = s.stats.queueSize || 0;
        document.getElementById('pagesScanned').textContent = s.stats.totalPages || 0;
        document.getElementById('linksFound').textContent = s.stats.totalLinks || 0;
        document.getElementById('endpointsFound').textContent = s.stats.totalEndpoints || 0;
        document.getElementById('pathsFoundStat').textContent = s.stats.totalPaths || 0;
        if (s.stats.currentUrl && s.stats.currentUrl !== 'None') {
          document.getElementById('currentUrl').textContent = '📍 ' + s.stats.currentUrl;
        }
        if (s.stats.startTime) {
          const elapsed = Math.floor((Date.now() - s.stats.startTime) / 1000);
          const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
          const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
          const seconds = String(elapsed % 60).padStart(2, '0');
          document.getElementById('scanTime').textContent = `${hours}:${minutes}:${seconds}`;
        }
        document.getElementById('totalEndpoints').textContent = s.stats.totalEndpoints || 0;
        document.getElementById('pathsFound').textContent = s.stats.totalPaths || 0;

        // Count critical (admin, auth, config, payment)
        const critical = (this.endpoints || []).filter(e =>
          e.type === 'admin' || e.type === 'auth' || e.type === 'config' || e.type === 'payment'
        ).length;
        document.getElementById('criticalEndpoints').textContent = critical;

        // Count high (api, data, debug, websocket)
        const high = (this.endpoints || []).filter(e =>
          e.type === 'api' || e.type === 'data' || e.type === 'debug' || e.type === 'websocket'
        ).length;
        document.getElementById('highEndpoints').textContent = high;
      }
    } catch (e) {
      console.error('[ENDPOINT_HUNTER] Load error:', e);
    }
  }

  // ================================================================
  // 🎨 UPDATE UI
  // ================================================================

  updateUI() {
    this.renderEndpoints();
    this.renderPaths();
  }

  renderEndpoints() {
    const list = document.getElementById('endpointList');
    if (!list) return;

    if (this.endpoints.length === 0) {
      list.innerHTML = `<div class="empty">No endpoints discovered yet.<br>Start a crawl to begin discovery.</div>`;
      return;
    }

    list.innerHTML = this.endpoints.slice().reverse().slice(0, 50).map(ep => `
      <div class="endpoint-item">
        <div class="endpoint-header">
          <span class="endpoint-url">${this.escape(ep.url)}</span>
          <span class="endpoint-method ${ep.method.toLowerCase()}">${ep.method}</span>
          <span class="endpoint-type ${ep.type}">${ep.type}</span>
        </div>
        <div style="font-size:7px;color:var(--text-faint);margin-top:2px;">
          ${ep.source ? `📎 ${ep.source}` : ''}
          ${ep.foundOn ? ` • ${this.escape(ep.foundOn)}` : ''}
        </div>
      </div>
    `).join('');
  }

  renderPaths() {
    const list = document.getElementById('pathList');
    if (!list) return;

    if (this.paths.length === 0) {
      list.innerHTML = `<div class="empty">No paths discovered yet.<br>Start a crawl to begin discovery.</div>`;
      return;
    }

    list.innerHTML = this.paths.slice().reverse().slice(0, 100).map(path => `
      <div class="path-item">${this.escape(path)}</div>
    `).join('');
  }

  // ================================================================
  // 📊 UPDATE STATS
  // ================================================================

  updateStats() {
    const total = this.endpoints.length;
    const critical = this.endpoints.filter(e =>
      e.type === 'admin' || e.type === 'auth' || e.type === 'config' || e.type === 'payment'
    ).length;
    const high = this.endpoints.filter(e =>
      e.type === 'api' || e.type === 'data' || e.type === 'debug' || e.type === 'websocket'
    ).length;

    document.getElementById('totalEndpoints').textContent = total;
    document.getElementById('criticalEndpoints').textContent = critical;
    document.getElementById('highEndpoints').textContent = high;
    document.getElementById('pathsFound').textContent = this.paths.length;
    document.getElementById('endpointsFound').textContent = total;
    document.getElementById('pathsFoundStat').textContent = this.paths.length;
  }

  // ================================================================
  // 🔴 UPDATE LIVE ENDPOINT
  // ================================================================

  updateLiveEndpoint(ep) {
    const list = document.getElementById('liveEndpointList');
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'live-item';
    item.innerHTML = `
      <span class="live-method ${ep.method.toLowerCase()}">${ep.method}</span>
      <span class="live-url">${this.escape(ep.url)}</span>
      <span class="live-type ${ep.type}">${ep.type}</span>
    `;
    list.prepend(item);

    // Keep only last 20
    while (list.children.length > 20) {
      list.removeChild(list.lastChild);
    }

    // Remove "Waiting" message
    const first = list.querySelector('.live-item[style]');
    if (first && first.style) {
      first.remove();
    }
  }

  // ================================================================
  // ➕ ADD ENDPOINT
  // ================================================================

  addEndpoint(ep) {
    if (!ep || !ep.url) return;
    // Check if already exists
    const exists = this.endpoints.some(e => e.url === ep.url);
    if (exists) return;

    this.endpoints.push(ep);
    this.updateUI();
    this.updateStats();
  }

  // ================================================================
  // 📡 REAL-TIME UPDATES
  // ================================================================

  startRealtimeUpdates() {
    this.realtimeInterval = setInterval(() => {
      this.updateRealtimeStats();
    }, 2000);
  }

  async updateRealtimeStats() {
    try {
      const s = await chrome.runtime.sendMessage({ action: 'getStats' });
      if (s?.stats) {
        const stats = s.stats;
        document.getElementById('pagesScanned').textContent = stats.totalPages || 0;
        document.getElementById('linksFound').textContent = stats.totalLinks || 0;
        document.getElementById('endpointsFound').textContent = stats.totalEndpoints || 0;
        document.getElementById('queueSize').textContent = stats.queueSize || 0;
        document.getElementById('pathsFoundStat').textContent = stats.totalPaths || 0;

        if (stats.isRunning) {
          document.getElementById('scanStatus').textContent = 'SCANNING';
        } else if (stats.isPaused) {
          document.getElementById('scanStatus').textContent = 'PAUSED';
        } else {
          document.getElementById('scanStatus').textContent = 'IDLE';
        }

        if (stats.currentUrl && stats.currentUrl !== 'None') {
          document.getElementById('currentUrl').textContent = '📍 ' + stats.currentUrl;
        }

        if (stats.startTime) {
          const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
          const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
          const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
          const seconds = String(elapsed % 60).padStart(2, '0');
          document.getElementById('scanTime').textContent = `${hours}:${minutes}:${seconds}`;
        }

        document.getElementById('totalEndpoints').textContent = stats.totalEndpoints || 0;
        document.getElementById('pathsFound').textContent = stats.totalPaths || 0;

        const critical = (this.endpoints || []).filter(e =>
          e.type === 'admin' || e.type === 'auth' || e.type === 'config' || e.type === 'payment'
        ).length;
        document.getElementById('criticalEndpoints').textContent = critical;

        const high = (this.endpoints || []).filter(e =>
          e.type === 'api' || e.type === 'data' || e.type === 'debug' || e.type === 'websocket'
        ).length;
        document.getElementById('highEndpoints').textContent = high;
      }
    } catch (e) {
      console.error('[ENDPOINT_HUNTER] Stats update error:', e);
    }
  }

  // ================================================================
  // 📝 LOGS (FIXED)
  // ================================================================

  addLogDirect(log) {
    const container = document.getElementById('logContainer');
    if (!container) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';

    let emoji = '';
    switch(log.type) {
      case 'pages': emoji = '📄'; break;
      case 'endpoint': emoji = '🎯'; break;
      case 'link': emoji = '🔗'; break;
      case 'success': emoji = '✅'; break;
      case 'error': emoji = '❌'; break;
      case 'warning': emoji = '⚠️'; break;
      default: emoji = 'ℹ️';
    }

    entry.innerHTML = `<span class="time">[${log.time}]</span><span class="msg ${log.type}">${emoji} ${this.escape(log.message)}</span>`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;

    while (container.children.length > 200) {
      container.removeChild(container.firstChild);
    }
  }

  // ✅ FIXED: loadLogs() with proper array handling
  async loadLogs() {
    try {
      const r = await chrome.runtime.sendMessage({ action: 'getLogs' });
      
      // ✅ Ensure logs is always an array
      if (r?.logs) {
        if (Array.isArray(r.logs)) {
          this.logs = r.logs;
        } else if (typeof r.logs === 'object' && r.logs !== null) {
          // Handle object format with nested arrays
          const allLogs = [];
          for (const key of ['pages', 'links', 'endpoints', 'paths', 'params', 'files', 'bypasses', 'errors']) {
            if (r.logs[key] && Array.isArray(r.logs[key])) {
              allLogs.push(...r.logs[key]);
            }
          }
          this.logs = allLogs;
        } else {
          this.logs = [];
        }
      } else {
        this.logs = [];
      }

      const container = document.getElementById('logContainer');
      if (!container) return;

      container.innerHTML = '';
      
      // ✅ Safely slice array
      const logsToShow = Array.isArray(this.logs) ? this.logs.slice(-100) : [];
      
      for (const log of logsToShow) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';

        let emoji = '';
        switch(log.type) {
          case 'pages': emoji = '📄'; break;
          case 'endpoint': emoji = '🎯'; break;
          case 'link': emoji = '🔗'; break;
          case 'success': emoji = '✅'; break;
          case 'error': emoji = '❌'; break;
          case 'warning': emoji = '⚠️'; break;
          default: emoji = 'ℹ️';
        }

        const time = log.time || new Date().toLocaleTimeString();
        const message = log.message || log.msg || JSON.stringify(log);
        entry.innerHTML = `<span class="time">[${time}]</span><span class="msg ${log.type || 'info'}">${emoji} ${this.escape(message)}</span>`;
        container.appendChild(entry);
      }
      container.scrollTop = container.scrollHeight;
      
    } catch (e) {
      console.error('[ENDPOINT_HUNTER] Error loading logs:', e);
      // ✅ Ensure logs is array even on error
      this.logs = [];
    }
  }

  log(msg, type = 'info') {
    const container = document.getElementById('logContainer');
    if (!container) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString();

    let emoji = '';
    switch(type) {
      case 'pages': emoji = '📄'; break;
      case 'endpoint': emoji = '🎯'; break;
      case 'link': emoji = '🔗'; break;
      case 'success': emoji = '✅'; break;
      case 'error': emoji = '❌'; break;
      case 'warning': emoji = '⚠️'; break;
      default: emoji = 'ℹ️';
    }

    entry.innerHTML = `<span class="time">[${time}]</span><span class="msg ${type}">${emoji} ${this.escape(msg)}</span>`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;

    while (container.children.length > 200) {
      container.removeChild(container.firstChild);
    }
  }

  // ================================================================
  // ⚙️ SETTINGS
  // ================================================================

  async loadSettings() {
    await this.loadTelegramSettings();
    await this.loadCrawlSettings();
  }

  async loadTelegramSettings() {
    try {
      const r = await chrome.runtime.sendMessage({ action: 'getTelegramConfig' });
      const cfg = r?.config || {};
      if (this.telegramTokenInput) this.telegramTokenInput.value = cfg.token || '';
      if (this.telegramChatIdInput) this.telegramChatIdInput.value = cfg.chatId || '';
      if (this.telegramEnabledInput) this.telegramEnabledInput.checked = !!cfg.enabled;
    } catch (e) {}
  }

  async saveTelegramSettings() {
    const config = {
      token: this.telegramTokenInput ? this.telegramTokenInput.value.trim() : '',
      chatId: this.telegramChatIdInput ? this.telegramChatIdInput.value.trim() : '',
      enabled: this.telegramEnabledInput ? this.telegramEnabledInput.checked : false
    };
    const r = await chrome.runtime.sendMessage({ action: 'setTelegramConfig', config });
    const statusEl = document.getElementById('telegramSaveStatus');
    if (statusEl) {
      statusEl.textContent = r?.success ? '✅ Saved' : '❌ Save failed';
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
    this.log('💾 Telegram settings saved', 'success');
  }

  async loadCrawlSettings() {
    try {
      const r = await chrome.runtime.sendMessage({ action: 'getCrawlConfig' });
      const cfg = r?.config || {};
      if (this.maxPagesInput) this.maxPagesInput.value = cfg.maxPages || 999999;
      if (this.maxDepthInput) this.maxDepthInput.value = cfg.maxDepth || 999;
      if (this.stealthModeInput) this.stealthModeInput.checked = cfg.stealthMode !== false;
      if (this.followExternalInput) this.followExternalInput.checked = !!cfg.followExternal;
    } catch (e) {}
  }

  async saveCrawlSettings() {
    const config = {
      maxPages: parseInt(this.maxPagesInput ? this.maxPagesInput.value : '999999'),
      maxDepth: parseInt(this.maxDepthInput ? this.maxDepthInput.value : '999'),
      stealthMode: this.stealthModeInput ? this.stealthModeInput.checked : true,
      followExternal: this.followExternalInput ? this.followExternalInput.checked : false
    };
    const r = await chrome.runtime.sendMessage({ action: 'setCrawlConfig', config });
    const statusEl = document.getElementById('crawlSaveStatus');
    if (statusEl) {
      statusEl.textContent = r?.success ? '✅ Saved' : '❌ Save failed';
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
    this.log('💾 Crawl settings saved', 'success');
  }

  // ================================================================
  // 🛠️ HELPER FUNCTIONS
  // ================================================================

  escape(t) {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }
}

// ================================================================
// 🚀 LAUNCH
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  const ui = new PopupController();
  window.ui = ui;
});