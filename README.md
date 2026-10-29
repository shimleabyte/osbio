# OSBio — Pixel-Flow Workstation

OSBio is a browser-based desktop environment built with plain HTML, CSS and JavaScript. It uses plain HTML, CSS and JavaScript, without a framework or build step.

**Live:** https://shimleabyte.github.io/osbio/

## Shell behavior

- A short, skippable boot sequence opens to an empty desktop. No app auto-opens and no profile is requested.
- The top panel identifies the active app and shows local-session status, clock and date.
- The application launcher supports search. Open it from the OSBio panel button or press `Ctrl+K`.
- Desktop shortcuts and the bottom taskbar open apps. Selecting the active taskbar item minimizes it; selecting it again restores it.
- App windows can be focused, dragged, resized on desktop, maximized/restored, minimized, and closed. Double-click a title bar to toggle maximize.
- On narrow screens, the shell becomes a single-window workspace with touch-sized controls and a launcher.
- Memory Match uses keyboard-operable symbol cards. Restart cancels pending turn timers.
- Resume shows an explicit unavailable state until the real PDF is published.

## Local workspace data

OSBio now initializes a browser-local workspace using IndexedDB, with a localStorage or in-memory fallback when IndexedDB is unavailable. The first run seeds read-only Documents and Projects folders. User-created files are stored locally in this browser; they are not synced to other browsers or devices. Storage capability and limitations are exposed to the desktop instead of pretending that persistence always succeeded.

The storage layer supports text files and folders, rename/move/delete validation, JSON export/import for user-created items, a bounded event history, and explicit storage status. It does not read or write the host operating system's file system.

## Apps

| App | Purpose |
|---|---|
| Profile | Background, current focus, and technologies used in the portfolio projects |
| Projects | Verified repositories: Mutabaah CLI, Simpul, and Optical Anchor Button |
| Terminal | Simulated prompt for exploring project links and opening apps |
| Resume | Explicit unavailable state; no fabricated preview or download |
| Contact | Email and GitHub |
| Memory Match | Small symbol-matching game |

The terminal is a UI simulation for navigating this browser workspace. It does not execute host operating-system commands.

## Run locally

```sh
git clone https://github.com/shimleabyte/osbio.git
cd osbio
python3 -m http.server 8000
```

Open http://localhost:8000. Any static file server works.

The actual resume PDF is not published in this repository. When ready, add the real document as `resume.pdf` and wire its preview/download controls deliberately.

## Structure

```
index.html          shell panels, desktop shortcuts, launcher, taskbar
css/main.css        design tokens, Pixel-Flow shell, and app styles
js/main.js          boot flow, launcher search, app routing, clock
js/windowManager.js app templates, window state, focus, drag and resize
```

## Interaction and accessibility

- Keyboard: `Ctrl+K` opens the launcher; `Escape` dismisses transient UI; `Alt+F4` closes the active app window.
- Window controls have explicit labels and visible focus states.
- Reduced-motion preference shortens boot and disables non-essential motion.
- This is a static portfolio, not an OS or an authentication system. It stores no user profile.

## License

See [LICENSE](LICENSE).

## Checks

Run the dependency-free source and shell-contract tests with Node.js 18 or newer:

```sh
node --test tests/source-smoke.test.mjs
```

These checks cover syntax and important source-level contracts. They do not replace browser testing for pointer, focus, layout, persistence, or responsive behavior.
