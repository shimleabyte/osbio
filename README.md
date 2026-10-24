# Shimleabyte — Developer Workspace

An interactive, static portfolio presented as a small developer environment. It combines a pixel-flow visual identity with a practical way to explore selected projects, technical decisions, and contact information.

## Design intent

The workspace should make projects easier to understand, not turn the operating-system metaphor into the main attraction.

- **Balanced entry:** a short, skippable intro leads into the workspace.
- **Pixel-flow identity:** pixel geometry and dissolution motifs act as recognizable accents rather than constant decoration.
- **Project-first navigation:** Projects, About, Terminal, and Contact are reachable from desktop shortcuts and the taskbar.
- **Adaptive mobile:** small screens use a single-window application surface instead of tiny overlapping windows.
- **Static by design:** no account, backend, or server-side data is required.

## Featured work

### Mutabaah CLI
A Go command-line project for managing mutabaah activities, with command handling and local JSON persistence.

- Repository: https://github.com/shimleabyte/mutabaah-cli

### OSBio
A vanilla HTML, CSS, and JavaScript workspace exploring application windows, navigation, and interface state.

- Repository: https://github.com/shimleabyte/osbio

Only projects with a verified repository or demo should be added. Fictional sample projects and dead placeholder links are intentionally excluded.

## Applications

- **Projects:** selected projects and engineering case studies.
- **About:** development interests and principles.
- **Terminal:** a small portfolio command interface, not an operating-system shell.
- **Contact:** confirmed contact channels.

A resume file is not included in this repository yet, so the Resume window states that limitation rather than offering a broken download.

## Run locally

Serve the repository root with any static HTTP server and open `index.html`. There is no build step or package installation.

## Scope and trade-offs

- No authentication or fake sign-in form.
- No arbitrary shell execution.
- No backend or database.
- Mobile prioritizes readable single-window navigation over desktop-style overlapping windows.
