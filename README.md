# Shimleabyte — Developer Workspace

An interactive, static portfolio presented as a small developer environment. It combines a pixel-flow visual identity with a practical way to explore selected projects, technical decisions, and contact information.

## Design intent

The workspace should make the projects easier to understand, not turn the operating-system metaphor into the main attraction.

- **Balanced entry:** a short, skippable intro leads into the workspace.
- **Pixel-flow identity:** pixel geometry and dissolution motifs are recognizable accents rather than constant decoration.
- **Project-first navigation:** Projects, About, Terminal, and Contact are reachable from both desktop shortcuts and the taskbar.
- **Adaptive mobile:** small screens use a single-window application surface rather than tiny overlapping desktop windows.
- **Static by design:** no account, backend, or server-side data is required.

## Featured work

### Mutabaah CLI
A Go command-line project for managing mutabaah activities. Its implementation includes command handling and local JSON persistence.

- Repository: https://github.com/mutabaah-cli

### OSBio
This project itself: a vanilla HTML, CSS, and JavaScript workspace exploring application windows, navigation, and interface state.

- Repository: https://github.com/shimleabyte/osbio

The project list should only contain projects with verified repositories or demos. It deliberately avoids fictional sample projects and dead placeholder links.

## Applications

- **Projects:** selected projects, repository links, and engineering case studies.
- **About:** development interests and principles.
- **Terminal:** a small portfolio command interface, not an operating-system shell.
- **Contact:** confirmed contact channels.

The resume launcher is intentionally omitted until a real resume asset is available. External social links are not fabricated.

## Run locally

Serve the repository root with any static HTTP server and open `index.html`. There is no build step or package installation.

## Scope and trade-offs

- No authentication or fake sign-in form.
- No arbitrary shell execution.
- No backend or database.
- Window behavior is progressively enhanced; mobile navigation prioritizes readability and touch interaction.
