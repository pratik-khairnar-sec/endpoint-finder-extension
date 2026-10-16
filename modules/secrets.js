// ================================================================
// 🔑 MODULE: SECRETS HARVESTER & ACTIVE VULNERABILITY VERIFIER
// ================================================================
// Features TruffleHog-style high-entropy regex patterns, Shannon
// entropy validation, and 1-click active vulnerability verification.
// ================================================================

export class SecretsEngine {
  constructor() {
    this.patterns = [
      { name: 'Google API Key', regex: /AIzaSy[A-Za-z0-9_-]{33}/g, type: 'google', severity: 'high' },
      { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, type: 'aws', severity: 'high' },
      { name: 'Stripe Live Secret Key', regex: /sk_live_[0-9a-zA-Z]{24,}/g, type: 'stripe', severity: 'critical' },
      { name: 'Stripe Publishable Key', regex: /pk_live_[0-9a-zA-Z]{24,}/g, type: 'stripe_pub', severity: 'low' },
      { name: 'Stripe Restricted Key', regex: /rk_live_[0-9a-zA-Z]{24,}/g, type: 'stripe', severity: 'high' },
      { name: 'GitHub Personal Access Token', regex: /gh[pous]_[A-Za-z0-9_]{36,255}/g, type: 'github', severity: 'critical' },
      { name: 'Slack Webhook URL', regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8}\/B[a-zA-Z0-9_]{8,12}\/[a-zA-Z0-9_]{24}/g, type: 'slack', severity: 'high' },
      { name: 'Discord Webhook URL', regex: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/[0-9]{18,20}\/[A-Za-z0-9_-]{60,70}/g, type: 'discord', severity: 'high' },
      { name: 'OpenAI API Key', regex: /sk-(?:proj-)?[A-Za-z0-9_-]{48,}/g, type: 'openai', severity: 'critical' },
      { name: 'Anthropic Claude API Key', regex: /sk-ant-[a-zA-Z0-9_-]{40,}/g, type: 'anthropic', severity: 'critical' },
      { name: 'Firebase Database URL', regex: /https:\/\/[a-zA-Z0-9_-]+\.firebaseio\.com/g, type: 'firebase', severity: 'high' },
      { name: 'SendGrid API Key', regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g, type: 'sendgrid', severity: 'high' },
      { name: 'Mailgun API Key', regex: /key-[0-9a-zA-Z]{32}/g, type: 'mailgun', severity: 'high' },
      { name: 'Twilio Account SID', regex: /AC[a-zA-Z0-9]{32}/g, type: 'twilio', severity: 'medium' },
      { name: 'Generic Bearer Token', regex: /bearer\s+[a-zA-Z0-9_\-\.]{30,}/gi, type: 'bearer', severity: 'high' },
      { name: 'JSON Web Token (JWT)', regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, type: 'jwt', severity: 'medium' }
    ];
  }

  // Calculate Shannon entropy (0.0 to 8.0)
  calcEntropy(str) {
    if (!str || typeof str !== 'string') return 0;
    const len = str.length;
    const freqs = {};
    for (let i = 0; i < len; i++) {
      const c = str[i];
      freqs[c] = (freqs[c] || 0) + 1;
    }
    let entropy = 0;
    for (const c in freqs) {
      const p = freqs[c] / len;
      entropy -= p * Math.log2(p);
    }
    return Math.round(entropy * 100) / 100;
  }

  scanText(text, sourceUrl = '') {
    if (!text || typeof text !== 'string') return [];
    const discovered = [];
    const seen = new Set();

    for (const rule of this.patterns) {
      const matches = text.match(rule.regex) || [];
      for (const m of matches) {
        const val = m.trim();
        if (seen.has(val)) continue;
        seen.add(val);

        const entropy = this.calcEntropy(val);
        // Exclude trivial false-positive repetitions
        if (val.length > 20 && entropy < 2.5) continue;

        const masked = val.length > 8
          ? val.slice(0, 4) + '••••••••' + val.slice(-4)
          : '••••••••';

        discovered.push({
          name: rule.name,
          type: rule.type,
          severity: rule.severity,
          value: val,
          raw: val,
          masked,
          entropy,
          foundOn: sourceUrl,
          foundAt: new Date().toLocaleTimeString(),
          timestamp: Date.now()
        });
      }
    }

    return discovered;
  }
}

export class SecretVulnerabilityVerifier {
  static async verifySecret(sec) {
    const type = sec.type || '';
    const val = sec.value || sec.raw || '';

    if (!val) {
      return { verified: false, verdict: 'ERROR', message: 'No credential value provided' };
    }

    if (type === 'google' || val.startsWith('AIzaSy')) {
      return await this.verifyGoogleKey(val);
    }
    if (type === 'stripe' || val.startsWith('sk_live_')) {
      return await this.verifyStripeKey(val);
    }
    if (type === 'firebase' || val.includes('.firebaseio.com')) {
      return await this.verifyFirebase(val);
    }
    if (type === 'aws' || val.startsWith('AKIA')) {
      return await this.verifyAws(val);
    }
    if (type === 'jwt' || val.startsWith('eyJ')) {
      return this.verifyJwt(val);
    }

    return {
      verified: true,
      verdict: 'MANUAL_REVIEW',
      severity: sec.severity || 'high',
      message: `Pattern identified as ${sec.name || 'API Key'}. Live automated probe not available for this vendor.`
    };
  }

  static async verifyGoogleKey(apiKey) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&q=test`;
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(6000) });
      const data = await res.json().catch(() => ({}));

      if (res.status === 200 || (data.error && data.error.message && data.error.message.includes('Custom Search Engine'))) {
        return {
          verified: true,
          verdict: 'VULNERABLE (ACTIVE & UNRESTRICTED)',
          severity: 'critical',
          message: 'Google API Key is live and responds to Custom Search API. Immediate key rotation & API restriction recommended.'
        };
      }
      if (data.error && (data.error.status === 'PERMISSION_DENIED' || data.error.message.includes('API key not valid'))) {
        return {
          verified: true,
          verdict: 'SECURED / INACTIVE',
          severity: 'low',
          message: 'Google API key is disabled, deleted, or properly restricted.'
        };
      }
      return {
        verified: true,
        verdict: 'RESTRICTED / LIVE',
        severity: 'medium',
        message: `HTTP ${res.status}: Key is registered with Google Cloud. IP/Referrer restriction may be active.`
      };
    } catch (e) {
      return { verified: false, verdict: 'TIMEOUT / NETWORK BLOCKED', message: e.message };
    }
  }

  static async verifyStripeKey(secretKey) {
    try {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${secretKey}` },
        signal: AbortSignal.timeout(6000)
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 200) {
        return {
          verified: true,
          verdict: 'CRITICAL (FULL STRIPE ACCESS)',
          severity: 'critical',
          message: 'Stripe Secret Key is LIVE with unrestricted account balance read access. Immediate revocation required!'
        };
      }
      if (data.error && data.error.message && data.error.message.includes('Invalid API Key')) {
        return {
          verified: true,
          verdict: 'INVALID / REVOKED',
          severity: 'low',
          message: 'Stripe Key has already been revoked or is invalid.'
        };
      }
      return {
        verified: true,
        verdict: 'RESTRICTED PERMISSIONS',
        severity: 'high',
        message: `HTTP ${res.status}: Stripe recognized the key but restricted balance endpoint.`
      };
    } catch (e) {
      return { verified: false, verdict: 'NETWORK ERROR', message: e.message };
    }
  }

  static async verifyFirebase(dbUrl) {
    try {
      const cleanUrl = dbUrl.replace(/\/+$/, '') + '/.json?shallow=true';
      const res = await fetch(cleanUrl, { method: 'GET', signal: AbortSignal.timeout(6000) });
      const text = await res.text().catch(() => '');

      if (res.status === 200 && text !== 'null' && !text.includes('Permission denied')) {
        return {
          verified: true,
          verdict: 'CRITICAL (UNAUTHENTICATED PUBLIC READ)',
          severity: 'critical',
          message: 'Firebase Realtime Database is completely exposed without security rules. Public read successful!'
        };
      }
      return {
        verified: true,
        verdict: 'SECURED (RULES ENFORCED)',
        severity: 'low',
        message: 'Permission denied: Firebase security rules are active and require authentication.'
      };
    } catch (e) {
      return { verified: false, verdict: 'NETWORK ERROR', message: e.message };
    }
  }

  static async verifyAws(accessKeyId) {
    return {
      verified: true,
      verdict: 'POTENTIALLY ACTIVE IAM CREDENTIAL',
      severity: 'high',
      message: `AWS IAM Access Key ID detected (${accessKeyId.slice(0, 4)}...). Full verification requires AWS SigV4 signed request with secret key.`
    };
  }

  static verifyJwt(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { verified: false, verdict: 'INVALID JWT', message: 'Malformed token structure' };
    }
    try {
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const isNone = header.alg && header.alg.toLowerCase() === 'none';
      const isExpired = payload.exp && payload.exp < (Date.now() / 1000);

      if (isNone) {
        return { verified: true, verdict: 'CRITICAL (ALG=NONE BYPASS)', severity: 'critical', message: 'Signature validation bypassed via alg=none!' };
      }
      if (isExpired) {
        return { verified: true, verdict: 'EXPIRED TOKEN', severity: 'low', message: `Expired on ${new Date(payload.exp * 1000).toLocaleDateString()}` };
      }
      return { verified: true, verdict: 'ACTIVE JWT', severity: 'medium', message: `Signed with ${header.alg}. Subject: ${payload.sub || 'unknown'}` };
    } catch (e) {
      return { verified: false, verdict: 'DECODE FAILED', message: e.message };
    }
  }
}
