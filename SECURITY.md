# Security Policy

## Supported Versions

Security updates and patches are actively maintained for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Security Model & Privacy Guarantees

Endpoint Hunter is designed with strict client-side isolation:

1. **Zero External Telemetry**: The extension does NOT transmit discovered endpoints, target hostnames, crawl depth, or user metrics to any remote server or third-party service.
2. **Local Credential Storage**: Optional Telegram Bot tokens and chat IDs are kept strictly in `chrome.storage.local` on your local workstation and never committed to source or dispatched elsewhere.
3. **DOM-based XSS Hardening**: All captured endpoints, attributes, and route strings extracted from arbitrary web targets are strictly treated as untrusted text and sanitized prior to injection into the UI DOM.
4. **Manifest V3 Content Security Policy**: Hardened policy (`script-src 'self'`) prevents arbitrary remote script execution or injection within extension views.

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential privacy flaw within Endpoint Hunter:

1. **Do not** file a public GitHub issue.
2. Email the maintainer directly at **`pratik-khairnar-sec@users.noreply.github.com`** or contact via GitHub Security Advisories.
3. Provide a clear description, reproduction steps, proof-of-concept payload, and the potential impact.
4. We aim to acknowledge reports within 48 hours and provide a coordinated disclosure plan and patch within 7 days.
