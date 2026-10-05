# Contributing to Endpoint Hunter

Thank you for your interest in improving Endpoint Hunter! We welcome contributions from the cybersecurity and developer communities.

---

## Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all participants with respect.

---

## How Can I Contribute?

### 1. Reporting Bugs
- Search existing issues before creating a new one.
- Use the **Bug Report** template.
- Include browser version, steps to reproduce, target site behavior, and browser console logs.

### 2. Suggesting Enhancements
- Use the **Feature Request** template.
- Explain why this feature would be valuable for security reconnaissance or penetration testing.

### 3. Pull Requests
1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feature/awesome-endpoint-filter
   ```
2. Make your improvements following the code standards:
   - Zero dependencies in extension runtime (vanilla JavaScript / Manifest V3).
   - Maintain the **zero false-positive** filtering guarantee.
   - Ensure `node --check <file>.js` passes without syntax errors.
3. Commit with concise, descriptive messages:
   ```bash
   git commit -m "feat: add GraphQL query parameter parsing"
   ```
4. Push to your fork and submit a Pull Request targeting `main`.

---

## Development Setup

No complex build steps or node package managers are required!

1. Clone your fork locally.
2. Open Chrome/Brave and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extension directory.
5. Inspect the background service worker via Chrome DevTools to view real-time crawl logs and engine diagnostics.
