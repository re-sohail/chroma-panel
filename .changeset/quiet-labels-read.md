---
"chroma-panel": patch
---

The image mode's file input keeps an accessible name after an image is loaded.
The drop zone's label names it until then; once the preview replaces the drop
zone, the input is named "Choose a different image" and leaves the tab order,
since nothing on screen would show it had focus. Accessibility checkers no
longer report "Form elements must have labels" for a loaded image.
