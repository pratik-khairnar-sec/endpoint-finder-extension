# Changelog

All notable changes to **Endpoint Hunter** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-05

### 🚀 Initial Public Release

#### ✨ Core Capabilities
- **Manifest V3 Architecture**: Native Chrome extension service worker (`background.js`) with non-blocking event handling and strict Content Security Policy.
- **Deep AST & Regex Extraction**:
  - Scans external script bundles and inline `<script>` tags.
  - Intercepts `fetch()`, `axios` (get/post/put/delete), and jQuery `$.ajax` calls.
  - Inspects `XMLHttpRequest.open()` method calls.
  - Extracts endpoints from DOM attributes: `href`, `src`, `action`, `formaction`, and `data-*` properties.
- **Zero False-Positive Engine (`isFalsePositive`)**:
  - Drops XML and SVG schema namespaces (e.g. `w3.org`, `schemas.microsoft.com`).
  - Filters malformed closing HTML tag fragments (e.g. `/div>`, `/span>`, `/table>`).
  - Ignores template literal variables (`${...}`) and regex flag tokens.
  - Discards internal `node_modules`, `webpack`, and `core-js` artifacts.
- **Autonomous Recursive Crawler**:
  - Multi-depth page traversal with configurable boundary controls (`maxPages`, `maxDepth`).
  - Subdomain-aware domain filtering.
- **Stealth & Evasion System**:
  - Randomized human-like request pacing (2-10 seconds).
  - Kinetic scroll simulation and mouse jitter.
  - Automated User-Agent and Referer rotation.
- **Attack-Surface Triage**:
  - Automatic classification into `Admin`, `Auth / OAuth`, `API Routes (v1-v5)`, `GraphQL`, and `Sensitive Query Parameters`.
- **Flexible Exporting**:
  - One-click copy to clipboard.
  - Clean `TXT` URL list for CLI tools (`ffuf`, `nuclei`, `katana`).
  - Structured `JSON` export with full discovery metadata.
  - Printable `PDF` triage report.
- **Local Telegram Alerts**:
  - Instant notifications for high-priority administrative or authenticated routes (credentials stored purely in local browser storage).
- **Interactive Web Simulator**:
  - Interactive demonstration on GitHub Pages (`docs/index.html`) showcasing zero-noise endpoint parsing.
