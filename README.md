# OSBio — Pixel-Flow Instrumental Desktop

OSBio is a static portfolio presented as an interactive desktop environment. The OS metaphor remains functional: application shortcuts, a taskbar, movable windows, window controls, a simulated terminal, and a Memory Match mini-game.

The visual direction combines instrument-panel labeling, editorial typography, and a hand-built pixel-flow identity. It uses Carbon and Graphite for the desktop, Paper for readable app surfaces, Signal yellow for key actions, and Flow teal as a restrained signature.

## Applications

- **Projects** — two repositories with verifiable source: [Mutabaah CLI](https://github.com/shimleabyte/mutabaah-cli) and [OSBio](https://github.com/shimleabyte/osbio). Placeholder entries were removed.
- **About** — development approach and current technology context.
- **Resume** — PDF preview/download UI wired to `resume.pdf`. The PDF is not included in this repository; add your actual document to the repository root to enable it.
- **Contact** — GitHub and email destinations already present in this repository.
- **Terminal** — simulated local commands. It does not execute shell commands.
- **Memory Match** — a small playable pairs game.

## Visual system

- Carbon / Graphite desktop and window chrome.
- Paper app surfaces with dark ink and steel dividers.
- Signal yellow and Flow teal for limited emphasis.
- IBM Plex Sans and IBM Plex Mono.
- Custom CSS pixel glyphs, not an icon package.
- No gradients, glass effects, blur, glow, or three-card catalog layout.

## Tech

HTML, CSS, and vanilla JavaScript. No build step or UI framework is required. The site is compatible with static hosting.

## Run locally

Serve the repository with any static HTTP server and open `index.html`.

To enable the Resume app, add your real PDF at the repository root as `resume.pdf`. Until that file exists, its preview and download links will not resolve.

## QA checklist

Test boot dismissal, all six apps, real project links, Resume only after adding the PDF, terminal commands, Memory Match pairs and restart, window focus, drag, minimize, maximize/restore, close, mobile single-window behavior, keyboard controls, and reduced-motion settings. Source checks cannot confirm the final rendered layout; verify desktop and mobile in a real browser before merging.
