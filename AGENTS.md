# AGENTS.md

## Cursor Cloud specific instructions

This repository is a single, self-contained **static portfolio website** located in the `PORTFOLIO/` directory. There is no backend, database, package manager, build step, or test/lint tooling — `PORTFOLIO/index.html` is a standalone HTML file with inline CSS.

### Running the site (dev)
Serve the `PORTFOLIO/` directory with any static file server and open it in a browser:

```
cd PORTFOLIO && python3 -m http.server 8000
```

Then visit `http://localhost:8000/`. Serving over HTTP (rather than opening the `file://` path) is preferred so relative asset paths, the favicon, and the resume/image assets under `ASSETS/` resolve correctly.

### Notes / gotchas
- `python3` (3.12) and `node` (22) are preinstalled; no dependencies need to be installed, so the update script is effectively a no-op.
- There are no automated tests, lint, or build commands. "Testing" means loading the page and verifying it renders and the `#about` / `#projects` / `#contact` nav anchors update the URL hash.
- `ASSETS/CSS/STYLE.CSS` and `ASSETS/JS/SCRIPT.JS` exist but are currently empty placeholders and are **not** linked from `index.html` (all styling is inline in a `<style>` block). Editing them has no visible effect until they are wired into `index.html`.
- The page content fits within a single viewport, so clicking nav anchors changes the URL hash but produces no visible scroll — this is expected, not a bug.
