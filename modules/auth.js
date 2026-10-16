// ================================================================
// 🔐 MODULE: AUTHENTICATION, SESSIONS & IDENTITY AUDITING
// ================================================================
// Handles Login credentials, Session Profiles (Admin/UserB/Guest),
// JWT Inspection, OAuth Flow Audits, Cookie Security, and Sensitive Exclusions.
// ================================================================

export const SENSITIVE_EXCLUSIONS = [
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

export class AuthManager {
  constructor() {
    this.globalAuth = {
      authHeader: '',
      cookieHeader: '',
      customHeaders: []
    };

    this.sessionProfiles = {
      Admin: { name: 'Admin', headers: {}, cookies: '', active: false },
      UserB: { name: 'UserB', headers: {}, cookies: '', active: false },
      Guest: { name: 'Guest', headers: {}, cookies: '', active: true }
    };
  }

  isSensitiveDomain(hostname) {
    if (!hostname) return false;
    return SENSITIVE_EXCLUSIONS.some(ex => hostname.toLowerCase().includes(ex));
  }

  setGlobalAuth(config) {
    this.globalAuth = { ...this.globalAuth, ...config };
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ globalAuth: this.globalAuth });
    }
  }

  getGlobalAuth() {
    return this.globalAuth;
  }

  switchSessionProfile(role) {
    if (!this.sessionProfiles[role]) return null;
    Object.keys(this.sessionProfiles).forEach(r => {
      this.sessionProfiles[r].active = (r === role);
    });
    return this.sessionProfiles[role];
  }

  saveSessionProfile(role, profileData) {
    if (!this.sessionProfiles[role]) {
      this.sessionProfiles[role] = { name: role, headers: {}, cookies: '', active: false };
    }
    this.sessionProfiles[role] = { ...this.sessionProfiles[role], ...profileData };
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ sessionProfiles: this.sessionProfiles });
    }
    return this.sessionProfiles[role];
  }

  // ================================================================
  // 🎫 JWT TOKEN INSPECTION
  // ================================================================
  inspectJWT(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Empty or invalid token format' };
    }

    const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT structure: Expected header.payload.signature' };
    }

    try {
      const headerStr = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
      const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const header = JSON.parse(headerStr);
      const payload = JSON.parse(payloadStr);

      const findings = [];
      let severity = 'low';

      // 1. Check for 'none' algorithm
      if (header.alg && header.alg.toLowerCase() === 'none') {
        findings.push('CRITICAL: Token uses "none" algorithm (Signature verification bypassed)');
        severity = 'critical';
      }

      // 2. Check for weak symmetric HMAC algorithms
      if (header.alg && header.alg.toUpperCase() === 'HS256') {
        findings.push('MEDIUM: Token uses symmetric HS256 HMAC (Susceptible to offline brute-force)');
        if (severity !== 'critical') severity = 'medium';
      }

      // 3. Expiration check
      const now = Math.floor(Date.now() / 1000);
      let isExpired = false;
      if (payload.exp) {
        if (payload.exp < now) {
          isExpired = true;
          findings.push(`INFO: Token expired at ${new Date(payload.exp * 1000).toISOString()}`);
        } else {
          findings.push(`OK: Token expires at ${new Date(payload.exp * 1000).toISOString()}`);
        }
      } else {
        findings.push('HIGH: Token has no expiration (exp claim missing, indefinite lifetime)');
        if (severity !== 'critical') severity = 'high';
      }

      // 4. Sensitive data check in payload
      const sensitiveKeys = ['password', 'secret', 'ssn', 'credit_card', 'pin', 'private_key'];
      for (const key of sensitiveKeys) {
        if (payload[key] !== undefined) {
          findings.push(`HIGH: Sensitive credential field "${key}" exposed in JWT payload`);
          if (severity !== 'critical') severity = 'high';
        }
      }

      return {
        valid: true,
        header,
        payload,
        isExpired,
        severity,
        findings,
        rawHeader: headerStr,
        rawPayload: payloadStr
      };
    } catch (e) {
      return { valid: false, error: 'Failed to decode JWT base64/JSON: ' + e.message };
    }
  }

  // ================================================================
  // 🔐 OAUTH 2.0 / OIDC FLOW AUDITING
  // ================================================================
  auditOAuthUrl(url) {
    try {
      const parsed = new URL(url);
      const findings = [];
      let score = 'A';

      const redirectUri = parsed.searchParams.get('redirect_uri');
      const responseType = parsed.searchParams.get('response_type');
      const state = parsed.searchParams.get('state');
      const codeChallenge = parsed.searchParams.get('code_challenge');

      if (!state) {
        findings.push({ severity: 'high', title: 'Missing CSRF State Parameter', desc: 'No state parameter found, leaving the flow vulnerable to Login CSRF.' });
        score = 'C';
      }

      if (responseType === 'token') {
        findings.push({ severity: 'high', title: 'Deprecated Implicit Grant Flow', desc: 'response_type=token leaks access tokens via browser URL fragment and referer headers.' });
        score = 'D';
      }

      if (redirectUri) {
        if (redirectUri.startsWith('http://') && !redirectUri.includes('localhost') && !redirectUri.includes('127.0.0.1')) {
          findings.push({ severity: 'critical', title: 'Insecure HTTP Redirect URI', desc: 'Tokens or authorization codes can be intercepted over unencrypted HTTP.' });
          score = 'F';
        }
      } else {
        findings.push({ severity: 'medium', title: 'Omitted redirect_uri Parameter', desc: 'Relying strictly on default pre-registered redirect URIs.' });
      }

      if (responseType === 'code' && !codeChallenge) {
        findings.push({ severity: 'medium', title: 'Missing PKCE (Proof Key for Code Exchange)', desc: 'code_challenge is absent; authorization code interception attacks possible on public clients.' });
      }

      return {
        url,
        score,
        findings,
        params: {
          redirectUri,
          responseType,
          hasState: !!state,
          hasPKCE: !!codeChallenge
        }
      };
    } catch (e) {
      return { error: e.message };
    }
  }

  // ================================================================
  // 🍪 COOKIE SECURITY ANALYSIS
  // ================================================================
  auditCookieString(cookieHeader) {
    if (!cookieHeader) return [];
    const cookies = cookieHeader.split(';').map(c => c.trim()).filter(Boolean);
    return cookies.map(c => {
      const [name, val] = c.split('=');
      const isAuthName = /session|token|auth|jwt|id|sid|access/i.test(name || '');
      return {
        name: name ? name.trim() : '',
        valueLength: val ? val.length : 0,
        isAuthRelated: isAuthName,
        note: isAuthName ? 'Potentially sensitive authentication/session cookie' : 'Standard tracking/preference cookie'
      };
    });
  }
}
