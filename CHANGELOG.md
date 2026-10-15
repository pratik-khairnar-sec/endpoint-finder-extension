# Changelog

All notable changes to **Endpoint Hunter** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-10-16

### 🦅 Next-Gen Cyber Reconnaissance Suite (v4.0)

#### 🔌 Real-Time WebSocket (`ws://`, `wss://`) & SSE Interceptor
- **Bi-Directional Frame Monitor**: Intercepts `window.WebSocket` (`send` & `onmessage`) and `window.EventSource` (SSE) directly from page runtime.
- **Dedicated `🔌 WS / SSE` Tab**: Real-time traffic feed with direction tags (`WS ⬆ SEND`, `WS ⬇ RECV`, `SSE`), timestamps, endpoint URLs, and expandable payload viewer.
- **Zero Auto-Scan Adherence**: Only captures when runtime sniffer is explicitly activated by the user.

#### 🔍 In-Browser Parameter Miner (Arjun-Style Differential Engine)
- **Differential Variance Analysis**: Actively probes target endpoints with top 30 critical query parameters (`debug`, `admin`, `token`, `key`, `redirect`, `role`, etc.).
- **Baseline Comparison**: Compares response length, HTTP status code, and reflected values against initial baseline.
- **One-Click URL Injector**: Discovered parameters appear with confidence ratings (`HIGH (Reflected)`, `HIGH (Status Changed)`, `MEDIUM`) and a `+ URL` button to inject directly into the Mini-Repeater.

#### 🤖 SPA Headless DOM Walker (Dynamic Route Harvester)
- **Non-Destructive Sequential Clicker**: Simulates synthetic user interactions over navigation tabs, accordions, side menus, and dropdowns.
- **Strict Safety Filter**: Automatically avoids destructive UI elements (`delete`, `remove`, `logout`, `submit`, `data-danger`).
- **Dynamic API Surface Revealer**: Exposes lazy-loaded XHR/Fetch endpoints in modern Single Page Applications (React, Vue, Angular, Next.js).

#### 📦 Standard HTTP Archive (HAR 1.2) Exporter
- **Universal Toolchain Interoperability**: Generates standard HAR 1.2 archives from captured network traffic.
- **Direct Burp Suite & Caido Import**: 1-click `📦 HAR` button exports a file ready for drag-and-drop into Burp Suite, Caido, Postman, or Charles Proxy.

#### 🛡️ Cyber Falcon Radar Logo & High-Tech Visual Identity
- **Futuristic Brand Identity**: High-tech cyber falcon radar shield emblem with neon cyan/magenta styling.
- **Full Icon Set**: Crisp multi-resolution icons (`icon16.png`, `icon48.png`, `icon128.png`) and updated web showcase graphics.

---

## [3.0.0] - 2026-10-16

### 🚀 Enterprise Reconnaissance & Testing Suite (v3.0)

#### 🧪 In-Browser Mini-Repeater (Postman / Burp Suite Style)
- **Interactive Request Dispatcher**: Dedicated `🧪 Repeater` tab allowing immediate testing of discovered API routes directly inside the extension.
- **Arbitrary HTTP Methods**: Full support for `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, and `OPTIONS`.
- **Custom Headers & Payloads**: JSON and raw key-value headers editor, with JSON body payload support for mutation/action endpoints.
- **Live Response Inspector**: Captures HTTP status code with color-coded badges, latency measurement (`ms`), response size (`bytes`), complete response headers, and auto-formatted JSON body.
- **1-Click Integration**: Every discovered endpoint in the crawl list or sniffer feed now includes a `🧪 Repeater` button that automatically pre-populates the target URL and method.

#### 🌸 GraphQL Schema Introspector & Template Generator
- **Dedicated Introspection Engine**: Automatically runs standard `IntrospectionQuery` against target GraphQL endpoints (`/graphql`, `/api/graphql`, `/v1/graphql`, etc.).
- **Interactive Schema Tree**: Parses and categorizes all root Queries, Mutations, and Types with their respective argument definitions, types, and return types.
- **Automated Query Synthesizer**: Generates copyable, valid GraphQL query and mutation templates with sample parameters.
- **One-Click Repeater Bridge**: "Test in Repeater" buttons instantly launch generated GraphQL operations into the Mini-Repeater with pre-set `Content-Type: application/json` headers.

#### 🗺️ Source-Map (`.map`) Route Unpacker & Code Miner
- **Webpack & Vite Source Reconstructor**: Downloads and parses `.map` files (`sourcesContent` and `sources` lists).
- **Original Source Tree Explorer**: Reconstructs original TypeScript/JavaScript source paths (e.g. `src/api/auth.ts`, `pages/api/v1/users.ts`).
- **Hidden Route & Secret Extraction**: Scans unminified original source files for internal routes, private endpoints, and API keys that were stripped from bundled code.
- **Auto-Indexing**: Extracted routes are automatically indexed into the primary endpoint list and path repository.

#### 🕷️ Micro-Fuzzer & Route Dictionary Engine
- **Targeted Base URL Probing**: Probes target origin for high-value unlinked paths using non-destructive HEAD and GET requests.
- **Curated High-Value Wordlists**:
  - **API Documentation**: `/swagger.json`, `/openapi.json`, `/v2/api-docs`, `/api-docs`, `/swagger-ui.html`.
  - **Framework Actuators**: `/actuator`, `/actuator/health`, `/actuator/env`, `/actuator/metrics`, `/health`, `/metrics`.
  - **Admin Portals**: `/admin`, `/administrator`, `/console`, `/dashboard`, `/internal`, `/management`.
  - **Git & Config Leaks**: `/.env`, `/.git/HEAD`, `/config.json`, `/.well-known/security.txt`, `/robots.txt`.
  - **GraphQL & Debug**: `/graphql`, `/graphiql`, `/altair`, `/playground`, `/debug`.
- **Manual Start/Stop & Stealth Delays**: Strictly manual activation with randomized pacing to prevent rate limits or WAF triggering.
- **Live Hit Feed**: Real-time status badges (`200 OK`, `401/403 Protected`, `500 Error`) with 1-click "Send to Repeater" action.

#### 🔑 Global Authentication & Custom Headers Manager
- **Centralized Credential Store**: Stored in `chrome.storage.local` and seamlessly injected across all tools:
  - Authorization Header (e.g. `Bearer <jwt>` or `Basic <token>`)
  - Session Cookie string (e.g. `sessionid=...`)
  - Custom Headers (e.g. `X-API-Key`, `X-Tenant-ID`)
- **Universal Injection**: Automatically applied to Status Prober, Mini-Repeater, GraphQL Introspector, and Micro-Fuzzer requests.

#### 🛠️ Chrome DevTools Panel (`devtools.html` / `devtools.js`)
- **Native Developer Tools Integration**: Registers a dedicated "Endpoint Hunter" tab inside Chrome DevTools (`F12`), allowing researchers to perform reconnaissance side-by-side with Network and Console tabs.
- **Unified Responsive View**: Shares the fluid architecture with `sidepanel.html` for maximum desktop screen efficiency.

---

## [2.0.0] - 2026-10-16

### 🚀 Major Enterprise Recon Upgrade (v2.0)

#### 🛑 Manual Trigger Control (Zero Auto-Scanning)
- **Controlled Execution**: Automatic background scanning on page loads and tab changes has been completely disabled per user preference.
- **Manual Start**: The extension only starts scanning when clicking **`📡 SCAN (ALL)`**, **`🎯 SCAN CURRENT`**, or toggling **`▶ START SNIFFER`**.
- **Instant Kill Switch**: Clicking **`⏹ STOP`** immediately halts all crawlers, live status probers, and runtime network listeners.

#### 🔑 Client-Side Secrets & API Tokens Harvester
- **TruffleHog / SecretFinder Style Detection**: Automatic detection of leaked credentials in client-side bundles:
  - AWS Access Keys (`AKIA...`)
  - Google API Keys (`AIza...`)
  - GitHub Personal Access Tokens (`ghp_...`, `github_pat_...`)
  - Stripe Live & Test Keys (`sk_live_...`, `pk_live_...`)
  - Slack Webhooks (`hooks.slack.com`)
  - Discord Webhooks (`discord.com/api/webhooks`)
  - OpenAI API Keys (`sk-proj-...`, `sk-...`)
  - JWT Tokens (`eyJ...`)
  - Firebase Realtime Database URLs
  - Exposed Environment Variables (`NEXT_PUBLIC_*`, `REACT_APP_*`, `VITE_*`)
- **Dedicated Secrets Tab**: Displays severity ratings (`CRITICAL`, `HIGH`, `MEDIUM`), token types, masked values with reveal toggle, and one-click copy.
- **Dedicated Secrets Export**: One-click JSON export for discovered credentials.

#### 🪟 Chrome Side Panel (Persistent UI)
- Integrated Manifest V3 `chrome.sidePanel` (`sidepanel.html`).
- Allows the reconnaissance suite to stay pinned side-by-side with target applications while clicking and interacting with pages without closing.
- Added `🪟 SIDE PANEL` quick button in the popup header.

#### ⚡ Live Passive Network Sniffer
- Main-world injected hook (`injected.js`) for `window.fetch` and `XMLHttpRequest.prototype.open/send`.
- Dynamically intercepts real runtime API calls made by Single Page Applications with HTTP methods (`GET`, `POST`, `PUT`, `DELETE`), status codes, latency, and query params.
- Defaults to inactive with a manual **`▶ START SNIFFER`** toggle.

#### 🎯 Live Status Prober & Vulnerability Heuristics
- **Batch HTTP Status Prober**: Tests discovered endpoints to classify `200 OK`, `401/403 Protected`, `500 Server Error`, and `404 Not Found`.
- **Attack Surface Parameter Tagging**: Flags parameters for potential `SSRF/OpenRedirect`, `Potential IDOR`, `Potential LFI`, and `Privileged Route`.

#### 📦 Security Researcher Tooling & Exports
- **Copy as cURL**: Instant one-click copy `curl -i -k -s -X <METHOD> "<URL>"` for every discovered route.
- **Postman Collection (v2.1)**: Full JSON collection with requests, folders, and query parameters ready for Postman import.
- **OpenAPI 3.0**: Auto-generated OpenAPI JSON specification with paths, query params, and status codes.
- **Clean TXT**: Deduplicated list of endpoints ready for `ffuf`, `nuclei`, or `katana`.
- **Multi-Platform Alerts**: Expanded alerting support to include **Discord Webhooks** and **Slack Webhooks** alongside Telegram.

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
