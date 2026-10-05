## Description
Please include a summary of the change and which issue it addresses.

Fixes # (issue)

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds reconnaissance functionality)
- [ ] Zero false-positive heuristic improvement
- [ ] Documentation update
- [ ] UI / Terminal aesthetic enhancement

## Testing Checklist
- [ ] Verified syntax with `node --check background.js`, `node --check content.js`, `node --check popup.js`
- [ ] Loaded unpacked in Chromium browser and tested active tab extraction
- [ ] Verified that XML/SVG namespaces and broken closing tags are NOT captured as endpoints
- [ ] Confirmed zero errors in background service worker console
