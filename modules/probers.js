// ================================================================
// 🛡️ MODULE: ACTIVE SECURITY PROBERS, SCORECARD & MITRE
// ================================================================
// Non-destructive targeted probers for CORS, Security Headers,
// CVSS v3.1 impact calculations, MITRE ATT&CK correlation, and Fuzzing.
// ================================================================

export class CORSPreflightSimulator {
  static async simulateOptions(url, origin = 'https://evil-attacker.com', headers = {}) {
    try {
      const res = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'X-Custom-Header, Authorization',
          ...headers
        },
        signal: AbortSignal.timeout(6000)
      });

      const allowOrigin = res.headers.get('access-control-allow-origin');
      const allowCreds = res.headers.get('access-control-allow-credentials');
      const allowMethods = res.headers.get('access-control-allow-methods');
      const allowHeaders = res.headers.get('access-control-allow-headers');

      const isWildcard = allowOrigin === '*';
      const isOriginReflected = allowOrigin === origin;
      const hasCreds = allowCreds === 'true';

      let risk = 'LOW';
      let message = 'Standard CORS configuration';

      if (isOriginReflected && hasCreds) {
        risk = 'CRITICAL';
        message = 'Arbitrary origin reflected with Access-Control-Allow-Credentials: true (Full authenticated CSRF/data exfiltration risk)';
      } else if (isOriginReflected) {
        risk = 'HIGH';
        message = 'Arbitrary origin reflection without credentials (Unauthenticated data exfiltration possible)';
      } else if (isWildcard && hasCreds) {
        risk = 'HIGH';
        message = 'Invalid CORS configuration: Wildcard (*) with Allow-Credentials';
      }

      return {
        url,
        status: res.status,
        allowOrigin,
        allowCreds,
        allowMethods,
        allowHeaders,
        risk,
        message
      };
    } catch (e) {
      return { url, error: e.message };
    }
  }
}

export class SecurityHeadersAnalyzer {
  static analyze(headersObj = {}) {
    const headers = {};
    for (const k in headersObj) {
      headers[k.toLowerCase()] = headersObj[k];
    }

    const checks = [
      {
        header: 'content-security-policy',
        present: !!headers['content-security-policy'],
        severity: 'high',
        note: 'Restricts script sources and mitigates XSS'
      },
      {
        header: 'strict-transport-security',
        present: !!headers['strict-transport-security'],
        severity: 'high',
        note: 'Enforces HTTPS and prevents SSL stripping'
      },
      {
        header: 'x-frame-options',
        present: !!headers['x-frame-options'] || (headers['content-security-policy'] || '').includes('frame-ancestors'),
        severity: 'medium',
        note: 'Prevents Clickjacking via iframes'
      },
      {
        header: 'x-content-type-options',
        present: (headers['x-content-type-options'] || '').toLowerCase() === 'nosniff',
        severity: 'medium',
        note: 'Prevents MIME-type sniffing'
      },
      {
        header: 'referrer-policy',
        present: !!headers['referrer-policy'],
        severity: 'low',
        note: 'Controls information sent in Referer header'
      }
    ];

    const missing = checks.filter(c => !c.present);
    const score = Math.max(0, 100 - (missing.length * 20));

    return {
      score,
      totalChecked: checks.length,
      missingCount: missing.length,
      checks
    };
  }
}

export class APISchemaFuzzer {
  static generateTestVectors(type) {
    const vectors = {
      integer: [0, -1, 1, 2147483647, -2147483648, 9223372036854775807, 1e308, 'NaN', 'null'],
      string: [
        '',
        'A'.repeat(500),
        'A'.repeat(5000),
        "' OR '1'='1",
        '{{7*7}}',
        '<script>alert(1)</script>',
        '../../../etc/passwd',
        '%00',
        '\\u0000',
        '${jndi:ldap://test}'
      ],
      boolean: [true, false, 'true', 'false', 1, 0, null],
      array: [[], [null], new Array(100).fill('fuzz'), {}],
      object: [{}, { __proto__: { admin: true } }, null, []]
    };
    return vectors[type] || vectors.string;
  }
}

export class CVSSCalculator {
  static calculate(findingsCount = 0, secretsCount = 0, criticalCount = 0) {
    let score = 0.0;
    if (criticalCount > 0) score += 4.5;
    if (secretsCount > 0) score += Math.min(3.5, secretsCount * 0.8);
    if (findingsCount > 0) score += Math.min(2.0, findingsCount * 0.05);

    score = Math.min(10.0, Math.round(score * 10) / 10);

    let grade = 'A+';
    if (score >= 9.0) grade = 'F';
    else if (score >= 7.0) grade = 'D';
    else if (score >= 4.0) grade = 'C';
    else if (score >= 2.0) grade = 'B';

    return {
      score,
      grade,
      vector: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:${secretsCount > 0 ? 'H' : 'L'}/I:${criticalCount > 0 ? 'H' : 'N'}/A:N`
    };
  }
}

export class MITREMapper {
  static mapFindings(state) {
    const techniques = [];

    techniques.push({
      id: 'T1592',
      name: 'Gather Victim Host Information',
      tactic: 'Reconnaissance',
      status: 'Active Discovery',
      detail: `Mapped ${state.endpoints?.length || 0} client-side endpoints`
    });

    techniques.push({
      id: 'T1595',
      name: 'Active Scanning',
      tactic: 'Reconnaissance',
      status: 'Active Discovery',
      detail: 'Client-side DOM and AST asset extraction'
    });

    if (state.secrets && state.secrets.length > 0) {
      techniques.push({
        id: 'T1552',
        name: 'Unsecured Credentials',
        tactic: 'Credential Access',
        status: 'CRITICAL MATCH',
        detail: `Detected ${state.secrets.length} exposed keys or tokens`
      });
    }

    return techniques;
  }
}
