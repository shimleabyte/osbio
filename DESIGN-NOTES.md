# Pixel-flow workspace implementation notes

## Direction

- Balanced welcome flow: short boot, skippable, followed by a clear entrance to the workspace.
- Adaptive single-window behavior on mobile.
- Emerald pixel-flow identity with restrained violet accents.
- Projects and engineering decisions are the primary content; the OS metaphor supports discovery.

## First implementation slice

1. Replace the fake sign-in screen with a welcome screen that describes the portfolio and has a direct workspace action.
2. Remove invented project cards and placeholder social links. Feature only verified repositories, including `shimleabyte/osbio` and `mutabaah-cli` once the repository URL is verified.
3. Keep boot and intro transitions in `main.js`; the window manager owns app/window/taskbar state.
4. Provide desktop shortcuts as an alternative to taskbar navigation.
5. On narrow screens, show one window at a time with a fixed, reachable taskbar; do not depend on dragging.
6. Use a dark graphite base, emerald accent, muted violet, clear focus rings, and reduced-motion support.

## Acceptance checks

- No dead `#` project links or fictional portfolio entries.
- Taskbar opens/focuses windows through the window manager only.
- Keyboard users can skip the intro and operate launchers.
- Mobile windows fit between the system header and taskbar.
- The project stays static and dependency-free.

## Known follow-up work

- Refactor project cards into structured project records and shared command navigation.
- Add minimize/restore semantics and focus restoration tests.
- Verify repository URL and README facts for every featured project.
- Test desktop and mobile layouts in a browser before merging.
