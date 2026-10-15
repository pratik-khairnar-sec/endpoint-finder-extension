# Changelog

All notable changes to **Endpoint Hunter** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [10.0.0] - 2026-10-16

### 🏆 The Ultimate Enterprise Reconnaissance & Vulnerability Suite (v10.0)

#### 🎖️ Zero-Day Recon Orchestrator (`ZeroDayReconOrchestrator`)
- **Automated Multi-Layer Mission Coordinator**: Triggers a unified, non-blocking security audit across CORS preflight simulation, security headers, environment leaks, CRLF response splitting, and CSP whitelist bypasses.
- **Consolidated Executive Timeline**: Delivers instant pass/fail health indicators across the target application surface.

#### 📊 Security Scorecard & Real-Time CVSS v3.1 Engine (`SecurityScorecardDashboard`)
- **CVSS v3.1 Base Scoring**: Computes exact CVSS v3.1 vector strings and numeric scores (0.0 to 10.0) for every confirmed finding (e.g. Critical 9.8 for exposed API secrets, High 8.1 for credentialed CORS reflection).
- **Executive Posture Grade Gauge**: Evaluates cumulative risk points to render an attack surface grade (`A+`, `A`, `B`, `C`, `D`, `F`) with status indicators (`HARDENED` vs `ACTION REQUIRED`).

#### 🛡️ Enterprise MITRE ATT&CK Matrix Mapper (`MITREATTnCKMapper`)
- **Threat Actor TTP Alignment**: Automatically correlates discovered endpoints, secrets, and behaviors to official MITRE ATT&CK Enterprise techniques:
  - `T1592`: Gather Victim Host Information (Tech Stack Fingerprinter)
  - `T1595`: Active Scanning (Status Prober, Micro-Fuzzer, Parameter Miner)
  - `T1552`: Unsecured Credentials (Leaked AWS/API Keys, TruffleHog)
  - `T1190`: Exploit Public-Facing Application (REST & GraphQL Route Catalog)
  - `T1530`: Data from Cloud Storage (S3, GCS, Azure Blobs)
- **1-Click Sync & Matrix Inspection**: Instant visual breakdown of coverage across Reconnaissance, Initial Access, and Credential Access tactics.

#### 🌐 Interactive Attack Surface Topology Graph (`LiveSessionGraphVisualizer`)
- **HTML5 Canvas Network Graph**: Real-time interactive node-link visualization of the discovered endpoint topology.
- **Hierarchical Clustering**: Radiates from central origin into major routing clusters (`/api`, `/auth`, `/admin`, `/static`) with color-coded leaf status dots.

#### ⚙️ User-Configurable Custom Rules Engine (`CustomRulesEngine`)
- **Custom Heuristic Scanning**: Auditors can define tailored regex rules to discover proprietary internal token formats, staging hostnames (`*.corp.internal`), and unlinked debug profilers.

#### 🧠 Browser Memory Dump & State Inspector (`MemoryDumpInspector`)
- **SSR & Client Hydration State Audit**: Inspects `window.__NEXT_DATA__`, `window.__NUXT__`, `window.__INITIAL_STATE__`, and Redux stores for unmasked user PII, internal IDs, and tokens in browser memory.

#### 📋 Enterprise Compliance Report Exporter (`EnterpriseComplianceReportExporter`)
- **Standardized Framework Export**: Exports `compliance_report.json` mapping attack surface posture directly to:
  - **OWASP Top 10 (2021/2025)**: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A05 Security Misconfiguration.
  - **SOC 2 Type II**: Common Criteria CC6.1, CC6.6, CC7.1.
  - **ISO/IEC 27001:2022**: Annex A.8.8 (Technical Vulnerability Management) and A.8.26 (Application Security Requirements).

#### 💻 Hunter Ultimate CLI Orchestration Bridge (`HunterUltimateCLIBridge`)
- **1-Click CLI Automation Script**: Generates `recon_pipeline.sh` orchestrating `ffuf`, `httpx`, and `nuclei` with discovered parameters, wordlists, and status codes.

---

## [9.0.0] - 2026-10-16

### 📐 Schema Boundary Fuzzing, Deep Security Audits & Multi-Role Sessions (v9.0)

#### 📐 API Parameter Boundary & Type Fuzzer (`APISchemaFuzzer`)
- **Type-Aware Boundary Vectors**: Generates RFC boundary edge cases for integer, string, boolean, array, and object parameters (e.g. 32-bit/64-bit int limits, IEEE-754 precision limits, null bytes, unicode normalization `\uFEFF`, zero values).
- **1-Click Copy & Testing**: Instantly copy payloads or forward directly to Repeater.

#### ✈️ CORS Preflight & Credentials Simulator (`CORSPreflightSimulator`)
- **Active Preflight Simulation**: Sends safe `OPTIONS` preflight requests with customized `Origin`, `Access-Control-Request-Method`, and request headers.
- **Vulnerability Heuristics**: Flags dangerous origin reflection, wildcard CORS with credentials, and sandboxed null origin access.

#### 🛡️ Subresource Integrity (SRI) Auditor (`SubresourceIntegrityAuditor`)
- **Third-Party Dependency Audit**: Scans active page scripts and stylesheets loaded from external CDNs lacking `integrity="sha..."` attributes.
- **SHA-384 Hardening Tags**: Highlights external resources susceptible to CDN compromise or supply chain tampering.

#### 💉 CRLF Response Splitting Canary Prober (`CRLFInjectionDetector`)
- **HTTP Response Splitting Testing**: Safely injects encoded CRLF canary headers (`%0d%0aX-EH-Canary: InjectedCrlfValue1337`) into redirect parameters.
- **Zero False-Positive Verification**: Only confirms vulnerability if the injected canary header actually appears in HTTP response headers.

#### 📥 Hidden Form Field & Anti-CSRF Harvester (`HiddenFormFieldHarvester`)
- **DOM Form Inspector**: Discovers all `<form>` elements and hidden `<input type="hidden">` tags across visited pages.
- **CSRF Token Posture**: Flags state-changing forms (POST, PUT, DELETE) that lack anti-CSRF tokens (`_token`, `csrf_token`, `nonce`).

#### 🔐 Client-Side Cryptographic Weakness Auditor (`ClientSideCryptoAuditor`)
- **Insecure PRNG Detection**: Flags usage of `Math.random()` for generating tokens, session IDs, or nonces instead of `crypto.getRandomValues()`.
- **Legacy Hashes & Keys**: Detects client-side MD5 / SHA-1 hashing and embedded symmetric encryption keys.

#### 📱 Mobile Deep Link & Custom Scheme Harvester (`DeepLinkExtractor`)
- **Universal & Custom Schemes**: Extracts `slack://`, `intent://`, `market://`, `fb://`, `tg://`, `oauth://` and custom app schemes from DOM anchors and JavaScript bundles.
- **Intent Injection Audit**: Catalogs accepted deep link parameters to audit for unauthorized parameter hijacking.

#### 📁 Config & Sensitive File Leak Prober (`EnvFileExposeProber`)
- **Safe Environment Prober**: Scans origin for `/.env`, `/.env.local`, `/.git/config`, `/.git/HEAD`, `/docker-compose.yml`, and `/.well-known/security.txt`.
- **Strict Content Signature Verification**: Rejects SPA 200 OK fallback HTML responses to eliminate false positives.

#### 👥 Multi-Role Authorization Profile Switcher (`AdvancedSessionManager`)
- **Privilege Escalation & BOLA Testing**: Define and switch between multiple authorization profiles ("Admin", "User B / Low-Priv", "Guest").
- **1-Click Repeater Sync**: Apply active session headers straight into Repeater requests to test for Broken Object Level Authorization.

#### 🌐 Postman Environment Spec Exporter (`PostmanEnvironmentExporter`)
- **Postman Environment Export**: Generates an official `postman_environment.json` with pre-populated variables (`baseUrl`, `bearerToken`, `apiKey`) mapped from captured network traffic and secrets.

---

## [8.0.0] - 2026-10-16

### 🔬 Cryptographic Entropy, Stack Fingerprinting & Burp Suite Interoperability (v8.0)

#### 🎲 Shannon Entropy Calculation Lab (`ResponseEntropyCalculator`)
- **Mathematical Information Theory Scoring**: Computes Shannon entropy ($H = -\sum p_i \log_2 p_i$) on responses, headers, and tokens on a 0.0 to 8.0 scale.
- **Cryptographic & Secret Leak Heuristics**: Automatically flags high-randomness tokens (entropy $\ge$ 5.5) as potential API keys or credentials, and distinguishes between encrypted ciphertext vs standard static code.

#### 🏗️ Comprehensive Web Tech Stack Fingerprinter (`FingerprintMatrix`)
- **Multi-Layer Fingerprinting**: Identifies backend engines (Express.js, Django, Spring Boot, Ruby on Rails, PHP, ASP.NET) from response headers, session cookies, and runtime behaviors.
- **Modern SPA Stack Attribution**: Detects Next.js, Nuxt.js, React, and Angular from HTML structures and asset paths.

#### 📦 Burp Suite Target Site Map XML Exporter (`BurpSuiteXmlExporter`)
- **Native Burp XML Serialization**: Generates standard Burp Suite XML exports (`burp_sitemap.xml`) populated with URLs, hostnames, ports, methods, and status codes.
- **Instant Target Import**: Enables drag-and-drop ingestion straight into Burp Suite's Target Site Map tab.

#### 🛡️ CDN & JSONP CSP Bypass Evaluator (`CSPBypassEvaluator`)
- **Whitelist Exposure Analysis**: Checks `script-src` CSP directives against cataloged CDN endpoints (`cdnjs.cloudflare.com`, `ajax.googleapis.com`, `cdn.jsdelivr.net`, `unpkg.com`).
- **Bypass Attribution**: Warns when trusted CDNs allow loading older vulnerable JavaScript or arbitrary user packages.

#### 🔍 Interactive Regex Extraction Playground (`RegexExtractorPlayground`)
- **Live Regex Execution**: Run custom regular expressions with flags against all discovered endpoints, leaked secrets, and extracted paths in real time.
- **Group Capture & Deduplication**: Displays captured matches with match counts and distinct group representations.

#### 🍪 Deep Cookie Security Hygiene Auditor (`CookieSecurityAuditor`)
- **Attribute Hygiene Audit**: Evaluates cookies for `HttpOnly`, `Secure`, and `SameSite` flags.
- **Prefix Hardening Checker**: Flags cookies lacking `__Host-` or `__Secure-` defensive prefixes to prevent subdomain cookie tossing.

#### 🤖 Recursive Robots & Sitemap Harvester (`RobotsSitemapParser`)
- **Automated Discovery**: Recursively fetches `/robots.txt` and `/sitemap.xml`.
- **Disallowed Path Auto-Population**: Discovers high-value hidden admin and API paths from `Disallow:` directives and adds them directly to the active endpoint catalog.

#### 🌸 GraphQL Mock Operation Mapper (`GraphQLExtendedMapper`)
- **Synthetic Query Generator**: Automatically builds executable GraphQL queries and mutations from introspected type schemas.

#### 📝 Markdown Executive Summary Report Exporter (`MarkdownExecutiveSummaryExporter`)
- **C-Suite & Bug Bounty Ready**: Generates a polished `executive_summary.md` detailing discovered attack surface metrics, leaked secrets tables, and cloud asset inventories.

#### 🔌 WebSocket Payload Mutator (`WebSocketFuzzer`)
- **JSON Field Tampering**: Mutates specific JSON fields in captured WebSocket messages to test for input validation vulnerabilities over persistent socket channels.

---

## [7.0.0] - 2026-10-16

### 🎯 Polyglot Injection, SSRF & Active Automation Suite (v7.0)

#### 🎯 Server-Side Template Injection Prober (`SSTIAuditor`)
- **Multi-Engine Polyglot Evaluation**: Fires safe mathematical expressions (`{{7*7}}`, `${7*7}`, `#{7*7}`, `<%= 7*7 %>`, `{{7*'7'}}`) into discovered parameters.
- **Execution Verification**: Confirms vulnerabilities only when backend template engines evaluate and reflect `49` (or string repetition `7777777`) instead of the literal input string.

#### 💉 SQL Injection Error & Heuristic Detector (`SQLiHeuristicProbe`)
- **Vendor-Specific Error Signatures**: Detects SQL syntax error disclosures across MySQL, PostgreSQL, SQLite, Oracle, and Microsoft SQL Server.
- **Differential Length & Status Analysis**: Compares single-quote (`'`) mutated requests against clean baselines, flagging anomalous 500 status codes and significant body length shifts.

#### 📜 XML External Entity Expansion Prober (`XXEProber`)
- **Safe Canary Entity Injection**: Formulates non-destructive XML payloads containing internal entity definitions.
- **Automated Expansion Detection**: Flags endpoints where XML parsers actively expand entities into the returned response payload.

#### ☣️ Prototype Pollution Scanner (`ProtoPollutionScanner`)
- **Query Parameter Vectors**: Generates tailored prototype pollution probe URLs (`__proto__[eh_polluted]=1337`, `constructor[prototype][eh_polluted]=1337`).
- **Runtime DOM State Auditor**: Directly monitors `Object.prototype.eh_polluted` to detect client-side prototype pollution in production web applications.

#### 📊 Attack Surface Changelog & Route Diff (`APIChangelogDiffEngine`)
- **Session Snapshot Manager**: Captures point-in-time snapshots of all discovered routes, methods, and status codes.
- **Delta Analysis**: Instantly highlights newly exposed routes (`+ NEW`), deprecated or removed routes (`- REMOVED`), and HTTP status changes between scans.

#### 📖 Contextual Recon Wordlist Builder (`SensitiveFileWordlistHarvester`)
- **Target-Specific Dictionaries**: Automatically mines discovered paths, filenames, and query parameters to generate a clean, deduplicated wordlist (`wordlist.txt`).
- **Extension Permutations**: Automatically pairs extracted identifiers with sensitive backup and configuration extensions (`.json`, `.env`, `.bak`, `.old`, `.yml`, `.xml`, `.sql`).

#### 🌸 Client-Side Template Injection Auditor (`CSTIAuditor`)
- **Framework Fingerprinting**: Detects AngularJS (`ng-app`), Vue.js (`v-app`), and Alpine.js (`x-data`) in the active DOM.
- **Sandbox Test Vectors**: Provides tailored client-side template injection payloads for active verification.

#### 🌐 SSRF Parameter Harvester & Payloads (`SSRFHeuristicDetector`)
- **Deep Parameter Discovery**: Identifies URL-carrying parameters (`webhook_url`, `callback`, `dest`, `feed`, `proxy`, `endpoint`).
- **Cloud Metadata & Loopback Payloads**: Automatically provides standard internal loopback (`127.0.0.1`) and cloud metadata (`169.254.169.254`) test vectors with 1-click Mini-Repeater injection.

#### ⚡ Multi-Worker High-Concurrency Status Prober (`BulkStatusProberConcurrent`)
- **Worker Pool Architecture**: Probes hundreds of endpoints concurrently with 8 parallel worker threads.
- **Real-Time Progress Feedback**: Continuously updates discovered endpoint response codes without UI freezes.

#### 🧬 Automated Nuclei Template Exporter (`NucleiTemplateExporter`)
- **Ready-to-Scan YAML Templates**: Exports standard Nuclei YAML templates (`recon_nuclei_template.yaml`) targeting all discovered routes with status code matchers.

---

## [6.0.0] - 2026-10-16

### ⚡ Advanced Threat Assessment & Threat Intelligence Suite (v6.0)

#### 🌸 Advanced GraphQL Exploration (`GraphQLAdvancedExploration`)
- **Batch Query Amplification Tester**: Probes GraphQL endpoints with array batch queries to detect batching support, vulnerable to brute-force bypasses and DoS amplification.
- **Field Suggestion Schema Mapper**: Leverages GraphQL engine error suggestions ("Did you mean ...?") to systematically uncover hidden queries, types, and internal fields when introspection is blocked.

#### 🌐 Subdomain Takeover Analyzer (`SubdomainTakeoverAnalyzer`)
- **Dangling CNAME Signature Fingerprinting**: Checks target domains against known signatures for 10 cloud hosting services (GitHub Pages, AWS S3, Heroku, Fastly, Shopify, Tumblr, WordPress, Ghost, Bitbucket, Surge.sh).
- **Proactive Takeover Alerts**: Instantly alerts researchers to unclaimed cloud resources pointing to external domains.

#### 💥 Client-Side DOM XSS Source-to-Sink Taint Auditor (`DOMXSSAuditor`)
- **Runtime Taint Tracking**: Directly inspects inline scripts for dangerous data flows originating from browser sources (`location.hash`, `location.search`, `document.referrer`, `window.name`) terminating in unescaped execution sinks (`innerHTML`, `document.write`, `eval`, `setTimeout`).
- **Reflected DOM Parameter Scanner**: Identifies URL query parameters immediately reflected into form inputs without sanitization.

#### ↪️ Open Redirect Probe Engine (`OpenRedirectProbeEngine`)
- **Heuristic Parameter Scanner**: Identifies 18 common open redirect parameters (`redirect`, `return_to`, `next`, `url`, `dest`, `checkout_url`, etc.).
- **Manual Header Evaluation**: Probes endpoints with standard bypass vectors and verifies if the server returns HTTP 301/302 redirects with untrusted `Location` headers.

#### 🔑 OAuth 2.0 / OpenID Connect Flow Auditor (`OAuthFlowAuditor`)
- **Anti-CSRF State Validation**: Detects authorization requests missing the required `state` parameter, leaving users vulnerable to OAuth login CSRF.
- **Implicit Grant Deprecation Flag**: Warns against insecure `response_type=token` configurations transmitting bearer tokens in URL fragments.
- **Plaintext Transmission Warning**: Flags `redirect_uri` parameters using unencrypted HTTP protocols.

#### 🛡️ Web Application Firewall Fingerprinter (`WAFDetector`)
- **Multi-Vendor Signature Engine**: Analyzes response headers and block pages to identify Cloudflare, AWS WAF / CloudFront, Akamai Edge, Imperva Incapsula, Fastly, ModSecurity, F5 BIG-IP, and Sucuri.
- **Confidence Scoring**: Delivers high-confidence attribution to help auditors tune their stealth profiles and evasion strategies.

#### 🧪 Unkeyed Header Cache Poisoning Prober (`CachePoisoningProber`)
- **Unkeyed Request Header Injection**: Tests `X-Forwarded-Host`, `X-Host`, `X-Original-URL`, `X-Rewrite-URL`, and `X-Forwarded-Scheme`.
- **Reflection Detection**: Verifies if unkeyed inputs are mirrored in the response body or response headers, indicating a high probability of web cache poisoning.

#### 🕵️ Automated GitHub & Google Recon Dorks Builder (`GitDorkGenerator`)
- **Domain-Tailored Recon Queries**: Generates targeted dork links for GitHub and Google with 1-click execution.
- **High-Impact Dork Library**: Covers `.env` files, leaked RSA private keys, internal `/api/v1/` routes, exposed database backups (`.sql`, `.bak`), and unlisted subdomains.

#### ⏱️ Rate Limit & Concurrency Burst Analyzer (`RateLimitAnalyzer`)
- **Rapid Concurrency Burst Probe**: Executes 6 rapid requests within a tight window to test server throttling response.
- **Header Parsing**: Extracts and displays `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers.

#### 📄 Standalone Interactive HTML Recon Report Exporter (`HTMLReportGenerator`)
- **Self-Contained Executive Report**: Generates `recon_report.html` complete with modern Obsidian Cyberpunk styling, summary scorecards, responsive data tables, and zero external script dependencies.

---

## [5.0.0] - 2026-10-16

### 🛡️ Enterprise Vulnerability Assessment & Cloud Recon Suite (v5.0)

#### 🌐 Active CORS Origin Reflection & Credential Auditor (`CORSAuditor`)
- **Arbitrary Origin Probing**: Tests target endpoints against attacker origins (`https://evil-attacker.com`) and `null` origins via preflight OPTIONS and GET probes.
- **ACAC Credential Verification**: Detects critical misconfigurations where `Access-Control-Allow-Origin` reflects the request origin while `Access-Control-Allow-Credentials: true` is asserted.
- **One-Click cURL Proof Generator**: Generates an exact reproducible terminal command to immediately demonstrate findings in vulnerability reports.

#### 🔑 Real-Time JWT Inspector & Alg:None Generator (`JWTInspector`)
- **Dual-Pane Base64URL Decoder**: Instantly decodes and syntax-highlights both JWT Header and Claims Payload directly in the UI.
- **Automated Security Heuristics**: Detects unverified tokens, `alg: "none"`, symmetric HMAC secrets vulnerable to offline dictionary cracking, expired timestamp checks (`exp`), and sensitive claim extraction (`admin`, `role`, `email`).
- **One-Click Exploit Vectors**: Automatically synthesizes `Alg: None Bypass` tokens and `Null Signature` test vectors ready for immediate clipboard copying.

#### 📊 HTTP Security Headers Analyzer & Grading Engine (`SecurityHeadersAnalyzer`)
- **Letter Grade Scorecard (A+ to F)**: Mathematically scores target application posture from 0 to 100 based on defensive header coverage.
- **Deep Policy Inspection**: Audits `Content-Security-Policy` (`'unsafe-inline'`, `'unsafe-eval'`, wildcards), `Strict-Transport-Security` (`max-age`, `preload`), `X-Frame-Options` (Clickjacking), `X-Content-Type-Options` (MIME confusion), `Referrer-Policy`, and `Permissions-Policy`.
- **Actionable Remediation**: Provides concise security headers recommendations for hardening the target server.

#### 📜 Live Swagger 2.0 & OpenAPI 3.0 Spec Importer (`SwaggerImporter`)
- **URL & Raw JSON Parsing**: Ingests live API documentation URLs (`/swagger.json`, `/openapi.json`) or pasted JSON objects.
- **Automatic Endpoint Population**: Seamlessly extracts all paths, HTTP methods, operation descriptions, parameter dictionaries, and tags, populating the database in one click.

#### 🗄️ Runtime Client Storage & Cookie Auditor (`StorageAuditor`)
- **Multi-Store Audit**: Reads `window.localStorage`, `window.sessionStorage`, and `document.cookie` directly from the active page context.
- **XSS & Hijack Exposure Flags**: Highlights sensitive auth tokens stored in client storage and flags session cookies missing the critical `HttpOnly` security flag.

#### 💳 PII Data Leakage Detector (`PIIHeuristicDetector`)
- **Luhn Algorithm Validation**: Accurately detects Visa, MasterCard, Amex, and Discover card numbers with zero false positives.
- **Identity Leak Scanner**: Harvesters US Social Security Numbers (SSN), email addresses, and phone numbers in HTTP bodies.
- **Zero-Exposure Masking**: Displays preview tokens (`4111-XXXX-XXXX-1111`) to prevent sensitive data display on test screens.

#### ⚡ HTTP Verb Tampering Matrix (`VerbTamperMatrix`)
- **Multi-Method Probing**: 1-click test of 7 HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`) against any target endpoint.
- **Authorization Bypass Heuristic**: Flags differential anomalies where protected GET routes return 401/403 while alternative verbs return 200/204.

#### 🎯 Numeric IDOR Differential Sequencer (`IDORSequencer`)
- **Identifier Extraction**: Automatically isolates numeric object identifiers in URL paths (`/users/100`) and query parameters (`?id=100`).
- **Differential Variance Engine**: Sequentially probes neighboring identifiers, comparing status codes and byte lengths against the baseline to highlight potential Insecure Direct Object References.

#### ☁️ Multi-Cloud Storage Bucket Harvester (`CloudBucketCollector`)
- **Cloud Service Harvester**: Scans source code and network traffic for AWS S3, Google Cloud Storage, and Azure Blob storage buckets.
- **1-Click Public Access Prober**: Probes bucket root endpoints, classifying results into `PUBLIC_LISTABLE` (Critical), `PUBLIC_READ`, `ACCESS_DENIED`, or `DANGLING_BUCKET` (Subdomain Takeover risk).

#### 🐚 Executable Recon Bash Script Exporter (`BashCurlExporter`)
- **Colorized Shell Script**: Generates a self-contained `recon_audit.sh` bash script configured with ANSI terminal colors, automated timing loops, status categorization, and authorization token headers.

---

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
