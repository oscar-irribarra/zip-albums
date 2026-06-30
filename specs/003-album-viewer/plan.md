# Implementation Plan: Album Viewer

**Branch**: `003-album-viewer` | **Date**: 2026-06-30 | **Spec**: [specs/003-album-viewer/spec.md](specs/003-album-viewer/spec.md)

**Input**: Feature specification from `/specs/003-album-viewer/spec.md`

## Summary

Implement an album viewer flow that opens albums from cover (or restored progress), displays album name and page counter, and loads only the visible image. The design keeps React focused on presentation, keeps business rules in Rust services, routes filesystem and ZIP access through infrastructure services, persists only metadata, and avoids unnecessary abstractions.

## Technical Context

**Language/Version**: TypeScript 5.8 + React 19 (frontend), Rust 1.75+ (Tauri backend)

**Primary Dependencies**: Tauri `invoke`, Zustand, Rust `serde`, existing ZIP crate integration in `ZipService`

**Storage**: Local metadata files only (no database)

**Testing**: Vitest + Testing Library (frontend), `cargo test` (Rust), contract-level command validation

**Target Platform**: Windows, Linux, macOS desktop through Tauri

**Project Type**: Offline desktop application

**Performance Goals**: UI remains responsive during image navigation; image load operation handles one visible image at a time; no full-album preload

**Constraints**: Offline-first, ZIP source of truth, read-only albums, lazy loading required, filesystem through infrastructure services only, no album-content duplication

**Scale/Scope**: Single-album viewer session with per-album progress persistence

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- Pass: Offline-only behavior maintained (no network dependencies).
- Pass: ZIP remains source of truth; no ZIP mutation and no content duplication.
- Pass: Frontend restricted to presentation and interaction logic.
- Pass: Business logic, metadata persistence, and ZIP reading remain in Rust services.
- Pass: Filesystem access is isolated in infrastructure services.
- Pass: Lazy loading is required and explicitly preserved.
- Pass: No new database introduced.
- Pass: No speculative abstraction introduced.

### Post-Design Re-Check

- Pass: Design artifacts keep responsibilities split across frontend/backend/shared/infrastructure.
- Pass: Data model persists metadata only (progress and view context).
- Pass: File interactions are routed through `FileSystemService` and `ZipService` only.
- Pass: Error handling is recoverable and user-actionable.
- Pass: Cross-platform behavior remains consistent through Tauri and Rust services.

## Project Structure

### Documentation (this feature)

```text
specs/003-album-viewer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── album-viewer-commands.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── features/
│   └── library/
│       ├── components/
│       │   ├── AlbumCard.tsx
│       │   └── LibraryView.tsx
│       └── store/
│           └── libraryStore.ts
├── infrastructure/
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

**Structure Decision**: Extend existing library feature and Rust services in place. This is the minimum-change structure that satisfies the specification and constitution.

## 1. Feature Overview

The feature introduces an album viewing experience where users can open an album, start from the cover by default, view album identity/context (name and counter), and navigate while loading only the currently visible image. The same flow restores the last viewed index when reopening an album.

## 2. Functional Requirements

- Open album viewer from library selection.
- Start at cover (`index 0`) when no valid progress exists.
- Display album name in the viewer header.
- Display current position over total image count.
- Load only currently visible image during navigation.
- Save latest viewed index as per-album progress.
- Restore saved index on subsequent open for same album.
- Keep progress isolated by album ID.
- Fallback to cover when saved progress is invalid/unavailable.

## 3. Technical Architecture

Use a simple command-driven architecture with existing Tauri invoke integration.

### Frontend responsibilities

- Trigger viewer open, navigation, and progress-save commands.
- Render current image, album name, and counter.
- Manage loading/error/pending UI states.
- Maintain local UI/session state in store.

### Backend (Rust) responsibilities

- Validate album identity and metadata access.
- Resolve start index from progress with fallback logic.
- Read ZIP entries and requested image content through `ZipService`.
- Persist and restore reading progress through `MetadataService`.
- Return typed domain errors for frontend mapping.

### Shared models

- Command request/response DTOs for open/load/save operations.
- `AlbumViewSession` and `ReadingProgress` compatible payloads.
- Stable error code enum mirrored in TypeScript.

### Infrastructure services

- `FileSystemService`: path normalization, existence checks, safe local I/O.
- `ZipService`: ZIP entry access, index-to-image resolution, image read.
- `MetadataService`: progress get/save and album metadata retrieval.

## 4. Components to Implement

1. Viewer command handlers in Rust (`open_album_viewer`, `load_album_image`, `save_reading_progress`) wired in `src-tauri/src/lib.rs`.
2. Service-level methods in `metadata_service.rs` for progress retrieval/persistence.
3. Service-level methods in `zip_service.rs` for single-image-by-index loading.
4. Service-level helpers in `file_system_service.rs` for validated filesystem path operations used by viewer flow.
5. Store actions/selectors in `src/features/library/store/libraryStore.ts` for viewer state and command calls.
6. Viewer UI integration in `src/features/library/components/LibraryView.tsx`.
7. Shared type updates in `src/shared/types/library.ts`.

## 5. Data Model

Detailed definitions are in [specs/003-album-viewer/data-model.md](specs/003-album-viewer/data-model.md).

Implementation entities:

- `AlbumViewSession`: active viewer state (album, current index, total).
- `ReadingProgress`: persisted per-album `lastImageIndex`.
- `ViewerHeaderContext`: derived display data (name + counter).
- `ViewImagePayload`: single visible image result payload.

## 6. State Management

Extend existing Zustand store with minimal additions:

- `viewerSession: AlbumViewSession | null`
- `viewerImage: ViewImagePayload | null`
- `viewerLoading: boolean`
- `viewerError: string | null`
- Actions: `openAlbumViewer(albumId)`, `loadImage(index)`, `saveReadingProgress(albumId, index)`

Rules:

- Update `viewerSession.currentIndex` only after successful image load.
- Persist progress on image change confirmation and on viewer exit.
- Keep this state within existing library store; no new global store.

## 7. Rust Services

- `MetadataService`
  - `get_reading_progress(album_id) -> Option<ReadingProgress>`
  - `save_reading_progress(album_id, index) -> Result<()>`
  - `get_album_metadata(album_id) -> Result<AlbumMetadata>`

- `ZipService`
  - `load_image_by_index(album_path, index) -> Result<ViewImagePayload>`
  - Enforce ordered image indexing and supported types.

- `FileSystemService`
  - Validate/canonicalize album ZIP path.
  - Perform safe read operations consumed by `ZipService`.

All ZIP manipulation stays in `ZipService`.

## 8. React Components

- `LibraryView.tsx`
  - Trigger viewer open from album card action.
  - Render header (`albumName`, counter) and current image.
  - Handle prev/next actions and keyboard navigation.
  - Render user-facing error and retry controls.

- `AlbumCard.tsx`
  - Expose/open action if needed; no major structural changes.

Keep implementation simple in existing components unless split is required by immediate readability.

## 9. File System Interactions

- Frontend never reads filesystem directly.
- Album path resolution and existence checks go through `FileSystemService`.
- ZIP reading and entry extraction by index go through `ZipService`.
- Progress metadata read/write goes through `MetadataService` using local metadata files.
- No copied/extracted album mirror and no database storage.

## 10. Error Handling

Typed error categories returned by Rust commands and mapped in frontend:

- `ALBUM_NOT_FOUND`
- `IMAGE_INDEX_OUT_OF_RANGE`
- `ZIP_READ_FAILURE`
- `UNSUPPORTED_IMAGE`
- `PROGRESS_READ_FAILURE`
- `PROGRESS_WRITE_FAILURE`
- `IO_FAILURE`

Behavior:

- Invalid saved progress triggers fallback to cover and logs internal warning.
- User-facing messages explain what happened and suggest retry/reopen steps.
- Internal logs include technical context without logging image content.

## 11. Testing Strategy

- Rust unit tests
  - Progress save/restore and fallback behavior.
  - `ZipService` single-image load by valid/invalid index.
  - Filesystem path validation behavior.

- Rust command tests
  - `open_album_viewer` returns cover when no progress.
  - `open_album_viewer` returns saved index when valid.
  - `load_album_image` returns one image payload only.

- Frontend unit/component tests
  - Store state transitions for open/load/save actions.
  - Viewer header shows album name and counter.
  - Error rendering and retry behavior.

- Manual validation
  - Execute scenarios in [specs/003-album-viewer/quickstart.md](specs/003-album-viewer/quickstart.md).

## 12. Risks

- Path normalization differences across OS may affect album lookup.
- Large image decode latency may impact perceived navigation speed.
- Corrupt ZIP entries could fail at load time despite valid catalog metadata.

Mitigation:

- Canonicalize paths in Rust services.
- Keep loading indicators explicit.
- Return typed errors and safe fallback logic.

## 13. Future Extensibility

- Add optional adjacent-image prefetch behind feature flag if performance data justifies it.
- Add viewer shortcuts and richer navigation while reusing same contracts.
- Add optional thumbnail cache later via ADR, without changing ZIP source-of-truth model.

These items are intentionally deferred to keep current implementation focused and maintainable.

## Complexity Tracking

No constitution violations or complexity exceptions required.
