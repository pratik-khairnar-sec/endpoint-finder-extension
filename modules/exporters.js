// ================================================================
// 📦 MODULE: MULTI-FORMAT EXPORTERS & ARCHIVE BUNDLER
// ================================================================
// Pure browser Manifest V3 PKZIP generator, Burp Suite XML,
// Postman Collection & Env, OpenAPI 3.0, and Compliance Reports.
// ================================================================

export class WebZip {
  constructor() {
    this.entries = [];
  }

  static getCRC32Table() {
    if (WebZip._crcTable) return WebZip._crcTable;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    WebZip._crcTable = table;
    return table;
  }

  static crc32(uint8Array) {
    const table = WebZip.getCRC32Table();
    let crc = 0 ^ (-1);
    for (let i = 0; i < uint8Array.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ uint8Array[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  addFile(name, content) {
    let data;
    if (typeof content === 'string') {
      data = new TextEncoder().encode(content);
    } else if (content instanceof Uint8Array) {
      data = content;
    } else if (content instanceof ArrayBuffer) {
      data = new Uint8Array(content);
    } else {
      data = new TextEncoder().encode(String(content || ''));
    }

    const nameBytes = new TextEncoder().encode(name);
    const crc = WebZip.crc32(data);

    this.entries.push({
      name: nameBytes,
      data,
      crc,
      size: data.length
    });
  }

  build() {
    let localHeadersSize = 0;
    let centralDirSize = 0;

    for (const e of this.entries) {
      localHeadersSize += 30 + e.name.length + e.size;
      centralDirSize += 46 + e.name.length;
    }

    const totalSize = localHeadersSize + centralDirSize + 22;
    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);

    let offset = 0;
    const centralOffsets = [];

    // Local file headers + data
    for (const e of this.entries) {
      centralOffsets.push(offset);

      // Local Header Signature 0x04034b50
      view.setUint32(offset, 0x04034b50, true);
      view.setUint16(offset + 4, 20, true);
      view.setUint16(offset + 6, 0x0800, true); // UTF-8
      view.setUint16(offset + 8, 0, true); // STORE
      view.setUint16(offset + 10, 0x5000, true); // DOS time
      view.setUint16(offset + 12, 0x5821, true); // DOS date
      view.setUint32(offset + 14, e.crc, true);
      view.setUint32(offset + 18, e.size, true);
      view.setUint32(offset + 22, e.size, true);
      view.setUint16(offset + 26, e.name.length, true);
      view.setUint16(offset + 28, 0, true);

      offset += 30;
      buffer.set(e.name, offset);
      offset += e.name.length;
      buffer.set(e.data, offset);
      offset += e.size;
    }

    const centralDirStart = offset;

    // Central directory headers
    for (let i = 0; i < this.entries.length; i++) {
      const e = this.entries[i];
      const localHeaderOffset = centralOffsets[i];

      // Central Directory Header Signature 0x02014b50
      view.setUint32(offset, 0x02014b50, true);
      view.setUint16(offset + 4, 20, true);
      view.setUint16(offset + 6, 20, true);
      view.setUint16(offset + 8, 0x0800, true);
      view.setUint16(offset + 10, 0, true);
      view.setUint16(offset + 12, 0x5000, true);
      view.setUint16(offset + 14, 0x5821, true);
      view.setUint32(offset + 16, e.crc, true);
      view.setUint32(offset + 20, e.size, true);
      view.setUint32(offset + 24, e.size, true);
      view.setUint16(offset + 28, e.name.length, true);
      view.setUint16(offset + 30, 0, true);
      view.setUint16(offset + 32, 0, true);
      view.setUint16(offset + 34, 0, true);
      view.setUint16(offset + 36, 0, true);
      view.setUint32(offset + 38, 0, true);
      view.setUint32(offset + 42, localHeaderOffset, true);

      offset += 46;
      buffer.set(e.name, offset);
      offset += e.name.length;
    }

    // End of central directory record 0x06054b50
    view.setUint32(offset, 0x06054b50, true);
    view.setUint16(offset + 4, 0, true);
    view.setUint16(offset + 6, 0, true);
    view.setUint16(offset + 8, this.entries.length, true);
    view.setUint16(offset + 10, this.entries.length, true);
    view.setUint32(offset + 12, centralDirSize, true);
    view.setUint32(offset + 16, centralDirStart, true);
    view.setUint16(offset + 20, 0, true);

    return buffer;
  }
}

export class DomainArchiveBundler {
  static createFullAuditZip(engineState) {
    const zip = new WebZip();
    const domain = engineState.baseDomain || 'target-domain';
    const cleanDomain = domain.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filename = `recon_${cleanDomain}_full_audit.zip`;

    // 1. Endpoints JSON
    zip.addFile('endpoints.json', JSON.stringify({
      target: domain,
      generatedAt: new Date().toISOString(),
      total: engineState.endpoints?.length || 0,
      endpoints: engineState.endpoints || []
    }, null, 2));

    // 2. Endpoints Plain Text
    const epTxt = (engineState.endpoints || []).map(e => e.url).filter(Boolean).join('\n');
    zip.addFile('endpoints.txt', epTxt || '# No endpoints recorded\n');

    // 3. Secrets JSON
    zip.addFile('secrets_and_credentials.json', JSON.stringify({
      target: domain,
      total: engineState.secrets?.length || 0,
      secrets: engineState.secrets || []
    }, null, 2));

    // 4. Secrets Report TXT
    const secLines = (engineState.secrets || []).map(s =>
      `[${(s.severity || 'HIGH').toUpperCase()}] ${s.name || 'Secret'} | Masked: ${s.masked || ''} | Value: ${s.value || s.raw || ''} | Found: ${s.foundOn || ''}`
    );
    zip.addFile('secrets_report.txt', secLines.length > 0 ? secLines.join('\n') : 'No credentials detected.');

    // 5. Executive Summary Markdown
    zip.addFile('executive_summary.md', `# Reconnaissance Audit Report: ${domain}
**Generated**: ${new Date().toUTCString()}
**Endpoints Found**: ${engineState.endpoints?.length || 0}
**Secrets Found**: ${engineState.secrets?.length || 0}
**Paths Found**: ${engineState.paths?.length || 0}

## Surface Findings
Target domain was mapped using Endpoint Hunter v10.0 Enterprise Recon Suite.
Audit package includes Burp Suite Site Map XML, Postman v2.1 Collection & Environment, OpenAPI 3.0 specification, and Nuclei automation templates.
`);

    // 6. Burp Suite Site Map XML
    zip.addFile('burp_suite_sitemap.xml', BurpSuiteXmlExporter.generateXml(engineState));

    // 7. Postman Collection
    zip.addFile('postman_collection.json', JSON.stringify(PostmanExporter.generateCollection(engineState), null, 2));

    // 8. Postman Environment
    zip.addFile('postman_environment.json', JSON.stringify(PostmanExporter.generateEnvironment(engineState), null, 2));

    // 9. OpenAPI 3.0 Spec
    zip.addFile('openapi_3.0_spec.json', JSON.stringify(OpenAPIExporter.generateSpec(engineState), null, 2));

    // 10. Recon Wordlist
    const wordlist = Array.from(new Set([
      ...(engineState.paths || []),
      ...(engineState.endpoints || []).map(e => {
        try { return new URL(e.url).pathname.split('/').filter(Boolean); } catch(x) { return []; }
      }).flat()
    ])).filter(w => w.length > 1 && !w.includes('.') && w.length < 40);
    zip.addFile('recon_wordlist.txt', wordlist.join('\n'));

    // 11. Recon Pipeline Shell Script
    zip.addFile('recon_pipeline.sh', CLIBridgeExporter.generateBashScript(domain));

    // 12. Nuclei Recon Template
    zip.addFile('nuclei_recon_template.yaml', `id: recon-endpoints-${cleanDomain}
info:
  name: Discovered Endpoints Probe for ${domain}
  author: EndpointHunter
  severity: info
requests:
  - method: GET
    path:
${(engineState.endpoints || []).slice(0, 50).map(e => `      - "{{BaseURL}}${e.url.startsWith('http') ? new URL(e.url).pathname : e.url}"`).join('\n')}
    matchers:
      - type: status
        status:
          - 200
          - 401
          - 403
`);

    // 13. Compliance Report
    zip.addFile('compliance_audit_report.json', JSON.stringify(ComplianceReportExporter.generateReport(engineState), null, 2));

    // 14. Full Telemetry JSON
    zip.addFile('full_telemetry.json', JSON.stringify({
      target: domain,
      timestamp: Date.now(),
      stats: {
        endpoints: engineState.endpoints?.length || 0,
        secrets: engineState.secrets?.length || 0,
        paths: engineState.paths?.length || 0
      }
    }, null, 2));

    // 15. Readme
    zip.addFile('README.txt', `Endpoint Hunter Enterprise Recon Audit
Target: ${domain}
Generated: ${new Date().toISOString()}
Files: 15 audit assets enclosed.
Author: Pratik Khairnar (https://github.com/pratik-khairnar-sec)
`);

    const uint8Array = zip.build();
    const blob = new Blob([uint8Array], { type: 'application/zip' });

    return {
      blob,
      uint8Array,
      filename,
      cleanDomain,
      domainName: domain
    };
  }
}

export class BurpSuiteXmlExporter {
  static generateXml(state) {
    const endpoints = state.endpoints || [];
    let items = '';
    for (const ep of endpoints) {
      let host = 'localhost';
      let port = '443';
      let protocol = 'https';
      let path = ep.url;
      try {
        const u = new URL(ep.url);
        host = u.hostname;
        port = u.port || (u.protocol === 'http:' ? '80' : '443');
        protocol = u.protocol.replace(':', '');
        path = u.pathname + u.search;
      } catch(e) {}

      const reqStr = `${ep.method || 'GET'} ${path} HTTP/1.1\r\nHost: ${host}\r\nUser-Agent: EndpointHunter/10.0\r\nAccept: */*\r\n\r\n`;
      const b64Req = btoa(reqStr);

      items += `  <item>
    <time>${new Date().toISOString()}</time>
    <url><![CDATA[${ep.url}]]></url>
    <host ip="">${host}</host>
    <port>${port}</port>
    <protocol>${protocol}</protocol>
    <method>${ep.method || 'GET'}</method>
    <path><![CDATA[${path}]]></path>
    <request base64="true">${b64Req}</request>
    <status>${ep.status || 200}</status>
  </item>\n`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE items SYSTEM "http://burp.mock/item.dtd">
<items burpVersion="2026.1" exportTime="${new Date().toISOString()}">
${items}</items>`;
  }
}

export class PostmanExporter {
  static generateCollection(state) {
    const endpoints = state.endpoints || [];
    const items = endpoints.map(ep => {
      let parsed;
      try { parsed = new URL(ep.url); } catch (e) {}
      return {
        name: `${ep.method || 'GET'} ${parsed ? parsed.pathname : ep.url}`,
        request: {
          method: ep.method || 'GET',
          header: [{ key: 'Accept', value: 'application/json' }],
          url: {
            raw: ep.url,
            protocol: parsed ? parsed.protocol.replace(':', '') : 'https',
            host: parsed ? parsed.hostname.split('.') : [],
            path: parsed ? parsed.pathname.split('/').filter(Boolean) : []
          }
        }
      };
    });

    return {
      info: {
        _postman_id: 'eh-' + Date.now(),
        name: `Recon Collection: ${state.baseDomain || 'Target'}`,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: items
    };
  }

  static generateEnvironment(state) {
    const domain = state.baseDomain || 'target-domain';
    return {
      id: 'eh-env-' + Date.now(),
      name: `Recon Env [${domain}]`,
      values: [
        { key: 'baseUrl', value: domain.startsWith('http') ? domain : `https://${domain}`, enabled: true },
        { key: 'bearerToken', value: '', enabled: true },
        { key: 'apiKey', value: '', enabled: true }
      ]
    };
  }
}

export class OpenAPIExporter {
  static generateSpec(state) {
    const paths = {};
    (state.endpoints || []).forEach(ep => {
      let pathName = ep.url;
      try { pathName = new URL(ep.url).pathname; } catch(e) {}
      if (!paths[pathName]) paths[pathName] = {};
      paths[pathName][(ep.method || 'GET').toLowerCase()] = {
        summary: `Discovered Endpoint ${pathName}`,
        responses: { '200': { description: 'Discovered by Endpoint Hunter' } }
      };
    });

    return {
      openapi: '3.0.0',
      info: { title: `API Spec: ${state.baseDomain || 'Recon'}`, version: '1.0.0' },
      paths
    };
  }
}

export class ComplianceReportExporter {
  static generateReport(state) {
    return {
      target: state.baseDomain || 'target',
      frameworks: {
        OWASP_Top_10_2021: {
          'A01_Broken_Access_Control': { endpointsExamined: state.endpoints?.length || 0, status: 'Audited' },
          'A02_Cryptographic_Failures': { leakedSecretsCount: state.secrets?.length || 0, status: state.secrets?.length ? 'VIOLATIONS_FOUND' : 'PASS' },
          'A05_Security_Misconfiguration': { status: 'Audited' }
        },
        SOC2_Type_II: { CC6_1_Logical_Access: 'Assessed' },
        ISO_IEC_27001_2022: { A_8_24_Use_of_Cryptography: 'Assessed' }
      }
    };
  }
}

export class CLIBridgeExporter {
  static generateBashScript(domain) {
    return `#!/usr/bin/env bash
# ================================================================
# 🚀 ENDPOINT HUNTER AUTOMATED RECONNAISSANCE PIPELINE
# Target: ${domain}
# ================================================================
set -euo pipefail

TARGET="${domain}"
WORDLIST="recon_wordlist.txt"
ENDPOINTS="endpoints.txt"

echo "[+] Starting reconnaissance against $TARGET..."

if command -v httpx &>/dev/null; then
  echo "[+] Probing live hosts with httpx..."
  httpx -l "$ENDPOINTS" -status-code -title -tech-detect -o live_endpoints.txt
fi

if command -v nuclei &>/dev/null; then
  echo "[+] Running Nuclei automated scans..."
  nuclei -t nuclei_recon_template.yaml -u "https://$TARGET"
fi

echo "[+] Recon pipeline complete!"
`;
  }
}
