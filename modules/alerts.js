// ================================================================
// 📢 MODULE: REAL-TIME TELEGRAM & WEBHOOK DISPATCHER
// ================================================================
// Dispatches rich HTML vulnerability summaries and attaches
// target domain-named ZIP archives via Telegram Bot API,
// Discord Webhooks, and Slack Webhooks.
// ================================================================

import { DomainArchiveBundler } from './exporters.js';

export class AlertDispatcher {
  static async sendTelegramAlert(config, engineState) {
    if (!config?.token || !config?.chatId) {
      return { success: false, error: 'Telegram Bot Token or Chat ID is missing.' };
    }

    const domain = engineState.baseDomain || 'target-domain';
    const totalEndpoints = engineState.endpoints?.length || 0;
    const totalSecrets = engineState.secrets?.length || 0;
    const totalPaths = engineState.paths?.length || 0;

    // 1. Compile Domain ZIP Archive
    const zipPackage = DomainArchiveBundler.createFullAuditZip(engineState);

    // 2. Format Rich HTML Message
    let msg = `⚡ <b>ENDPOINT HUNTER v10.0 RECON ALERT</b> ⚡\n`;
    msg += `🌐 <b>Target Domain:</b> <code>${domain}</code>\n`;
    msg += `🕒 <b>Timestamp:</b> <code>${new Date().toUTCString()}</code>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🔗 <b>Discovered Endpoints:</b> <code>${totalEndpoints}</code>\n`;
    msg += `📁 <b>Extracted Paths:</b> <code>${totalPaths}</code>\n`;
    msg += `🔑 <b>Leaked Secrets/Tokens:</b> <code>${totalSecrets}</code>\n`;

    if (totalSecrets > 0) {
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `⚠️ <b>CRITICAL SECRETS PREVIEW:</b>\n`;
      engineState.secrets.slice(0, 5).forEach((sec, idx) => {
        msg += `${idx + 1}. <b>${sec.name || 'Secret'}:</b> <code>${sec.masked || '••••••••'}</code> [${sec.severity || 'HIGH'}]\n`;
      });
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📦 <i>Complete audit package attached below (${zipPackage.filename}). Includes Burp XML, Postman Env, OpenAPI 3.0, and Nuclei templates.</i>\n`;
    msg += `👤 <b>Auditor:</b> Pratik Khairnar`;

    try {
      // Step A: Send HTML Summary
      const textUrl = `https://api.telegram.org/bot${config.token}/sendMessage`;
      await fetch(textUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: msg,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      // Step B: Send Domain ZIP Document
      const docUrl = `https://api.telegram.org/bot${config.token}/sendDocument`;
      const formData = new FormData();
      formData.append('chat_id', config.chatId);
      formData.append('caption', `📦 Full Recon Audit Archive: ${domain} (15 assets)`);
      formData.append('document', zipPackage.blob, zipPackage.filename);

      const docRes = await fetch(docUrl, {
        method: 'POST',
        body: formData
      });
      const docData = await docRes.json().catch(() => ({}));

      return {
        success: true,
        filename: zipPackage.filename,
        docResponse: docData
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  static async sendDiscordWebhook(webhookUrl, engineState) {
    if (!webhookUrl) return { success: false, error: 'Discord webhook URL is empty' };
    const domain = engineState.baseDomain || 'target-domain';

    const payload = {
      username: 'Endpoint Hunter Sentinel',
      embeds: [{
        title: `⚡ Recon Alert: ${domain}`,
        color: 0x00f0ff,
        fields: [
          { name: '🔗 Endpoints', value: String(engineState.endpoints?.length || 0), inline: true },
          { name: '🔑 Secrets', value: String(engineState.secrets?.length || 0), inline: true },
          { name: '📁 Paths', value: String(engineState.paths?.length || 0), inline: true }
        ],
        footer: { text: 'Endpoint Hunter v10.0 Enterprise' },
        timestamp: new Date().toISOString()
      }]
    };

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { success: res.ok };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  static async sendSlackWebhook(webhookUrl, engineState) {
    if (!webhookUrl) return { success: false, error: 'Slack webhook URL is empty' };
    const domain = engineState.baseDomain || 'target-domain';

    const payload = {
      text: `⚡ *Endpoint Hunter Recon Alert*: Target \`${domain}\` mapped with *${engineState.endpoints?.length || 0}* endpoints and *${engineState.secrets?.length || 0}* secrets.`
    };

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { success: res.ok };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
