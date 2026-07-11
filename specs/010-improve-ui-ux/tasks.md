# Tasks: Improve UI/UX

**Input**: Design documents from `specs/010-improve-ui-ux/`

**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/ui-ux-commands.md](./contracts/ui-ux-commands.md) · [quickstart.md](./quickstart.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the new TypeScript types, infrastructure function, and folder structure that every user story depends on. Safe to run in parallel — each task touches a different file.

- [ ] T001 [P] Add `GetAlbumCoverRequest` and `GetAlbumCoverResponse` types to `src/shared/types/library.ts`
- [ ] T002 [P] Add `getAlbumCover(payload: GetAlbumCoverRequest)` Tauri wrapper to `src/infrastructure/tauri.ts`
- [ ] T003 [P] Create `src/features/viewer/` directory with an empty `src/features/viewer/index.ts` placeholder

**Checkpoint**: TypeScript compiles. Infrastructure binding for `get_album_cover` exists. Viewer feature folder is ready.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Rust-side changes that all frontend user stories depend on. `ZipService` sorting must be correct before any cover or image-index operation is tested. The `get_album_cover` command must exist before `AlbumCard` can call it.

**⚠️ CRITICAL**: No user story implementation can be validated until this phase is complete.

- [ ] T004 Sort image entries ascending by filename in `ZipService::inspect_album_checked` and `ZipService::load_image_by_index` in `src-tauri/src/services/zip_service.rs`
- [ ] T005 Add `GetAlbumCoverRequest`, `GetAlbumCoverResponse` Rust types and `get_album_cover` Tauri command to `src-tauri/src/lib.rs`; register the command in `tauri::generate_handler!`

**Checkpoint**: `cargo test` passes. `get_album_cover` command resolves album path from catalog, calls `ZipService::load_image_by_index(path, 0)`, and returns a base64 data URL.

---

## Phase 3: User Story 1 — Independent Album Library Screen (Priority: P1) 🎯 MVP

**Goal**: The library screen is a standalone view displaying all albums in a responsive grid. Each card shows the cover image extracted directly from its ZIP (first image, alphabetically sorted), renders it at the correct aspect ratio, and exposes the Import button only in the library toolbar. The image viewer no longer renders inside LibraryView.

**Independent Test**: Launch the app. Verify: (1) album grid renders with ZIP-sourced covers; (2) no viewer controls appear; (3) the Import ZIP button is in the toolbar; (4) opening an album switches to a viewer screen without the library grid visible.

- [ ] T006 [P] [US1] Implement lazy cover loading in `src/features/library/components/AlbumCard.tsx`: call `getAlbumCover({ album_id })` in `useEffect` on mount; store result in local `coverState`; render cover image or skeleton while loading; render placeholder icon on error; remove `album.cover_data ?? "/vite.svg"` fallback
- [ ] T007 [P] [US1] Add CSS custom property theme tokens (`--color-bg`, `--color-surface`, `--color-border`) to `:root` and `:root[data-theme="dark"]` blocks in `src/App.css`; update `.album-cover` to use `aspect-ratio: 3/4` and `object-fit: cover` for aspect-ratio-preserving covers
- [ ] T008 [P] [US1] Create `src/features/viewer/components/ViewerScreen.tsx` as the initial standalone viewer: read all session/image/cache/zoom state directly from `useLibraryStore`; render header (album name, counter), image frame with zoom controls, navigation buttons (Previous, Thumbnails toggle, Next, Close); include `ThumbnailStrip` imported from its current location (`library/components/ThumbnailStrip`)
- [ ] T009 [US1] Remove the `{viewerSession && <ImageViewer ... />}` block and all viewer-specific handlers (`handlePrevious`, `handleNext`, `handleThumbnailSelect`, keyboard shortcut `useEffect`, `shortcutError` state) from `src/features/library/components/LibraryView.tsx`; leave only the album grid, toolbar, and import/delete feedback
- [ ] T010 [US1] Update `src/App.tsx`: import `ViewerScreen` from `features/viewer`; replace unconditional `<LibraryView />` with `viewerSession ? <ViewerScreen /> : <LibraryView ... />`; keep `SettingsFAB` and `SettingsSidePanel` outside the conditional
- [ ] T011 [US1] Update `src/features/library/index.ts` to remove `ThumbnailStrip` export (it will live in `viewer/`); update `src/features/viewer/index.ts` to export `ViewerScreen`

**Checkpoint**: `pnpm build` succeeds. Opening the app shows only the album grid. Album cards show ZIP cover images with correct aspect ratio. Clicking Open switches to the viewer screen (no library grid visible). Import ZIP button is absent in viewer.

---

## Phase 4: User Story 2 — Safe Album Deletion (Priority: P2)

**Goal**: Clicking Delete removes the album from the catalog only. The original ZIP file is preserved on disk at all times.

**Independent Test**: Import an album, note the ZIP path, click Delete, confirm; verify the ZIP still exists on the filesystem and the album card is gone from the library.

- [ ] T012 [US2] Remove the two lines that call `FileSystemService::delete_file` from the `delete_album` command in `src-tauri/src/lib.rs`; keep only the `MetadataService::remove_album` call and the success response
- [ ] T013 [US2] Update the `window.confirm` text in `src/features/library/components/AlbumCard.tsx` from `"Delete this album and its ZIP file?"` to `"Remove this album from the library?"`

**Checkpoint**: `cargo test` passes (existing delete tests must be updated to NOT assert file removal). Deleting an album removes only the catalog entry; the ZIP survives on disk.

---

## Phase 5: User Story 3 — Independent Image Viewer (Priority: P2)

**Goal**: The viewer is a fully independent screen with a Back button, bounded zoom+pan via pointer capture, and a theme-aware background. Keyboard shortcuts live in the viewer, not the library. `ThumbnailStrip` lives in the `viewer/` feature folder.

**Independent Test**: Open an album. Verify: (1) Back button returns to library; (2) library grid never appears behind the viewer; (3) zooming in and dragging stays within bounds; (4) viewer background matches the active theme; (5) arrow-key navigation works from within the viewer.

- [ ] T014 [US3] Move `src/features/library/components/ThumbnailStrip.tsx` to `src/features/viewer/components/ThumbnailStrip.tsx`; update the import in `ViewerScreen.tsx` to the new path; update `src/features/viewer/index.ts` to also export `ThumbnailStrip`
- [ ] T015 [US3] Add a Back button (`← Back`) to `ViewerScreen.tsx` in `src/features/viewer/components/ViewerScreen.tsx` that calls `closeViewer()`; add `useEffect` for keyboard shortcuts (ArrowLeft/Right, Home/End, f, Escape) that was previously in `LibraryView`; remove the plain "Close Viewer" button
- [ ] T016 [US3] Implement pointer-capture zoom+pan in `src/features/viewer/components/ViewerScreen.tsx`: add `panOffset: { x, y }` local state (reset to `{0,0}` on image navigation); add `frameRef` to the image frame container; implement `onPointerDown`/`onPointerMove`/`onPointerUp` handlers with `setPointerCapture`; clamp pan using `(naturalSize × zoom − frameSize) / 2` formula; apply `transform: translate(${x}px,${y}px) scale(${zoom})` to the `<img>`; set `cursor: grab` when `zoom > 1`, `grabbing` while dragging; disable drag when `zoom <= 1`
- [ ] T017 [US3] Replace hardcoded `#f1f5f9` and `#ffffff` background values in `.album-viewer-image-frame` and `.album-viewer` CSS rules in `src/App.css` with `background: var(--color-surface)` and `background: var(--color-bg)` respectively

**Checkpoint**: `pnpm build` succeeds. Back button returns to library. Viewer fills the screen with no library grid. Zooming + dragging stays within frame. Background is dark in dark mode, light in light mode. Arrow keys navigate images only while viewer is open.

---

## Phase 6: User Story 4 — Redesigned Thumbnail Strip (Priority: P3)

**Goal**: The thumbnail strip is hidden by default. It appears when hovering over a dedicated 16px trigger bar at the bottom of the viewer, or when toggled via the Thumbnails button. The strip is larger than before and visually separated from the image area.

**Independent Test**: Open the viewer. Verify: (1) no strip visible on open; (2) hovering the bottom bar reveals strip; (3) moving away hides strip; (4) Thumbnails button pins/unpins the strip independent of hover; (5) strip has a visible separator from the image; (6) thumbnails are noticeably larger.

- [ ] T018 [US4] Refactor thumbnail visibility state in `src/features/viewer/components/ViewerScreen.tsx`: add `hoverVisible: boolean` local state controlled by `onMouseEnter`/`onMouseLeave` on a dedicated hover-zone element; replace the old `isHovered` on the whole viewer section; keep `thumbnailStripPinned` from store; compute `visible = pinned || hoverVisible`; render `<ThumbnailStrip>` inside a `thumbnail-strip-wrapper` div; render a `<div className="thumbnail-hover-zone">` below it (always visible 16px bar)
- [ ] T019 [P] [US4] Add `thumbnail-hover-zone`, `thumbnail-strip-wrapper`, `thumbnail-strip-wrapper--visible`, and `thumbnail-strip-wrapper--hidden` CSS rules to `src/App.css`; increase `.thumbnail-card` width from `96px` to `140px` and height from `64px` to `100px`; add `border-top: 1px solid var(--color-border)` to the visible wrapper for visual separation
- [ ] T020 [US4] Remove the now-unused `onMouseEnter`/`onMouseLeave` handlers from the root `<section>` of `ViewerScreen.tsx`; remove the `isHovered` local state; ensure the `visible` prop passed to `<ThumbnailStrip>` uses the new `visible = pinned || hoverVisible` expression

**Checkpoint**: Strip is hidden on viewer open. Hovering the bottom bar shows it; moving away hides it. Toggle button pins/unpins. Strip is separated from image and larger than before.

---

## Phase 7: Testing & Validation

**Purpose**: Verify all correctness guarantees at the Rust level, confirm TypeScript compilation, and validate the full user experience against the quickstart scenarios.

- [ ] T021 [P] Add Rust unit test `get_album_cover_returns_first_sorted_image`: create a test ZIP with `01.png` first then `00.png`; call `get_album_cover` and assert the returned `image_source` contains bytes from `00.png` — in `src-tauri/src/lib.rs`
- [ ] T022 [P] Add Rust unit test `delete_album_does_not_delete_zip_file`: import a test album, call `delete_album`, assert the ZIP still exists on disk and the catalog no longer contains the entry — in `src-tauri/src/lib.rs`
- [ ] T023 [P] Add Rust unit test `zip_service_sorts_image_entries_ascending`: create a ZIP with entries in reverse order (`02.jpg`, `01.jpg`, `00.jpg`); call `load_image_by_index(path, 0)` and assert it returns the bytes from `00.jpg` — in `src-tauri/src/services/zip_service.rs`
- [ ] T024 Run `cargo test` from `src-tauri/` and confirm all tests pass including T021–T023 and the existing delete/cover tests
- [ ] T025 Run `pnpm build` from the repository root and confirm zero TypeScript errors
- [ ] T026 Execute all 8 manual validation scenarios in `specs/010-improve-ui-ux/quickstart.md` and confirm each passes

**Checkpoint**: All Rust tests green. TypeScript build clean. All quickstart scenarios pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; all 3 tasks are parallel
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — T004 and T005 are sequential (T005 builds on ZipService behavior fixed in T004)
- **Phase 3 (US1)**: Depends on Phase 2 — T006/T007/T008 are parallel; T009 depends on T008; T010 depends on T008+T009; T011 depends on T010
- **Phase 4 (US2)**: Depends on Phase 2 — T012 and T013 are independent of Phase 3 and can run in parallel with it
- **Phase 5 (US3)**: Depends on Phase 3 — T014 must run first; T015 and T016 depend on T014; T017 is parallel with T015/T016
- **Phase 6 (US4)**: Depends on Phase 5 — T018 must run first; T019 is parallel with T018; T020 depends on T018
- **Phase 7 (Testing)**: T021/T022/T023 are parallel and can start after Phase 2; T024 after T021–T023; T025 after Phase 6; T026 after T025

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|-----------|----------------------|
| US1 (P1) | Phase 1 + Phase 2 complete | US2 (after Phase 2) |
| US2 (P2) | Phase 2 complete | US1 |
| US3 (P2) | US1 complete | — |
| US4 (P3) | US3 complete | — |

### Within Each User Story

| Phase | Internal sequence |
|-------|------------------|
| US1 | T006/T007/T008 parallel → T009 → T010 → T011 |
| US2 | T012 → T013 (or parallel — different files) |
| US3 | T014 → T015/T016/T017 (T015+T016+T017 parallel) |
| US4 | T018 → T019 (parallel) → T020 |

---

## Parallel Execution Examples

### Phase 1 — all parallel

```
T001  src/shared/types/library.ts
T002  src/infrastructure/tauri.ts
T003  src/features/viewer/index.ts
```

### US1 start — parallel trio

```
T006  src/features/library/components/AlbumCard.tsx
T007  src/App.css
T008  src/features/viewer/components/ViewerScreen.tsx
```

### US3 — parallel trio after T014

```
T015  ViewerScreen.tsx — Back button + keyboard shortcuts
T016  ViewerScreen.tsx — zoom + pan  (same file; sequential with T015)
T017  src/App.css — theme-aware background
```

> Note: T015 and T016 both modify `ViewerScreen.tsx` — do them sequentially within the same working session.

### Rust tests — all parallel

```
T021  lib.rs — get_album_cover test
T022  lib.rs — delete_album test  (same file; sequential with T021)
T023  zip_service.rs — sort test
```

---

## Implementation Strategy

### MVP (User Story 1 Only) — 11 tasks

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T005)
3. Complete Phase 3: US1 Library Screen (T006–T011)
4. **STOP and VALIDATE**: run `pnpm build`; import an album; verify ZIP cover renders; verify viewer opens as standalone screen
5. This delivers: independent library with correct ZIP covers and aspect ratio

### Incremental Delivery

1. MVP (11 tasks) → Library with ZIP covers works ✓
2. Add US2 (2 tasks) → Delete is safe ✓
3. Add US3 (4 tasks) → Viewer is fully independent with pan ✓
4. Add US4 (3 tasks) → Thumbnail strip redesign ✓
5. Add Testing (6 tasks) → Full test coverage ✓

Each stage leaves the application in a fully runnable, buildable state.

---

## Format Validation

All tasks follow: `- [ ] T### [P?] [US#?] Description with file path`

- ✅ All tasks start with `- [ ]`
- ✅ All tasks have sequential IDs (T001–T026)
- ✅ `[P]` applied only to tasks with different files and no incomplete dependencies
- ✅ `[US#]` labels applied to all user-story-phase tasks; omitted in Setup/Foundational/Testing phases
- ✅ All tasks include explicit file paths
