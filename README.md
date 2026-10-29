# osbio

My portfolio, built as a small desktop OS: a boot screen, a dock, draggable windows and a terminal. Plain HTML, CSS and JavaScript, no build step.

**Live:** https://shimleabyte.github.io/osbio/

## Apps

| App | What it does |
|---|---|
| About | Bio, stack, interests |
| Projects | Expandable project cards |
| Contact | Email and GitHub |
| Resume | Honest unavailable state until a PDF is published |
| Terminal | `help`, `about`, `projects`, `contact`, `open <app>`, `clear` |
| Memory Match | Card-matching game |

Esc closes the focused window. Below 700px wide, windows open full screen above the dock.

## Run locally

```bash
git clone https://github.com/shimleabyte/osbio.git
cd osbio
python3 -m http.server 8000
```

Open http://localhost:8000. Any static server works.

The Resume app currently shows an explicit unavailable state because `resume.pdf` is not published in the repository. When the actual resume is ready, add it at the repo root as `resume.pdf` and restore the preview/download controls.

## Structure

```
index.html          boot, sign-in and desktop layers, dock
css/main.css        design tokens at the top (:root), then per-app styles
js/main.js          boot -> sign-in -> desktop flow
js/windowManager.js window templates, open/close/focus/drag, per-app logic
```

### Adding an app

1. Add a template to `CONFIG.windowTemplates` in `windowManager.js`.
2. Add a dock button in `index.html` with a matching `data-app`.
3. If it needs behaviour, hook it up in `setupWindowEvents`.

## Notes

- There is no backend. The sign-in screen is a visual step with no authentication.
- The only thing stored is a `sessionStorage` flag so the intro is skipped after the first pass in a tab. It clears when the tab closes.
- Windows are positioned with plain DOM and CSS, with no framework or library.

## License

See [LICENSE](LICENSE).
