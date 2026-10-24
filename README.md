# OSBio — Shimleabyte's Developer Workspace

OSBio is a static, OS-inspired portfolio. The interface is designed as a desktop environment: visitors can open app windows, switch focus through the dock, inspect real repositories, and explore a small simulated terminal.

The visual direction combines a midnight-blue interface, signal-yellow highlights, a restrained secondary palette, custom pixel-flow marks, editorial typography, and tactile card interactions. The pixel motif is a visual signature—not a substitute for real project content.

## Included applications

- **Projects** — verified repositories: [Mutabaah CLI](https://github.com/shimleabyte/mutabaah-cli) and [OSBio](https://github.com/shimleabyte/osbio).
- **About** — the principles behind this workspace.
- **Terminal** — local, simulated commands for exploring the portfolio. It does not run shell commands.
- **Connect** — GitHub and email links already present in the repository.

## Interactions

- Open applications from desktop shortcuts or the dock.
- Focus, drag, minimize, maximize, restore, and close desktop windows.
- Use the terminal's `help`, `about`, `projects`, `contact`, `open <app>`, and `clear` commands.
- On narrow screens, application windows become a single-window surface and dragging is disabled.
- Keyboard focus styles and reduced-motion preferences are supported.

## Tech

- HTML, CSS, and vanilla JavaScript
- No build step or UI framework
- Static hosting compatible

## Run locally

Serve the repository with any static HTTP server and open its root page. No dependency installation is required.

## Design principles

1. **Real work over fictional polish.** Project links must lead to actual repositories; no placeholder projects, metrics, or social accounts.
2. **The OS metaphor is the interaction model.** Windows and dock controls should behave like controls, not just resemble them.
3. **Pixel-flow is the signature.** Use the motif deliberately in the identity and wallpaper rather than as random decoration.
4. **Dark does not mean flat.** Use typography, surface depth, border contrast, and restrained hover shadows to establish hierarchy.
5. **Responsive by design.** A phone should feel like a deliberate workspace, not a squeezed desktop.

Visual and interaction QA should be completed in a real browser at desktop and mobile widths before merging any redesign branch.
