# OSBio — Pixel-Flow Instrumental Desktop

OSBio is a static portfolio presented as a desktop environment. The interface keeps its OS metaphor—system bar, app shortcuts, dock, movable windows, and a simulated terminal—while the visual system combines instrument-panel structure, editorial typography, and a hand-built pixel-flow mark.

## Included applications

- **Projects** — the real [Mutabaah CLI](https://github.com/shimleabyte/mutabaah-cli) and [OSBio](https://github.com/shimleabyte/osbio) repositories, with implementation notes tied to their source.
- **About** — working principles and current project context.
- **Terminal** — simulated local commands for exploring the portfolio. It does not execute shell commands.
- **Connect** — GitHub and email destinations already present in the project.

## Interaction model

- Open applications from desktop shortcuts or the dock.
- Focus, drag, minimize, maximize, restore, and close app windows.
- Use terminal commands: `help`, `about`, `projects`, `contact`, `open <app>`, and `clear`.
- On narrow screens, app views use a single-window surface and dragging is disabled.
- Keyboard focus styles and reduced-motion preferences are supported.

## Visual system

- **Carbon / Graphite** — desktop and system chrome.
- **Paper** — readable app surfaces and editorial project notes.
- **Signal yellow** — selected controls and key state.
- **Flow teal** — the restrained pixel-flow signature.
- **IBM Plex Sans + IBM Plex Mono** — editorial and technical typography.
- Custom CSS pixel glyphs, not a third-party icon set.

The stylesheet intentionally avoids gradient wallpapers, glass effects, blur, decorative glow, and generic three-card layouts. The pixel-flow geometry is a deliberate identity detail, not a substitute for project evidence.

## Tech

- HTML, CSS, and vanilla JavaScript
- No build step or UI framework
- Static hosting compatible

## Run locally

Serve the repository with any static HTTP server and open its root page. No dependency installation is required.

## Verification checklist

Before merging, test at desktop and mobile widths: boot dismissal, project links, window focus and stacking, drag, minimize, maximize/restore, close, terminal commands, keyboard focus, responsive overflow, and reduced-motion behavior. Confirm the actual rendered site in a browser; source inspection alone is not visual QA.
