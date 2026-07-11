# Tasks: Image Viewer Improvements

**Input**: Design documents from `specs/011-image-viewer-improvements/`

**Feature Branch**: `011-image-viewer-improvements`

**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md)

**Scope summary**: 2 files modified (`src/features/viewer/components/ViewerScreen.tsx`, `src/App.css`). No Rust changes. No new files. No store changes.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable — touches a different file or non-overlapping section of the same file
- **[US1–US4]**: User story this task belongs to

---

## Phase 1: Setup

**Purpose**: Confirm the baseline is stable before any changes are made.

- [X] T001 Verify baseline — run `pnpm vitest run` and confirm all existing tests pass; run `pnpm tauri dev` and confirm the viewer opens and navigates correctly

**Checkpoint**: Baseline confirmed — implementation can begin.

---

## Phase 2: User Story 1 — Zoom Controls (Priority: P1) 🎯 MVP

**Goal**: Zoom steps are bounded [0.5×–4.0×] with a 0.25× step; the cursor shows `grab` when zoomed and `grabbing` while dragging; the image stays centered at every zoom level.

**Independent Test**: Open any album → click `+` repeatedly (stops at 4.0×) → click `−` repeatedly (stops at 0.5×) → click reset (returns to 1.0×, centered) → zoom to 2.0× and drag (pans smoothly within bounds, cursor changes to `grabbing`).

### Implementation

- [X] T002 [P] [US1] In `src/features/viewer/components/ViewerScreen.tsx` — add `ZOOM_MIN = 0.5`, `ZOOM_MAX = 4.0`, `ZOOM_STEP = 0.25` constants; replace the three inline `onClick` lambdas on the zoom buttons with named handlers `handleZoomIn` (`Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP)`), `handleZoomOut` (`Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP)`), `handleZoomReset` (`setZoomLevel(1); setPanOffset({x:0,y:0})`); add `album-viewer-image-frame--zoomed` class to the frame `<div>` when `zoomLevel > 1` and remove the inline `cursor` style from that element

- [X] T003 [P] [US1] In `src/App.css` — add two rules after the existing `.album-viewer-image-frame` block: `.album-viewer-image-frame--zoomed { cursor: grab; }` and `.album-viewer-image-frame--zoomed:active { cursor: grabbing; }`

**Checkpoint**: Zoom controls are fully functional and bounded. Pan cursor reflects drag state via CSS `:active`. Application is in a runnable state.

---

## Phase 3: User Story 2 — Image Change State Reset (Priority: P1) 🎯 MVP

**Goal**: Every image navigation (click or keyboard) resets zoom to 1.0× and pan to center before loading the new image; the loading skeleton uses theme-appropriate colors.

**Independent Test**: Zoom to 2.0× and drag to a corner → press `Next` (or `ArrowRight`) → new image appears at 1.0×, centered → switch to dark theme → navigate to another image → skeleton uses dark gray colors (not light gray).

### Implementation

- [X] T004 [P] [US2] In `src/features/viewer/components/ViewerScreen.tsx` — add `setZoomLevel(1)` call inside `handlePrev` (before `goToImage`) and inside `handleNext` (before `goToImage`); `setPanOffset({x:0,y:0})` is already present in both handlers

- [X] T005 [P] [US2] In `src/features/viewer/components/ViewerScreen.tsx` — inside the keyboard shortcut `useEffect` callback, add `setZoomLevel(1); setPanOffset({ x: 0, y: 0 });` immediately before each of the four `goToImage()` calls (`ArrowLeft`, `ArrowRight`, `Home`, `End`); add `setZoomLevel` and `setPanOffset` to the effect's dependency array

- [X] T006 [P] [US2] In `src/App.css` — inside the existing dark theme overrides block, add:
  ```css
  :root[data-theme="dark"] .image-skeleton {
    background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
    background-size: 200% 100%;
  }
  :root[data-theme="dark"] .album-cover-skeleton {
    background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
    background-size: 200% 100%;
  }
  ```

**Checkpoint**: Navigating between images always starts fresh (zoom 1.0×, centered). Skeleton matches the active theme on both light and dark modes. Application is in a runnable state.

---

## Phase 4: User Story 3 — Thumbnail Strip (Priority: P2)

**Goal**: Thumbnail cards are portrait-shaped (≈ 64×85 px, 3:4 ratio) to match the natural image orientation; existing hover-reveal and hide behavior is preserved.

**Independent Test**: Open any album → thumbnail strip is hidden by default → hover over bottom bar → strip appears with tall, narrow portrait cards → move mouse away → strip hides; main image never resizes during any of these steps.

### Implementation

- [X] T007 [US3] In `src/App.css` — replace the `.thumbnail-card` size rules: change `width: 140px; height: 100px` to `width: 64px; aspect-ratio: 3 / 4` (remove the explicit `height`); remove `aspect-ratio: 1 / 1` from `.thumbnail-preview` and add `flex: 1;` so the preview fills the card height; update `.thumbnail-card` responsive override in the `@media (max-width: 640px)` block from `width: 84px` to `width: 48px`

**Checkpoint**: Thumbnail strip renders portrait cards. Hover reveal/hide behavior is unchanged. No image resizing occurs. Application is in a runnable state.

---

## Phase 5: User Story 4 — Navigation Button Layout (Priority: P2)

**Goal**: The Back button lives above the image display area (outside `.album-viewer`); the Previous, Thumbnails, and Next buttons are centered below it (outside `.album-viewer`); Back button and actions adapt to the active theme.

**Independent Test**: Open any album → Back button is above the image frame, not inside the bordered viewer card → Previous / Thumbnails / Next are horizontally centered below the image → switch to dark theme → Back button border and text color match the dark theme.

### Implementation

- [X] T008 [US4] In `src/App.css` — add `.viewer-screen-shell { display: flex; flex-direction: column; min-height: 100vh; padding: 1rem; gap: 0.5rem; }` and `.viewer-top-bar { display: flex; align-items: center; gap: 1rem; }` after the `.app-shell` block; remove the `padding`, `gap`, and `flex` / `flex-direction` rules from `.album-viewer` that assumed the header was inside it (the border, background, and border-radius stay)

- [X] T009 [US4] In `src/features/viewer/components/ViewerScreen.tsx` — restructure the JSX return: (1) replace the outer `<section className="album-viewer">` with `<div className="viewer-screen-shell">`; (2) add `<div className="viewer-top-bar">` containing the Back `<button>`, the `<h3>` album name, and the `<p className="album-viewer-counter">` counter as the first child; (3) wrap the image frame, zoom controls, skeleton, and image `<img>` in `<section className="album-viewer" aria-label="Album viewer">`; (4) move `.viewer-thumbnail-area` and `.album-viewer-actions` outside `.album-viewer` but inside `.viewer-screen-shell`; (5) remove the old `<header className="album-viewer-header">` wrapper (its contents are now in `viewer-top-bar`); this task depends on T008 (CSS classes must exist)

- [X] T010 [P] [US4] In `src/App.css` — change `.album-viewer-actions { justify-content: flex-end }` to `justify-content: center`; add dark theme override for the Back button: `:root[data-theme="dark"] .viewer-back-btn { border-color: #475569; color: #e2e8f0; background: transparent; }`

**Checkpoint**: Back button is visually above and outside the image display area. Prev/Thumbnails/Next are centered. Both buttons adapt to light and dark themes. Application is in a runnable state.

---

## Final Phase: Validation & Testing

**Purpose**: Confirm all user stories pass their independent tests and no regressions exist.

- [X] T011 Run `pnpm vitest run` from the project root — all tests must pass with zero failures; no modifications to test files are needed

- [X] T012 [US1] Manual validation — follow quickstart.md Scenario 1: zoom in (stops at 4.0×), zoom out (stops at 0.5×), reset (returns to 1.0× centered), drag while zoomed (pans, cursor shows `grabbing`), confirm empty space never appears inside the frame

- [X] T013 [US2] Manual validation — follow quickstart.md Scenario 2: zoom + drag on image N → navigate to image N+1 (zoom and pan both reset) → repeat with keyboard keys (ArrowLeft, ArrowRight, Home, End) → switch to dark theme and confirm skeleton is dark gray, not light gray

- [X] T014 [US3] Manual validation — follow quickstart.md Scenario 3: strip is hidden on open → hover to reveal (cards are taller than wide) → unhover to hide → confirm image frame size is unchanged throughout

- [X] T015 [US4] Manual validation — follow quickstart.md Scenario 4: Back button is above the image area → switch themes and confirm Back button adapts → Prev/Thumbnails/Next are horizontally centered → click Back to return to library

---

## Dependency Graph

```
T001 (baseline)
 ├── T002 [US1] ViewerScreen zoom bounds + class   ─┐
 ├── T003 [US1] App.css cursor rules               ─┤── US1 complete after T002 + T003
 ├── T004 [US2] ViewerScreen click nav reset       ─┐
 ├── T005 [US2] ViewerScreen keyboard nav reset    ─┤── US2 complete after T004 + T005 + T006
 ├── T006 [US2] App.css skeleton dark theme        ─┘
 ├── T007 [US3] App.css thumbnail portrait          ── US3 complete after T007
 ├── T008 [US4] App.css layout foundation
 │    └── T009 [US4] ViewerScreen JSX restructure  ─┐── US4 complete after T008 + T009 + T010
 └── T010 [P] [US4] App.css back btn + centering   ─┘

T011 (vitest) → T012 → T013 → T014 → T015
```

---

## Parallel Execution

US1 and US2 can be implemented concurrently (different handlers in `ViewerScreen.tsx` and separate CSS rules in `App.css`). US3 is CSS-only and can be done at any time after T001. US4 (T008 → T009 in sequence, T010 in parallel with T008) is independent of US1–US3.

### MVP Scope (P1 stories only)

To deliver a working MVP: complete T001 through T006 inclusive.

- T002 + T003 → bounded zoom controls with grab cursor ✅
- T004 + T005 → all navigation paths reset zoom and pan ✅
- T006 → skeleton respects active theme ✅

US3 and US4 (T007–T010) can follow in a second pass.
