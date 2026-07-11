# Tasks: Improve UI Navigation Experience

**Feature**: `009-improve-ui` | **Date**: 2026-07-10  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no blocking dependency)
- **[US#]**: Maps to user story from spec.md (US1–US5)
- Setup and Polish phases have no story label

---

## Phase 1: Setup — Shared State Foundation

**Purpose**: Extend the viewer Zustand store with the two new runtime state fields that US3 (thumbnail strip pinning) and US4 (zoom) depend on. Must be complete before US3 and US4 phases begin.

**Technical area**: Frontend — Zustand

- [ ] T001 Add `zoomLevel: number` (default `1.0`) and `thumbnailStripPinned: boolean` (default `false`) state fields to `LibraryState`; add `setZoomLevel(level)` action (clamp `0.25`–`4.0`) and `setThumbnailStripPinned(pinned)` action; reset `zoomLevel` to `1.0` inside `openAlbumViewer` and `goToImage`; reset `thumbnailStripPinned` to `false` inside `closeViewer` in `src/features/library/store/libraryStore.ts`

**Checkpoint**: Store compiles cleanly (`pnpm tsc --noEmit` passes). US3 and US4 phases can now begin.

---

## Phase 2: Foundational — No Additional Prerequisites

> All blocking prerequisites are covered by Phase 1 (T001). No additional foundational tasks are required. User story phases may begin after T001.

---

## Phase 3: User Story 1 — Settings Floating Action Button (Priority: P1) 🎯 MVP

**Goal**: Replace the inline `<SettingsPanel>` in the root layout with a fixed-position FAB button at the bottom-right of the screen. The old settings section is removed from the visible layout.

**Independent Test**: Open the app — gear icon FAB is visible in the bottom-right corner. The top-of-page settings section is gone. FAB remains visible in both light and dark themes and does not overlap the image viewer area.

**Technical areas**: Frontend — React component, Frontend — CSS

### Implementation for User Story 1

- [ ] T002 [P] [US1] Create `SettingsFAB` component: a `<button>` with inline gear SVG icon, `onClick` prop, `aria-label="Open settings"`, and `className="settings-fab"` in `src/features/settings/components/SettingsFAB.tsx`
- [ ] T003 [P] [US1] Add `.settings-fab` CSS rule (`position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 50; width: 3rem; height: 3rem; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2)`) with light/dark theme-aware `background` and `color` custom property overrides in `src/App.css`
- [ ] T004 [US1] Add `settingsPanelOpen` useState to `App.tsx`; render `<SettingsFAB onClick={() => setSettingsPanelOpen(true)} />`; remove `<SettingsPanel .../>` from the root `<main>` render in `src/App.tsx`

**Checkpoint**: App runs. FAB is visible at bottom-right. Settings are no longer inline at the top. Clicking FAB has no effect yet (panel wired in Phase 4).

---

## Phase 4: User Story 2 — Settings Side Panel (Priority: P2)

**Goal**: Clicking the FAB opens a slide-in side panel on the right that contains all application settings. The panel dismisses via X button, backdrop click, or ESC key.

**Independent Test**: Click FAB → panel slides open with all settings. Click X → closes. Click outside → closes. Press ESC → closes. All settings save correctly.

**Depends on**: Phase 3 (FAB and `settingsPanelOpen` state in `App.tsx` required)

**Technical areas**: Frontend — React component, Frontend — CSS

### Implementation for User Story 2

- [ ] T005 [P] [US2] Create `SettingsSidePanel` component: renders a `<div className="side-panel-backdrop">` (onClick → `onClose`) and an `<aside className="side-panel">` containing a close `<button className="side-panel-close">✕</button>` and a child `<SettingsPanel startupWarnings={startupWarnings} rememberLastAlbum={rememberLastAlbum} />`; accepts `isOpen`, `onClose`, `startupWarnings`, `rememberLastAlbum` props; only renders when `isOpen` is true in `src/features/settings/components/SettingsSidePanel.tsx`
- [ ] T006 [US2] Add `useEffect` ESC keydown listener to `SettingsSidePanel` that calls `onClose` when `isOpen` is `true`; clean up listener on unmount and when `isOpen` changes in `src/features/settings/components/SettingsSidePanel.tsx`
- [ ] T007 [P] [US2] Add CSS rules: `.side-panel-backdrop` (`position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,0.4)`), `.side-panel` (`position: fixed; top: 0; right: 0; height: 100vh; width: 360px; z-index: 70; transform: translateX(100%); transition: transform 0.25s ease`), `.side-panel--open` (`transform: translateX(0)`), `.side-panel-close` (absolute top-right button), and dark-mode overrides for panel background in `src/App.css`
- [ ] T008 [US2] Add `<SettingsSidePanel isOpen={settingsPanelOpen} onClose={() => setSettingsPanelOpen(false)} startupWarnings={startupWarnings} rememberLastAlbum={rememberLastAlbum} />` to `App.tsx` render; ensure no remaining direct `<SettingsPanel>` in root layout in `src/App.tsx`

**Checkpoint**: Click FAB → panel slides in from right with all settings. All three close gestures (X, backdrop, ESC) work. Settings save and apply as before.

---

## Phase 5: User Story 4 — Improved Image Viewer (Priority: P2)

**Goal**: Extract the inline viewer JSX into a dedicated `ImageViewer` component; add skeleton placeholder on image navigation; increase image frame height; add zoom-in/out/reset controls at the top-right of the image frame.

**Independent Test**: Open an album. Navigate images — no layout shift, skeleton appears during load. Zoom in/out/reset buttons appear at top-right of frame and work correctly. Zoom resets on image navigation.

**Depends on**: Phase 1 (T001 — `zoomLevel` and `setZoomLevel` in store)

**Technical areas**: Frontend — React component (new), Frontend — CSS

### Implementation for User Story 4

- [ ] T009 [P] [US4] Create `ImageViewer` component by extracting the `{viewerSession && (...)}` block from `LibraryView.tsx` into `src/features/library/components/ImageViewer.tsx` with `ImageViewerProps` matching the contracts definition (`session`, `image`, `loading`, `error`, `zoomLevel`, `onZoomIn`, `onZoomOut`, `onZoomReset`, `onPrev`, `onNext`, `onClose`, `thumbnailStripPinned`, `onToggleThumbnailStrip`, `thumbnailCache`, `loadThumbnailImage`)
- [ ] T010 [US4] Add `prevImageSize: { width: number; height: number } | null` local state to `ImageViewer`; update it via `onLoad={(e) => setPrevImageSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}` on the `<img>`; render `<div className="image-skeleton" style={{ aspectRatio: \`${prevImageSize.width}/${prevImageSize.height}\` }} />` in place of the image when `loading` is `true` and `prevImageSize` is set in `src/features/library/components/ImageViewer.tsx`
- [ ] T011 [US4] Add `<div className="viewer-zoom-controls">` inside the image frame containing zoom-in (`+`), zoom-out (`−`), and reset (`↺`) `<button>` elements with `aria-label` attributes; wire each to `onZoomIn`, `onZoomOut`, `onZoomReset` props; apply `style={{ transform: \`scale(${zoomLevel})\`, transformOrigin: 'center' }}` to the `<img>` in `src/features/library/components/ImageViewer.tsx`
- [ ] T012 [P] [US4] Add CSS: `.image-skeleton` (shimmer `@keyframes` animation, `background: linear-gradient(90deg, ...)`, `border-radius: 8px`, `width: 100%`, `max-height: 80vh`), update `.album-viewer-image-frame` to `min-height: 60vh; max-height: 80vh; overflow: auto; position: relative`, add `.viewer-zoom-controls` (`position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.25rem; z-index: 10`) in `src/App.css`
- [ ] T013 [US4] Replace the extracted inline viewer block in `LibraryView.tsx` with `<ImageViewer session={viewerSession} image={viewerImage} loading={viewerLoading} error={viewerError} zoomLevel={zoomLevel} onZoomIn={() => setZoomLevel(zoomLevel + 0.25)} onZoomOut={() => setZoomLevel(zoomLevel - 0.25)} onZoomReset={() => setZoomLevel(1.0)} onPrev={...} onNext={...} onClose={closeViewer} thumbnailStripPinned={thumbnailStripPinned} onToggleThumbnailStrip={...} thumbnailCache={thumbnailCache} loadThumbnailImage={loadThumbnailImage} />` in `src/features/library/components/LibraryView.tsx`

**Checkpoint**: Open album. Image fills more vertical space. Navigate images — skeleton shows during load, no layout shift. Zoom controls appear at top-right; zoom in/out/reset all work. Zoom resets on navigation.

---

## Phase 6: User Story 3 — Thumbnail Strip Redesign (Priority: P3)

**Goal**: Reduce the thumbnail strip height, hide it by default, show it on hover over the viewer area, and add a toggle button to pin it open.

**Independent Test**: Open album with 5+ images. Strip is hidden by default. Hover over viewer bottom → strip appears. Mouse away → strip hides. Click toggle button → strip stays open regardless of hover. Click again → returns to hover-only behavior.

**Depends on**: Phase 5 (T009 — `ImageViewer` component must exist to receive `visible` prop and toggle callback; Phase 1 T001 — `thumbnailStripPinned` in store)

**Technical areas**: Frontend — React component (modify), Frontend — CSS

### Implementation for User Story 3

- [ ] T014 [P] [US3] Add `visible: boolean` prop to `ThumbnailStrip`; apply `className={\`thumbnail-strip \${visible ? 'thumbnail-strip--visible' : 'thumbnail-strip--hidden'}\`}` in `src/features/library/components/ThumbnailStrip.tsx`
- [ ] T015 [P] [US3] Add `.thumbnail-strip--visible` (`opacity: 1; max-height: 80px; pointer-events: auto`), `.thumbnail-strip--hidden` (`opacity: 0; max-height: 0; overflow: hidden; pointer-events: none`) with `transition: opacity 0.2s ease, max-height 0.2s ease` on the base `.thumbnail-strip` rule; update `.thumbnail-card` to `height: 64px` (was implicitly 96px) in `src/App.css`
- [ ] T016 [US3] Add `isHovered: boolean` local state to `ImageViewer`; attach `onMouseEnter={() => setIsHovered(true)}` and `onMouseLeave={() => setIsHovered(false)}` to the root `<section>`; add a pin toggle `<button>` in the viewer actions toolbar that calls `onToggleThumbnailStrip`; pass `visible={isHovered || thumbnailStripPinned}` to `<ThumbnailStrip>` in `src/features/library/components/ImageViewer.tsx`

**Checkpoint**: Strip is hidden by default. Hovering over the viewer reveals it. Toggle button pins/unpins. Strip is visibly smaller than before.

---

## Phase 7: User Story 5 — Album Card Uniformity (Priority: P3)

**Goal**: All album cards in the library grid render at the same fixed width; all cover images display at the same 3:4 aspect ratio via CSS crop.

**Independent Test**: View the library with 3+ albums of varying cover image sizes — all cards are identical in dimensions and all covers are uniform portrait-cropped.

**Independent of all other user stories — can be implemented at any time after Phase 1.**

**Technical areas**: Frontend — CSS only

### Implementation for User Story 5

- [ ] T017 [P] [US5] Update `.album-list` rule to `grid-template-columns: repeat(auto-fill, minmax(180px, 180px)); justify-content: start` (replaces `auto-fit` with fixed column size for uniform card widths) in `src/App.css`
- [ ] T018 [P] [US5] Update `.album-cover img` to `aspect-ratio: 3/4; height: unset; object-fit: cover` (replaces `height: 140px` with aspect-ratio-based sizing for consistent portrait covers across all albums) in `src/App.css`

**Checkpoint**: All album cards are the same width. All covers are portrait-cropped at 3:4. No card is taller or shorter than another regardless of the native cover image dimensions.

---

## Phase 8: Polish & Testing

**Purpose**: Unit test coverage for new components and store logic; full manual validation of all acceptance scenarios.

**Technical areas**: Frontend — Tests (Vitest + Testing Library), Manual validation

- [ ] T019 [P] Write unit tests for `SettingsFAB` (renders gear icon, fires `onClick`) in `src/test/SettingsFAB.test.tsx`; write unit tests for `SettingsSidePanel` (X button calls `onClose`, backdrop click calls `onClose`, ESC keydown calls `onClose`, does not render when `isOpen=false`) in `src/test/SettingsSidePanel.test.tsx`
- [ ] T020 [P] Write unit tests for `ImageViewer`: skeleton `<div>` rendered when `loading=true` and `prevImageSize` is set; `onZoomIn`, `onZoomOut`, `onZoomReset` callbacks fired when respective buttons are clicked in `src/test/ImageViewer.test.tsx`
- [ ] T021 [P] Write unit tests for `libraryStore`: `setZoomLevel(5)` clamps to `4.0`; `setZoomLevel(0)` clamps to `0.25`; calling `goToImage()` resets `zoomLevel` to `1.0`; calling `openAlbumViewer()` resets `zoomLevel` to `1.0`; calling `closeViewer()` resets `thumbnailStripPinned` to `false` in `src/test/libraryStore.test.ts`
- [ ] T022 Run `pnpm test` and confirm all tests pass; validate all 5 user stories against `specs/009-improve-ui/quickstart.md` with `pnpm tauri dev`

**Checkpoint**: All tests green. All 5 quickstart validation tables pass. Feature complete.

---

## Dependency Graph

```
T001 (store)
├── T009 (extract ImageViewer) ─── T010 (skeleton) ─── T011 (zoom controls)
│                                                        └── T013 (LibraryView wiring)
│                                                              └── T016 (hover + toggle in ImageViewer)
│                                                                    └── depends on T014 (ThumbnailStrip visible prop)
└── [US3 zoom reset in actions]

T002 (SettingsFAB component)
T003 (FAB CSS)                  ← parallel with T002
└── T004 (App.tsx FAB wiring)
      └── T005 (SettingsSidePanel component)
            └── T006 (ESC listener)
            T007 (Side panel CSS)  ← parallel with T005
            └── T008 (App.tsx panel wiring)

T017 (album grid CSS)    ← fully independent
T018 (album cover CSS)   ← fully independent

T019, T020, T021 (tests)  ← all parallel after their respective phases complete
T022 (validation)         ← after all tests pass
```

### Parallel Execution Opportunities

| Phase | Parallelizable pairs |
|-------|---------------------|
| Phase 3 (US1) | T002 + T003 (FAB component and CSS) |
| Phase 4 (US2) | T005 + T007 (side panel component and CSS) |
| Phase 5 (US4) | T009 + T012 (ImageViewer component and CSS) |
| Phase 6 (US3) | T014 + T015 (ThumbnailStrip prop and CSS) |
| Phase 7 (US5) | T017 + T018 (both CSS-only, different selectors) |
| Phase 8 | T019 + T020 + T021 (all different test files) |
| Cross-phase | Phase 3 (US1) and Phase 5+6 can start after T001; Phase 7 (US5) can start at any time |

---

## Implementation Strategy

**MVP Scope** (Phase 1 + Phase 3): T001 + T002–T004  
Delivers the Settings FAB with the inline settings section removed. App is functional; clicking the FAB has no effect yet (panel added in Phase 4).

**Incremental delivery order**:

1. **T001** → unblocks all viewer and thumbnail work
2. **T002–T004** (US1) → removes inline settings, adds FAB entry point
3. **T005–T008** (US2) → completes settings navigation (FAB → panel)
4. **T009–T013** (US4) → improves the core image viewing experience
5. **T014–T016** (US3) → refines thumbnail visibility and reduces visual noise
6. **T017–T018** (US5) → visual polish for the album grid
7. **T019–T022** → tests and final validation

Every phase leaves the application in a fully runnable state.

---

## Format Validation

All tasks follow the required checklist format:

| Rule | Status |
|------|--------|
| Every task starts with `- [ ]` | ✅ |
| Every task has sequential T-ID | ✅ |
| [P] marker on parallelizable tasks only | ✅ |
| [US#] label on all user story phase tasks | ✅ |
| Setup and Polish tasks have no story label | ✅ |
| Every task includes an exact file path | ✅ |
