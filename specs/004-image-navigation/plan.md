# Implementation Plan: Image Navigation

**Branch**: `004-image-navigation` | **Date**: 2026-06-30 | **Spec**: [specs/004-image-navigation/spec.md](specs/004-image-navigation/spec.md)

**Input**: Feature specification from `/specs/004-image-navigation/spec.md`

## Summary

Add in-album image navigation with previous/next controls, left/right keyboard support, mouse-driven thumbnail selection, automatic thumbnail strip scrolling, and persisted reading progress. Keep the current viewer session as the single source of truth in the existing Zustand store, reuse the current Tauri commands for image loading and progress persistence, and load images only when they are actually shown. No database, no ZIP mutation, and no full-album duplication.

## Technical Context

**Language/Version**: TypeScript 5.8 + React 19 (frontend), Rust 1.75+ (Tauri backend)

**Primary Dependencies**: Tauri `invoke`, Zustand, React Testing Library, Vitest, existing Rust `serde`/`serde_json`, existing `ZipService`, `MetadataService`, and `FileSystemService`

**Storage**: Local metadata only through `albums_catalog.json`; no database and no album-content duplication

**Testing**: Vitest + Testing Library for frontend state/UI, `cargo test` for Rust services and commands, manual Tauri validation for end-to-end navigation

**Target Platform**: Windows, Linux, and macOS desktop through Tauri

**Project Type**: Offline desktop application

**Performance Goals**: Keep image navigation responsive, load only the currently requested image and the thumbnails that are actually visible, and keep the selected thumbnail scrolled into view without blocking the UI

**Constraints**: Offline-first, ZIP is the source of truth, albums are read-only, filesystem access must go through infrastructure services, ZIP access must go through `ZipService`, lazy loading is required, and speculative abstractions should be avoided

**Scale/Scope**: One active viewer session per album with a horizontally scrollable thumbnail strip for the current album only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Offline-only behavior remains intact; no network dependency is introduced.
- Pass: ZIP contents remain read-only and are never modified.
- Pass: Frontend stays focused on presentation and user interaction.
- Pass: Rust remains responsible for file access, ZIP reading, and metadata persistence.
- Pass: Filesystem access is routed through `FileSystemService` only.
- Pass: ZIP manipulation and image extraction are routed through `ZipService` only.
- Pass: No database is introduced.
- Pass: No unnecessary abstraction layer is added for navigation.

## Project Structure

### Documentation (this feature)

```text
specs/004-image-navigation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── image-navigation-commands.md
```

### Source Code (repository root)

```text
src/
├── App.tsx
├── App.css
├── features/
│   └── library/
│       ├── components/
│       │   ├── AlbumCard.tsx
│       │   └── LibraryView.tsx
│       ├── store/
│       │   └── libraryStore.ts
│       └── index.ts
├── infrastructure/
│   └── tauri.ts
└── shared/
    └── types/
        └── library.ts

src-tauri/
└── src/
    ├── lib.rs
    └── services/
        ├── file_system_service.rs
        ├── metadata_service.rs
        └── zip_service.rs
```

**Structure Decision**: Extend the existing library feature and the existing Rust services in place. Add only a small thumbnail-strip component if the viewer UI becomes too dense. Do not introduce a new architecture layer, store, or database.

## 1. Feature Overview

The feature turns the current album viewer into a proper image browser. Users can move forward and backward one image at a time with buttons or keyboard arrows, jump directly to any image by clicking a thumbnail, and keep the selected thumbnail visible as navigation changes. The viewer must remain responsive and should only fetch image bytes when a page or visible thumbnail is actually needed.

## 2. Functional Requirements

- Allow the user to move to the next image in the current album.
- Allow the user to move to the previous image in the current album.
- Support navigation through on-screen controls, keyboard input, and mouse interaction.
- Allow the user to select any thumbnail and open the matching image.
- Keep the selected image synchronized with the highlighted thumbnail.
- Keep the selected thumbnail visible whenever the current image changes.
- Prevent navigation past the first image or past the last image.
- Preserve the current album context while the user navigates.

## 3. Technical Architecture

Use the existing command-driven Tauri bridge and keep the viewer state in the current Zustand store. The frontend owns selection, navigation, scroll behavior, and rendering; Rust owns album validation, ZIP reading, and metadata persistence.

### Frontend responsibilities

- Hold the active viewer session and current image index in the existing library store.
- Translate button clicks, keyboard arrows, mouse wheel/scroll behavior, and thumbnail clicks into a single `goToImage` navigation action.
- Render the full-size active image and a lazily populated thumbnail strip.
- Scroll the thumbnail strip so the active thumbnail stays visible.
- Ignore stale navigation responses when rapid user input causes overlapping loads.

### Backend (Rust) responsibilities

- Resolve album metadata and restore reading progress when opening the viewer.
- Validate image index bounds and album existence.
- Load image bytes from the ZIP through `ZipService`.
- Persist the latest reading progress through `MetadataService`.
- Keep filesystem access isolated to `FileSystemService`.

### Shared models

- Reuse `AlbumViewSession` as the active viewer state shape shared between Rust responses and the frontend store.
- Reuse `OpenAlbumViewerResponse`, `LoadAlbumImageResponse`, `SaveReadingProgressResponse`, and `ViewerCommandError` as the cross-process DTOs.
- Keep thumbnail cache entries and scroll viewport state frontend-local because they are presentation concerns, not persisted domain data.

### Infrastructure services

- `FileSystemService` resolves and validates album ZIP paths.
- `ZipService` remains the only service that reads image bytes from ZIP archives.
- `MetadataService` persists album metadata and reading progress.

## 4. Components to Implement

1. Extend `src/features/library/store/libraryStore.ts` with a single navigation action that clamps indices, loads the target image, persists progress, and keeps the active session in sync.
2. Update `src/features/library/components/LibraryView.tsx` to wire keyboard arrows, mouse clicks, and viewer navigation buttons into the new store action.
3. Add a small thumbnail-strip component if needed for readability, with scroll-into-view behavior and visible active-state styling.
4. Update `src/infrastructure/tauri.ts` and `src/shared/types/library.ts` only if a small DTO or helper is actually required; otherwise reuse the existing commands unchanged.
5. Keep `src-tauri/src/lib.rs` and the Rust services focused on album open, single-image load, and progress save.
6. Expand the existing frontend and Rust tests to cover thumbnail selection, boundary behavior, and stale-load safety.

## 5. Data Model

The feature does not require a database or a new persisted album model. The only durable state remains reading progress in the local catalog.

- `AlbumViewSession`: active album, album name, total image count, current index, and session start time.
- `ReadingProgress`: persisted `album_id`, `last_image_index`, and `updated_at`.
- `ThumbnailCacheEntry`: frontend-local cache for visible thumbnails only; includes `imageIndex`, `imageSource`, and `mimeType`.
- `ThumbnailViewportState`: frontend-local scroll state for the thumbnail strip; includes the active index and the selected scroll container position.

Validation rules:

- `current_index` must stay within `[0, total_images - 1]`.
- Thumbnail cache entries are ephemeral and must never become the source of truth.
- Persisted progress must be clamped to a valid image index on restore.

## 6. State Management

Keep the existing Zustand store as the single client-side authority for viewer state.

- `viewerSession` remains the source of truth for the current album and selected index.
- `viewerImage` remains the full-size currently displayed image.
- `viewerLoading` and `viewerError` continue to represent the current navigation request.
- Add a tiny in-memory thumbnail cache keyed by `albumId:imageIndex` or `imageIndex` while the current album is open.
- Add one navigation helper that accepts a target index and performs bounds checking, image loading, progress persistence, and session updates.
- Keep thumbnail scroll state inside the viewer component unless another component truly needs it.

Rules:

- Only update the selected index after the image load succeeds.
- Do not persist thumbnail state.
- Do not create a second store for the viewer.
- Ignore stale responses when a later navigation request has already started.

## 7. Rust Services

Keep the Rust side small and conservative.

- `MetadataService`
  - Reads and writes `ReadingProgress`.
  - Restores the correct start index when the viewer opens.
  - Keeps album metadata in the local catalog only.

- `ZipService`
  - Reads the requested image bytes by index.
  - Enforces supported image formats and index bounds.
  - Remains the only place where ZIP entry access happens.

- `FileSystemService`
  - Resolves album ZIP paths.
  - Performs canonicalization and safe local path handling.
  - Prevents React from touching the filesystem directly.

No new database layer and no new ZIP mutation path are needed.

## 8. React Components

- `LibraryView.tsx`
  - Owns the album viewer area, navigation controls, and keyboard listeners.
  - Renders the active image and the thumbnail strip.
  - Calls the store navigation helper for next, previous, and direct selection.

- `ThumbnailStrip.tsx` if extracted
  - Renders image thumbnails in a horizontally scrollable container.
  - Requests image data only when a thumbnail is visible or about to become visible.
  - Scrolls the selected thumbnail into view and keeps its active styling obvious.

- `AlbumCard.tsx`
  - No major change expected; it should continue to open the album viewer.

- `App.css`
  - Add the minimum styling required for the scrollable thumbnail rail, selected state, and keyboard-focus clarity.

Prefer keeping the viewer in the existing library feature unless the thumbnail rail makes the file too large to maintain comfortably.

## 9. File System Interactions

- Frontend code must not read files directly.
- All album path resolution stays inside `FileSystemService`.
- All ZIP reads stay inside `ZipService`.
- Reading progress continues to be stored in the local catalog file managed by `MetadataService`.
- If a future thumbnail cache is added, it must live in a dedicated local cache path and still be accessed through Rust services, not from React.

## 10. Error Handling

Reuse the existing error codes and make navigation failures recoverable.

- Boundary navigation at the first or last image should be ignored or disabled, not treated as an error.
- A failed thumbnail fetch should leave a placeholder in the strip and allow retry on scroll or reselection.
- A failed image load should keep the previous session intact where possible and show a user-facing message.
- A failed progress save should not block viewing the image; it should surface a recoverable warning.
- Internal errors should be logged, but image bytes and album contents should never be logged.

Expected error categories already available:

- `ALBUM_NOT_FOUND`
- `IMAGE_INDEX_OUT_OF_RANGE`
- `ZIP_READ_FAILURE`
- `UNSUPPORTED_IMAGE`
- `PROGRESS_READ_FAILURE`
- `PROGRESS_WRITE_FAILURE`
- `IO_FAILURE`

## 11. Testing Strategy

- Frontend unit tests
  - Next/previous button behavior.
  - Left/right arrow keyboard navigation.
  - Thumbnail selection updates the active image.
  - Selected thumbnail stays visible after navigation.
  - Rapid navigation does not leave stale state behind.

- Frontend component tests
  - Viewer renders the current image counter and active thumbnail state.
  - Disabled boundary controls are correct at the first and last image.
  - Thumbnail strip scroll state remains synchronized with selection.

- Rust unit and command tests
  - Existing open/load/save behavior remains valid.
  - Saved progress restores correctly.
  - Invalid progress falls back to the first image.
  - `ZipService` still returns one image payload per request and rejects out-of-range access.

- Manual validation
  - Run the app, open an album, navigate with mouse and keyboard, and verify thumbnail scroll behavior and progress restore.

## 12. Risks

- Reusing full-size image loads for thumbnails could be slower on large albums; mitigate with lazy loading and a small thumbnail cache.
- Rapid keyboard input can race with async image loads; mitigate by ignoring stale responses and updating the session only on the latest successful request.
- Horizontal scrolling behavior can feel different across desktop platforms; validate on Windows, Linux, and macOS.
- Keeping thumbnails visible without overloading the UI may require one small component extraction; avoid splitting further unless readability demands it.

## 13. Future Extensibility

- Add a real thumbnail cache if large albums make thumbnail loading too slow.
- Add wrap-around navigation only if the product later wants circular browsing.
- Add prefetch of the next and previous image only if a measurable performance need appears.
- Add slideshow mode, drag-and-drop reordering, or deep-link navigation later without changing the current store shape.

