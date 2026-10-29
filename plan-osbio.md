# OSBio — Improvement Plan

> **Status:** Proposed roadmap  
> **Target branch:** `main`  
> **Implementation status:** Previously verified phases remain documented below. The Product-grade Pixel-Flow revision is tracked in the implementation record at the end; each new acceptance gate remains open until its checks pass.  
> **Product direction:** A browser-based, local-first desktop environment with a distinctive Pixel-Flow identity—not a portfolio landing page decorated with window chrome.

## 1. Product definition

OSBio should feel like a coherent desktop workspace. The portfolio is its content, not its outer layout. The shell should provide predictable desktop conventions; apps should share state and behave like parts of one environment; the Pixel-Flow identity should emerge from the system's interaction language rather than from slogans or decorative effects.

### Product principles

1. **Desktop first, not hero first.** Boot directly into the workspace. No marketing hero, slogan, generic welcome panel, or automatic profile window.
2. **Behavior before decoration.** Focus, window lifecycle, input handling, persistence, and recovery must be reliable before another layer of visual polish is added.
3. **Local-first and honest.** Browser-local files and preferences may be provided, but never misrepresented as host operating-system capabilities. Do not invent CPU/RAM metrics, hardware access, authentication, or real shell execution.
4. **One coherent environment.** Apps use shared shell conventions, state and persistence rather than behaving as isolated portfolio cards.
5. **Pixel-Flow as a design language.** Pixel geometry, the signal-yellow/muted-green palette, restrained grid motifs, and purposeful state transitions should connect the whole environment.
6. **Accessible by keyboard and pointer.** Keyboard focus is visible and predictable; reduced-motion preference is respected; controls have semantic labels; touch remains practical on narrow screens.
7. **Vanilla remains maintainable.** Keep plain HTML, CSS and JavaScript, with no framework or build step unless a later decision explicitly changes that constraint.
8. **Verification is part of delivery.** A successful deployment alone does not prove interactions work.

## 2. Design constraints and non-goals

### Preserve

- The Pixel-Flow identity and dark charcoal, muted green, signal-yellow palette.
- The top system panel, desktop shortcuts, searchable launcher, taskbar, and independent app-window metaphor.
- A clean desktop by default, with no app automatically opened.
- The adaptive single-window experience on mobile instead of forcing a miniature multi-window desktop.
- The current plain HTML/CSS/JS architecture.
- Accurate project descriptions and repository links.

### Avoid

- Reintroducing generic portfolio headings, slogans, marketing sections, or SaaS-style feature cards.
- Treating a terminal simulation as a real host shell.
- Showing fictional system metrics or fabricated capabilities.
- Expanding the application roster while existing window and focus behavior remains unreliable.
- Visual effects that do not communicate a real interaction or state change.
- Duplicating other browser OS projects feature-for-feature merely to increase app count.

### Scope limits

OSBio is a browser application. Browser sandboxing, permission boundaries, storage limits, and reload behavior remain real constraints. The plan is to emulate useful desktop conventions within those boundaries, not build or claim to be a native operating system.

## 3. Benchmark references

Use these projects and guidelines as references for patterns, not as designs to copy.

### Desktop OS conventions

- [GNOME Human Interface Guidelines](https://developer.gnome.org/hig/) — discoverability, coherent app patterns, navigation and usable defaults.
- [GNOME window management](https://help.gnome.org/gnome-help/shell-windows.html) — switching and managing windows.
- [KDE Plasma](https://kde.org/plasma-desktop/) — launcher/search, configurable workspace and desktop activities.
- [Microsoft Snap Windows](https://support.microsoft.com/en-us/windows/experience/snap-your-windows) — arranging windows and restoring useful window groups.

### Browser desktop projects

- [daedalOS](https://github.com/DustinBrett/daedalOS) — broad browser desktop; useful reference for a virtual filesystem, IndexedDB persistence, file operations, context menus, drag-and-drop and app breadth.
- [MiniOS](https://github.com/0xMortuEx/MiniOS) — vanilla web desktop patterns, virtual filesystem, taskbar, window snapping and keyboard shortcuts.
- [WebOS by Martin R-D](https://github.com/Martin-R-D/WebOS) — apps and file operations that share a persistent environment.

**Benchmark conclusion:** a launcher, taskbar and draggable windows are not enough to make OSBio distinctive. Its opportunity is a small, carefully integrated local workstation whose state transitions can be inspected, with the Pixel-Flow visual language consistently tied to real behavior.

## 4. Current baseline and audit findings

This section records the known baseline when the plan was drafted. Re-check against `main` before each implementation phase; this is not a claim that every pointer and layout scenario has been browser-tested.

### Existing shell

- Skippable boot sequence and initially empty desktop.
- Top panel with active-app label, local-session label, clock and date.
- Searchable application launcher, including `Ctrl+K`.
- Desktop shortcuts and taskbar buttons.
- Window creation, focus, dragging, resize, maximize/restore, minimize and close.
- Narrow-screen single-window workspace behavior.
- Memory Match app with restart timer cleanup and keyboard-operable card buttons.
- Terminal-like interface with an explicitly simulated command set.
- Resume app deliberately reports that the PDF is unavailable instead of fabricating a preview.

### Existing apps

- **Profile:** background, focus and technologies.
- **Projects:** verified repositories and links.
- **Terminal:** simulated navigation commands and project links.
- **Resume:** unavailable-state explanation until a real document is published.
- **Contact:** email and GitHub.
- **Memory Match:** symbol-pair game.

### Known gaps to investigate or address

- The launcher close routine currently restores focus to the launcher toggle in every close case. Outside-click dismissal and app selection should not unexpectedly steal focus from the user's intended destination.
- Window lifecycle behavior needs a full test pass across focus order, rapid open/close actions, minimize/restore, maximize/restore, dragging, resize, viewport changes and mobile mode.
- The environment has no virtual file system, file manager, editor, settings app, workspace persistence or genuine event history.
- Project information currently lives directly in app templates; evaluate whether shared project metadata should become one source of truth.
- Legacy CSS and old components may remain from earlier screens; inventory and remove obsolete code only when safe and covered by checks.
- Deployment success and JavaScript syntax checks do not establish correctness of all visual, focus, pointer and responsive interactions.

## 5. Phased roadmap

Phases should be implemented in order. Each phase has an explicit release gate. Do not skip the gate because the UI appears finished.

### Phase 0 — Baseline, inventory and reproducible QA

**Goal:** understand what is actually running before changing architecture.

Tasks:
- [x] Reconfirm the current `main` SHA and GitHub Pages deployment workflow.
- [x] Inventory HTML regions, CSS sections, app templates, event listeners, timers and global state before duplicating existing features.
- [x] Map core window states and transitions: open, active, inactive, minimized, maximized, snapped, restored and closed.
- [x] Map shell keyboard shortcuts and event propagation for Escape, Ctrl/Cmd+K, Ctrl+Alt+W, Alt+F4, Ctrl/Cmd+N and file selection.
- [x] Identify and correct known defects separately from new features; record unresolved visual review separately.
- [x] Establish repeatable Chromium desktop and mobile browser smoke checks in CI.
- [ ] Capture and review baseline screenshots at representative desktop and narrow mobile viewport sizes.
- [x] Record pre-existing defects and verification status in this plan.

**Gate:** core interaction paths are reproducible in a real browser. Screenshot-based visual review remains an explicit outstanding task.

### Phase 1 — Window manager and input reliability

**Priority:** highest. No new app features should delay this phase.

Tasks:
- [x] Fix launcher focus restoration: preserve focus on the intended destination after Escape, outside-click dismissal and app launch.
- [x] Define the active-window invariant: at most one app window is active; when no visible window exists, the desktop is active. Verified through browser assertions after launch, switch, overview dismissal and mobile close.
- [x] Ensure z-order and active styling agree after state transitions. Browser test verifies close transfers active state and focus.
- [x] Verify taskbar launch, focus, minimize/restore and close behavior, including mobile taskbar app switching.
- [x] Make maximize/restore preserve valid bounds, including snap → maximize → restore.
- [x] Clamp windows after viewport changes and check bounds after shrinking and restoring the viewport.
- [x] Test pointer capture, pointer cancellation, fast movement and pointer release outside the header. Synthetic pointer cancellation confirms the drag listeners are removed.
- [x] Prevent drag initiation from titlebar controls and interactive content; browser test attempts a drag from the maximize control.
- [x] Define edge snapping and restore behavior, with a regression assertion that normal restored bounds don't cover desktop shortcuts.
- [x] Add a keyboard-friendly window overview and verify its shortcut and Escape focus restoration.
- [x] Validate mobile single-window mode, taskbar switching, closing the active app and returning to the empty desktop.
- [x] Audit window dialog semantics, title labels, focus visibility and keyboard-accessible controls through source contracts and browser smoke checks.
- [x] Confirm lifecycle cleanup for Memory Match timers and app-level listeners on close.

**Acceptance criteria:**
- Repeated open/focus/minimize/restore/close sequences keep taskbar state, active label, visibility and z-order synchronized.
- No window can become permanently inaccessible off-screen.
- Closing a window leaves focus and active-window state in a defined, usable place.
- Window controls don't accidentally initiate dragging.
- Resize and restore do not corrupt window geometry.
- Keyboard and mobile users can switch, minimize/maximize and close apps.

**Verification:** Chromium [40815679109](https://github.com/shimleabyte/osbio/actions/runs/40815679109) and deployment [40815678169](https://github.com/shimleabyte/osbio/actions/runs/40815678169) passed for commit `2aaf2264cb5aaa19550e5c2dbb9e3b2eea0366c8`.

### Phase 2 — Shared state and local persistence foundation

**Goal:** give OSBio state that survives window closure and page reload.

Tasks:
- [x] Define a small storage layer with versioned records and migration strategy (`osbio-workspace` IndexedDB v1, with localStorage/memory fallbacks).
- [x] Use IndexedDB for the virtual filesystem and localStorage for small preferences and window geometry.
- [x] Persist user-created files, settings and per-app normal window geometry without storing transient DOM references. Open windows are never restored on reload.
- [x] Define fallback paths for unavailable IndexedDB, localStorage write/quota errors, malformed imports and invalid layout records; IndexedDB v1 has a create-on-upgrade path.
- [x] Add a Settings action that confirms it removes user-created files/folders while preserving built-in read-only documents.
- [x] Add export/import for user-created content, rejecting duplicate IDs, invalid parents, non-folder parents and cycles before writing.
- [x] Keep project metadata separate from built-in read-only file entries and user-created entries.
- [x] Make reload recovery deterministic: never reopen active apps, clamp valid geometry to current viewport bounds, discard malformed geometry and emit recovery events.
- [x] Document that data is browser-local and is not automatically synced across browsers or devices.

**Acceptance criteria:**
- A note or file survives closing its app and reloading the page.
- Invalid or old stored data does not prevent the desktop from starting.
- Clearing user data does not silently delete application code or built-in project metadata.
- Import validation rejects malformed data with a useful message rather than a broken UI.
- Storage failures are visible and recoverable; the application does not claim a save succeeded before it does.

**Verification:** Chromium run [40814174899](https://github.com/shimleabyte/osbio/actions/runs/40814174899) and deployment [40814174713](https://github.com/shimleabyte/osbio/actions/runs/40814174713) passed for commit `95cdedb30ddea07cd7d114752ded8c6915ed45fc`.

### Phase 3 — Files and Editor applications

**Goal:** make the virtual environment useful beyond portfolio navigation.

#### Files app
- [x] Folder and file listing.
- [x] Breadcrumb navigation and a defined root.
- [x] Create, rename, move and delete operations.
- [x] Open supported text files in the Editor.
- [x] Context menu for common operations, with keyboard equivalents.
- [x] Empty, loading, error and permission/read-only states.
- [x] Clear distinction between built-in files and user-created files.
- [x] Mobile-friendly list layout and touch-sized targets.

#### Editor app
- [x] Open and edit text documents.
- [x] Save and reopen documents through the shared storage layer.
- [x] Unsaved-change indicator.
- [x] Explicit in-app Save, Discard and Keep editing actions for dirty close or file switching.
- [x] Basic plain-text editing and file metadata; avoid feature creep into a full IDE.
- [x] Empty, saved, failed-save and session-only states; multi-writer conflict handling is not claimed.

#### Seeded content
- [x] Provide real built-in workspace notes, System Notes and a project index with repository links.
- [x] Keep seeded content accurate and link back to the real repositories.
- [x] Avoid fake personal documents or invented artifacts merely to make the filesystem look populated.

**Acceptance criteria:** create a file, edit it, save it, close the app, reopen it and reload the page; the file and contents remain intact. Destructive actions are explicitly confirmed.

**Verification:** Chromium [40816267388](https://github.com/shimleabyte/osbio/actions/runs/40816267388) and deployment [40816267147](https://github.com/shimleabyte/osbio/actions/runs/40816267147) passed for commit `535564c70a298a3db564b6327558937e1985cf6c`, including System Notes migration into an existing workspace without data loss.

### Phase 4 — Settings and honest system information

**Goal:** allow the user to configure the environment and understand its actual state.

#### Settings
- [x] Wallpaper selection using a curated set of Pixel-Flow surfaces.
- [x] Accent or theme settings using the established palette; no unrelated gradient theme.
- [x] Motion preference that respects OS/browser reduced-motion settings.
- [x] Desktop icon visibility and basic workspace preferences where practical.
- [x] Reset layout and clear user data as separate, clearly explained actions.
- [x] Persist settings and apply them across the shell consistently.

#### System Monitor
- [x] Display the number of open and active windows.
- [x] Show the current active app and workspace state.
- [x] Show actual virtual storage character counts and file/folder counts from the storage API.
- [x] Display recent real system events from the event model.
- [x] Clearly label browser-environment limitations; the monitor does not fabricate host CPU/RAM/network metrics.

**Verification:** **Verification:** Chromium [40816898314](https://github.com/shimleabyte/osbio/actions/runs/40816898314) and deployment [40816897599](https://github.com/shimleabyte/osbio/actions/runs/40816897599) passed for commit `db2c700b626a5a0a0a1e5b1964d999c09079b27b`.

**Acceptance criteria:** changes persist through reload; system facts come from the app's real state. No fabricated CPU, RAM, battery, network or process metrics.

### Phase 5 — Flow Monitor: the signature Pixel-Flow feature

**Goal:** create a reason to explore OSBio beyond its project list.

Proposed feature: an **inspectable desktop**. A built-in Flow Monitor displays real environment events and state transitions so users can understand how the shell responds to actions.

Tasks:
- [ ] Define a small event schema: event ID, timestamp, event type, source app/window and minimal relevant details.
- [ ] Emit events from real transitions: app launched, window focused, minimized, restored, maximized, resized, closed, file saved and game completed.
- [ ] Do not log sensitive text content, contact details, or full document bodies by default.
- [ ] Display an ordered event stream with readable labels and event detail.
- [ ] Add filters by event category and source.
- [ ] Show empty, paused, cleared and capped-history states.
- [ ] Use a bounded in-memory history initially; decide separately whether user-visible history should persist.
- [ ] Avoid recursive logging where opening Flow Monitor causes event floods.
- [ ] Use Pixel-Flow visual grammar to show state changes, not decorative particle effects or a meaningless animated graph.
- [ ] Document which events are collected and where they live.

**Acceptance criteria:** every displayed event corresponds to an action that really occurred; filters work; event history is bounded; no claim is made that browser-local events are system-wide telemetry.

### Phase 6 — Projects and personal content integration

**Goal:** keep the real portfolio content valuable without making the shell feel like a website.

Tasks:
- [ ] Establish one verified source of truth for project names, descriptions, technologies and repository URLs.
- [ ] Use accurate project states: distinguish shipped functionality from prototypes, concepts and planned work.
- [ ] Connect Files and Editor to useful project documentation.
- [ ] Use source links that open safely in a separate tab when appropriate.
- [ ] Keep Profile concise and factual, with no forced marketing prose.
- [ ] Keep Contact direct and functional.
- [ ] Add Resume to the normal app set only when the real PDF or an accurate document is available; otherwise keep its unavailable state honest or remove the shortcut.
- [ ] Ensure all launcher, desktop and taskbar entries refer to valid apps.
- [ ] Keep the simulated terminal's available commands in sync with actual functionality.
- [ ] State clearly that terminal commands run only within the simulated OSBio environment.

**Acceptance criteria:** repository links and claims are correct; there are no broken app routes or fake download controls; duplicate project metadata cannot silently drift.

### Phase 7 — Pixel-Flow visual system

**Dependency:** phases 1–3 must be stable first.

Tasks:
- [ ] Audit and remove obsolete CSS and unused legacy screens after confirming they are not active dependencies.
- [ ] Define consistent tokens for spacing, borders, typography, shadows, focus, selection, disabled, error and success states.
- [ ] Standardize title bars, controls, tooltips, menus, dialog surfaces, scrollbars and app padding.
- [ ] Align desktop shortcuts, launcher entries and taskbar icons to one coherent pixel construction grammar.
- [ ] Keep colors purposeful: yellow for primary/selected signals, muted green for system flow and status, charcoal for shell surfaces.
- [ ] Make the active/inactive/minimized/maximized states distinguishable without relying solely on color.
- [ ] Use animation only when it clarifies a real state change; keep it short and respect reduced motion.
- [ ] Remove any remaining portfolio-style slogans and generic landing-page remnants.
- [ ] Review visual density and legibility at realistic window sizes.
- [ ] Ensure the mobile workspace is designed as a first-class mode.

**Acceptance criteria:** the shell looks like one designed environment across all apps; states remain understandable with keyboard focus and reduced motion; no visual-only changes break existing interaction tests.

### Phase 8 — Regression testing and release gate

Tasks:
- [ ] Add automated browser tests where practical, using the lightest maintainable setup compatible with the static repo.
- [ ] Keep a manual smoke-test checklist for behavior that automation does not cover.
- [ ] Test at desktop, tablet-ish and narrow mobile viewport sizes.
- [ ] Test keyboard-only navigation and visible focus.
- [ ] Test reduced-motion mode.
- [ ] Test reload and storage recovery.
- [ ] Test window lifecycle and app disposal.
- [ ] Test Memory Match: repeated turns, mismatches, rapid restart, matched-card re-selection, full completion and close during pending timer.
- [ ] Test opening and closing launcher through button, keyboard, outside click and app selection.
- [ ] Test browser console for uncaught errors and failed asset requests.
- [ ] Capture screenshots for visual regression at fixed viewports where feasible.
- [ ] Confirm deploy run corresponds to the exact tested commit.
- [ ] Update README and this plan when behavior changes materially.

**Release gate:**
- JavaScript syntax checks pass.
- Automated and manual critical-path checks pass.
- No uncaught errors during the smoke-test scenarios.
- Desktop and mobile layouts have been checked in a real browser.
- Deployment succeeded for the tested commit.
- Any known limitation is documented honestly.

## 6. Cross-cutting acceptance checklist

Before marking an app or phase finished, check the applicable items:

- [ ] **Behavior:** actions perform the advertised operation.
- [ ] **State:** current UI, taskbar, active label and internal state agree.
- [ ] **Lifecycle:** timers and app-specific resources are cleaned up.
- [ ] **Persistence:** save feedback is accurate; reload recovery is defined.
- [ ] **Failure:** empty, unavailable, invalid and error states are deliberately designed.
- [ ] **Accessibility:** semantic controls, labels, keyboard operation and visible focus.
- [ ] **Motion:** reduced-motion preference is respected.
- [ ] **Responsive:** narrow-screen behavior is deliberately designed, not merely shrunk.
- [ ] **Content:** project claims and repository links are verified.
- [ ] **Testing:** there is evidence of behavior, not only a successful build.
- [ ] **Documentation:** README and app descriptions match the shipped behavior.

## 7. Proposed keyboard conventions

Keep the bindings small and documented. Avoid handling keys when an input, textarea or editable element should receive them.

- `Ctrl/Cmd + K`: open the application launcher.
- `Escape`: dismiss a transient surface (launcher/menu/dialog) in the correct focus order; do not globally close app windows.
- `Alt + F4`: close the active app window where the browser/platform permits the event.
- Window switcher shortcut: decide and document during Phase 1; avoid conflicting with common browser shortcuts.
- Window snapping shortcuts: decide only after pointer snapping works and conflicts have been reviewed.
- Every shortcut should have an equivalent discoverable pointer action where practical.

## 8. Explicitly deferred ideas

Do not schedule these until the core desktop is reliable and the roadmap's acceptance gates are met:

- Full Linux/Windows application emulation.
- Real host-shell commands, privileged access or process control.
- Fake CPU, memory, battery, network or hardware readings.
- Cloud sync or multi-device accounts.
- A full programming IDE or broad application marketplace.
- Large numbers of novelty apps that do not share useful state.
- A new framework/build pipeline without a demonstrated maintainability need.
- Decorative animation, particle effects or visual rebrands that don't improve system behavior.

## 9. Execution order and definition of done

| Order | Deliverable | Required gate |
|---|---|---|
| 0 | Baseline inventory and reproducible checks | Current state is understood and testable |
| 1 | Window/focus/lifecycle reliability | Window and launcher interaction suite passes |
| 2 | Storage abstraction and persistence | Save/reopen/reload and failure paths pass |
| 3 | Files and Editor | Shared documents survive closure and reload |
| 4 | Settings and System Monitor | Preferences persist; displayed facts are real |
| 5 | Flow Monitor | Events are sourced from actual state changes |
| 6 | Project/content integration | Accurate metadata, functioning app routes and links |
| 7 | Pixel-Flow visual refinement | Visual changes preserve behavior and accessibility |
| 8 | Release verification | Browser, responsive, accessibility and deployment checks pass |

**Overall definition of done:** OSBio feels like one browser-based workstation rather than a portfolio in window-shaped containers. Core window behavior is predictable; apps share a persistent local environment; its signature Flow Monitor exposes real state changes; the Pixel-Flow identity is consistent; and every shipped capability is verified and described honestly.

---

## Change log

- **Initial plan:** consolidated the OS-behavior benchmarks, comparable browser desktop projects, current known gaps, phased feature roadmap, differentiation concept, quality gates and release checklist.


## Implementation progress

### Stage 0 — Baseline and smoke-test harness
- [x] Add dependency-free Node smoke tests for JavaScript syntax, shell landmarks, app-template references, lifecycle hooks, Memory Match timer cleanup, and focus/reduced-motion styles.
- [x] Document how to run the checks in the README.
- [ ] Run the Node test command in a checkout and establish real-browser baseline screenshots. These remain required; source inspection alone does not satisfy them.

### Stage 1 — Window manager and input reliability (first implementation pass)
- [x] Add an explicit window overview, reachable from the system panel and `Ctrl+Alt+W`.
- [x] Correct launcher focus behavior so app launch/outside-click dismissal does not forcibly return focus to the launcher button.
- [x] Align DOM focus with active-window state and restore focus after minimize/close.
- [x] Add left/right edge snapping and drag-to-restore for maximized/snapped windows on desktop-sized viewports.
- [x] Emit structured shell events for window lifecycle changes as a foundation for Flow Monitor.
- [ ] Run full browser pointer/focus/resize tests; this remains unverified without a live browser session.


### Stage 2 — Shared state and local persistence foundation (first implementation pass)
- [x] Add a versioned IndexedDB-backed virtual workspace store with localStorage/in-memory fallback.
- [x] Seed read-only example documents that accurately describe OSBio and the verified repositories.
- [x] Implement folder/file creation, safe save/rename/move/delete validation, export/import, storage statistics, and a bounded event history.
- [x] Report degraded storage modes as explicit events rather than silently pretending persistence is durable.
- [ ] Browser-test reload recovery, quota/permission failures, import collisions, concurrent tabs and schema upgrade behavior.


### Stage 3 — Files and Editor applications (first implementation pass)
- [x] Add the Files app with folder navigation, breadcrumbs, create/open/rename/delete controls, and empty/error states.
- [x] Add JSON export/import for user-created workspace content.
- [x] Add a Move to root operation for user-created items.
- [x] Add the Editor app with save, save-copy, dirty-state feedback, character count and document reload.
- [x] Add a cancellable before-close lifecycle event so dirty Editor documents can prevent accidental closure.
- [x] Connect Files to Editor through a shared file-opening event and dispose of app event listeners on close.
- [ ] Verify interactions, real IndexedDB persistence, import edge cases and unsaved-close confirmation in a real browser.


### Stage 4 — Settings and honest system information (first implementation pass)
- [x] Add settings for wallpaper variant, accent signal, motion preference and desktop shortcut visibility.
- [x] Persist preferences locally, apply them across the shell, and expose a storage-degraded event if persistence fails.
- [x] Add System Monitor values from the active-window snapshot and actual virtual filesystem statistics.
- [x] Show real event history without claiming access to host CPU, RAM, battery, network or process information.
- [x] Add separate preference-reset and user-file-clear actions.
- [ ] Browser-test preference reload, storage failure, event stream ordering and narrow-screen layout.


### Stage 5 — Flow Monitor: inspectable Pixel-Flow trace (first implementation pass)
- [x] Add bounded, tab-local event capture with a 160-event cap and subscriber API.
- [x] Emit real events for desktop boot, launcher transitions, app launch requests, window lifecycle, file/storage operations, settings changes and Memory Match transitions.
- [x] Add Flow Monitor filtering, event detail inspection, trace export and clear-history controls.
- [x] Keep event details small and avoid recording document bodies or host-machine telemetry.
- [ ] Browser-test event order, history cap, clear/export behavior, and cleanup while opening/closing Flow Monitor.


### Stage 6 — Project/content integration (first implementation pass)
- [x] Create `js/projectData.js` as the canonical project metadata catalogue with verified repository links and status labels.
- [x] Remove the unavailable Resume shortcut from the desktop and label its launcher entry as unpublished.
- [x] Connect Projects and Terminal to the shared catalogue; use one source for titles, descriptions, technologies, status and URLs.
- [ ] Verify all routes and project claims in a real browser.


### Stage 7 — Pixel-Flow visual system (first implementation pass)
- [x] Remove unused sign-in screen styling and legacy welcome/tagline styling from the active shell.
- [x] Remove old PDF preview/iframe styles that no longer match the honest Resume unavailable state.
- [x] Normalize feedback for disabled controls, pressed buttons and keyboard focus while preserving the Pixel-Flow palette.
- [x] Replace brittle escaped URL regex assertions with explicit string checks.
- [ ] Browser-check visual density, keyboard focus contrast, and mobile window/app styles before considering this stage complete.


### Stage 8 — Regression testing and release gate (first implementation pass)
- [x] Add a GitHub Actions workflow for the dependency-free source smoke tests on `main`, pull requests and manual dispatch.
- [x] Correct test assertions so the suite checks the intended identifiers and source contracts.
- [ ] Wait for and inspect the Actions run for the exact implementation commit.
- [x] Add Chromium browser smoke tests for launcher/overview navigation, project rendering, file save and reload persistence, settings persistence, Memory Match and mobile layout.
- [ ] Review the Chromium Actions result for the exact release commit and fix any regression it exposes.


### Browser-driven bug fixes
- [x] Fix initial desktop window placement so newly opened apps avoid the desktop shortcut lane when the viewport has sufficient space.
- [x] Add a Chromium assertion for that placement and retain the clickable desktop shortcut regression check.


### Browser-test follow-up
- [x] Explicitly expose the window manager on `window` so the Files-to-Editor bridge, System Monitor snapshot and browser lifecycle tests can access the same manager instance.
- [x] Make Editor save feedback distinguish durable browser storage from a memory-only session fallback.


### Browser-driven layout fix
- [x] Reset the legacy floating-taskbar horizontal transform, which shifted the full-width system taskbar off-screen after the shell rules took over.
- [x] Add a strict Chromium viewport-bounds assertion for taskbar controls before activating Files.
- [ ] Re-run the complete browser suite on the final commit and review the deployment.


### Browser-driven file handoff fix
- [x] Replace the mutable pending-file ID startup race with an explicit cancelable open-file request dispatched after Editor creation/mount.
- [x] Prevent switching documents from silently overwriting unsaved Editor changes; cancellation preserves the current document.
- [ ] Re-run Chromium file save/reload/open flow and confirm the document content appears in the reopened Editor.


### Browser test synchronization
- [x] Wait for the asynchronous IndexedDB document load and saved status after reopening a file, instead of asserting file contents immediately when the window first becomes visible.


### Stage 1 — Browser lifecycle coverage
- [x] Extend Chromium smoke coverage to include launcher keyboard focus return, left-edge snapping by pointer drag, maximize/restore, viewport resize bounds, minimize/restore through the overview, and focus transfer after close.
- [ ] Run the updated browser suite and address any interaction regression it exposes.


### Browser-driven overview layering fix
- [x] Move the window overview to the desktop shell top layer so snapped/maximized app windows cannot intercept overview controls.
- [ ] Re-run the expanded pointer/window lifecycle suite.

### Implementation pass — Stage 1 follow-up (2026-10-29)

Baseline was confirmed at `6bfdf196716c36af9fa83d4b79216b391ee2c4a9`. The repository already contains Phase 2–6 foundations (IndexedDB/local fallback storage, Files, Editor, Settings, System Monitor, Flow Monitor and shared project data) plus a Chromium browser-smoke workflow; those capabilities are being validated rather than duplicated.

- [x] Inspect the latest validation run (`40806503886`); source checks passed 13/13, while Chromium exposed a viewport-resize bounds failure.
- [x] Add deferred post-layout window clamping and observe desktop-layer size changes.
- [x] Add taskbar controls for Settings, System Monitor, Flow Monitor, Contact and Resume so every launcher app has explicit taskbar state.
- [x] Fix incorrectly escaped event-prefix matching in Files and System Monitor.
- [x] Preserve native button semantics for virtual-file rows.
- [x] Make Settings reset feedback distinguish durable preferences from session-only fallback.
- [x] Extend browser smoke coverage for settled resizing and taskbar minimize/restore.
- [ ] Re-run the browser workflow for this implementation commit. Resize, pointer, overview and persistence gates remain open until CI passes.

### Browser-driven snap/restore regression (2026-10-29)

- [x] Preserve the normal window rectangle captured before dragging to a snap edge or maximize target.
- [x] Pass that rectangle into snap/maximize state transitions so the restore geometry is not captured after the drag has already clamped the window at the edge.
- [x] Add a Chromium regression assertion that snap → maximize → restore leaves the window outside the desktop-shortcut lane.
- [x] Keep the desktop taskbar tooltip visible at normal widths; constrain horizontal scrolling to narrow workspace widths.
- [ ] Re-run Chromium to verify the restore bounds, overview hit targets, taskbar toggling and remaining smoke scenarios.

### Stage 1 — extended lifecycle regression coverage (2026-10-29)

- [x] Add a browser assertion that at most one app window is active after launch, app switching, and overview dismissal.
- [x] Exercise the keyboard window overview shortcut and Escape focus restoration.
- [x] Assert a drag beginning on a titlebar control does not snap or maximize the window.
- [x] Exercise Memory Match mismatch → restart and close → reopen sequences to detect stale timers.
- [x] Exercise mobile Files ↔ Memory Match switching, active-window close recovery, and empty-desktop return.
- [ ] Rerun Chromium and review the entire lifecycle sequence before closing Stage 1.

### Stage 1 — viewport restore diagnostic (2026-10-29)

- [x] Add a post-resize-cycle bounds assertion before testing desktop-shortcut hit targets; this separates stale geometry from pointer-layer interception.
- [ ] Keep the shortcut click test in place until the real-browser run confirms the restored window does not cover the shortcut lane.

### Stage 1 — pointer-cancellation coverage (2026-10-29)

- [x] Add a synthetic pointercancel regression to confirm the drag handler detaches pointermove/up/cancel listeners and does not continue moving the window.
- [ ] Execute the expanded Chromium suite before marking all Phase 1 gates complete.

### Stage 2 — persistent window geometry and import structure (2026-10-29)

- [x] Store normal per-app geometry in versioned `localStorage` key `osbio.window-layout.v1`.
- [x] Restore saved width, height, left and top on desktop while clamping them to the current workspace bounds.
- [x] Persist normal geometry after drag, CSS resize, close, snap and maximize; snap/maximize preserve the pre-state restore rectangle.
- [x] Never persist mobile fullscreen geometry and never restore an open-app list; every reload still starts at the empty desktop.
- [x] Validate import IDs, names, text payload sizes, parent existence, parent type, self-parenting and cycles before any write.
- [x] Add browser checks for close/reopen/reload geometry, empty-desktop reload, malformed layout recovery, malformed import rejection, and a valid nested import.
- [ ] Run the complete CI suite for this commit. Stage 2 release gate remains open until it passes.

### Stage 2 — portable export edge case (2026-10-29)

- [x] Rebase a user's direct child of an excluded built-in folder to the export root; preserve references between user-created folders and files.
- [x] Add a browser round-trip check that exports a nested user folder from built-in Documents, imports it, verifies its hierarchy and cleans up the test entries.
- [ ] Re-run the full validation and deployment workflow after this edge-case fix.

### Stage 2 — bounded workspace transfer (2026-10-29)

- [x] Add a 12 MiB serialized transfer ceiling before JSON parsing to prevent oversized import payloads from being parsed into memory.
- [x] Reject files over the transfer ceiling before calling `File.text()` in the Files app.
- [x] Refuse an export that would exceed the same ceiling, with a message that suggests splitting large files.
- [x] Add browser coverage for oversized import rejection and unchanged storage.
- [ ] Re-run browser validation and deployment before closing Stage 2.

### Stage 2 — fallback durability and byte-safe transfer checks (2026-10-29)

- [x] Enforce the transfer ceiling by UTF-8 byte size to match the browser File API instead of counting UTF-16 characters.
- [x] Test a Unicode payload that is below the character threshold but exceeds the byte threshold.
- [x] Test IndexedDB-unavailable localStorage fallback across reload.
- [x] Test write/quota-failure degradation to memory mode and confirm session-only files are not presented as durable across reload.
- [ ] Run full CI for these last Stage 2 hardening changes.

### Stage 3 — Files and Editor interaction pass (2026-10-29)

- [x] Preserve keyboard focus when selecting a file row instead of replacing the focused button node.
- [x] Implement a context menu reachable by pointer and Shift+F10/ContextMenu, with arrow navigation, Escape focus restore and read-only restrictions.
- [x] Implement a destination-aware Move dialog, excluding a folder and its descendants to prevent cyclic moves.
- [x] Add file-manager keys: Enter open, F2 rename, Delete, Ctrl/Cmd+N new file, Ctrl/Cmd+Shift+N new folder, Ctrl/Cmd+Shift+M move, Alt+Up parent folder.
- [x] Add Editor Ctrl/Cmd+S save and Ctrl/Cmd+Shift+S Save Copy.
- [x] Guard Files refresh and Editor load completion against stale asynchronous results.
- [x] Add browser regression coverage for context menu, rename/move, Enter-open, dirty close cancel/discard and Ctrl+S.
- [ ] Rerun Chromium and review failures before closing Phase 3.

### Stage 3 — explicit dirty-document decision dialog (2026-10-29)

- [x] Replace the native close confirmation with an in-app decision prompt.
- [x] Offer Save changes, Discard, and Keep editing as three separate actions.
- [x] Keep the prompt open if save fails; close only after a successful save or explicit discard.
- [x] Restore keyboard focus on Keep editing and allow Escape to cancel the prompt.
- [x] Reuse the same decision prompt when opening a different file while the current document has unsaved changes.
- [x] Add browser tests for all three decisions and for saved content surviving reopen.
- [ ] Run Chromium and deployment for this commit before fully closing Phase 3.

### Stage 3 — seeded system documentation and migration safety (2026-10-29)

- [x] Add read-only `System Notes.md` documenting actual shell shortcuts, storage behavior, transfer limits and host OS limitations.
- [x] Migrate newly introduced built-in documents into existing workspaces without replacing user-created records.
- [x] Add a browser regression that removes the new built-in record from an otherwise populated workspace, reloads, and verifies System Notes is restored while user content remains.
- [ ] Run Chromium and deployment for this migration change.

### Stage 4 — reset layout and honest Settings/System Monitor behavior (2026-10-29)

- [x] Add a dedicated Reset window layout action that clears persisted geometry and returns open windows to the default cascade.
- [x] Keep Reset preferences, Reset window layout and Clear user files separate; layout reset leaves preferences and files unchanged.
- [x] Extend browser checks for wallpaper, accent, reduced motion and desktop-icon preferences across reload and reset.
- [x] Verify saved geometry survives preference reset and is cleared only by layout reset.
- [x] Verify clear-user-data confirmation removes user-created content but preserves built-in read-only documents.
- [x] Verify System Monitor values match the live WindowManager snapshot and OSBioStorage stats/event history.
- [x] Run Chromium and deployment for this Stage 4 commit; both completed successfully.


## Product-grade Pixel-Flow revision — implementation record

**Direction:** product-grade browser workstation with exploratory multi-source research; Pixel-Flow remains the original visual identity. Reference patterns are evaluated across desktop environments, window managers, and interactive portfolios rather than copying one source.

**Delivered in this revision:**
- Self-host IBM Plex Sans and IBM Plex Mono WOFF2 assets with the original SIL Open Font License in `assets/fonts/OFL.txt`.
- Group the launcher into Core, Supporting, and Utilities tiers; search hides empty tier headings.
- Keep five core applications pinned in the taskbar. Supporting and utility apps are appended as session-recent controls on first launch and remain available after their windows close.
- Replace the Projects app's expandable-card interaction with a compact keyboard-operable selection list and a dedicated project detail pane.
- Add source and browser regression assertions for tier structure, local fonts, dynamic taskbar behavior, and project selection.
- Update README behavior and app-tier documentation.

**Acceptance gate:** the source checks and Chromium browser suite must pass on the resulting `main` commit. Visual review at desktop and mobile widths remains separate from automated interaction checks.
