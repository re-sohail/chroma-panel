---
"chroma-panel": patch
---

Replace the package-size badge in the README. The bundlephobia badge shields.io
serves is rate limited across the whole registry, so it rendered as an error
rather than a number. It now reports unpacked install size, read straight from
the npm registry.
