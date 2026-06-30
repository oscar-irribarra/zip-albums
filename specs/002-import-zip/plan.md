# Implementation Plan: Import ZIP Albums

**Branch**: `002-import-zip` | **Date**: 2026-06-30 | **Spec**: [specs/002-import-zip/spec.md](specs/002-import-zip/spec.md)

**Input**: Feature specification from `/specs/002-import-zip/spec.md`

## Summary

Add a simple ZIP import flow that lets users pick a ZIP file, validates it in Rust through `ZipService`, creates album metadata without duplicating ZIP contents, and updates the library immediately. The implementation keeps frontend logic focused on interaction and rendering, routes filesystem access through infrastructure services, and returns clear error categories for invalid imports.

## Technical Context

**Language/Version**: TypeScript 5.8 + React 19 (frontend), Rust 1.75+ (Tauri backend)

**Primary Dependencies**: Tauri command `invoke`, Zustand, Rust `zip` crate, `serde`

**Storage**: Local filesystem + JSON catalog (`albums_catalog.json`) only (no database)

**Testing**: Frontend unit/component tests + Rust unit tests + targeted command integration tests

**Target Platform**: Windows, Linux, macOS desktop via Tauri

**Project Type**: Offline desktop app

**Performance Goals**: Import of typical ZIP albums should complete without blocking UI; library list should refresh immediately after successful import

**Constraints**: Offline-first, no album content duplication, ZIP order preservation, first valid image is cover, lazy loading for displayed images, simple maintainable design

**Scale/Scope**: Single ZIP import per user action for local library usage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- Pass: Offline-only flow (no network dependencies).
- Pass: ZIP remains source of truth; ZIP is never modified.
- Pass: Read-only albums are preserved; import only adds metadata entry.
- Pass: Frontend handles UI only; business rules and validation stay in Rust.
- Pass: Filesystem access is routed through `FileSystemService`.
- Pass: ZIP parsing and validation are routed through `ZipService`.
- Pass: No database introduced; metadata remains JSON catalog.
- Pass: No premature abstractions proposed.

### Post-Design Re-Check

- Pass: Design artifacts keep responsibilities split between React (presentation) and Rust (business/infrastructure).
- Pass: Data model stores metadata only; no copied image or extracted archive state.
- Pass: Error handling is explicit and user-recoverable.
- Pass: Lazy loading requirement remains unchanged for all image display flows.

## Project Structure

### Documentation (this feature)

```text
specs/002-import-zip/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── import-zip-commands.md
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

**Structure Decision**: Extend the existing library feature and existing Rust service modules instead of creating new layers. This is the smallest change that satisfies the specification and constitution.

## 1. Feature Overview

Users can import a new album from a ZIP file. The app validates file type and ZIP content, filters supported images, preserves ZIP internal order, uses the first image as cover, and adds the album to the library immediately on success. Invalid imports return clear error messages for corrupted ZIP, empty ZIP, no images, unsupported file format, and duplicates.

## 2. Functional Requirements

- Accept user-selected ZIP files only.
- Reject non-ZIP inputs with a specific message.
- Validate ZIP readability and corruption before import.
- Ignore unsupported entries while scanning ZIP.
- Reject ZIP when no supported images are present.
- Preserve ZIP image order for album image sequence.
- Use first valid image as cover.
- Detect duplicates and reject duplicate import.
- Add valid album immediately to the in-memory library list.
- Keep library state unchanged when import fails.

## 3. Technical Architecture

Thin command-based architecture using existing Tauri pattern:

- Frontend responsibilities:
  - Trigger file selection and import command.
  - Render loading/success/error states.
  - Update local library store immediately with returned album summary.
  - Keep UI state and user messages only.

- Backend (Rust) responsibilities:
  - Validate selected path and extension.
  - Inspect ZIP entries and gather supported image list through `ZipService`.
  - Perform duplicate checks against metadata catalog.
  - Persist metadata updates through `MetadataService`.
  - Execute filesystem operations through `FileSystemService`.
  - Map domain errors into stable error codes/messages for UI.

- Shared models:
  - Import request and import result payloads.
  - Album summary shape used by both backend response and frontend store.
  - Import error code enum mirrored in TypeScript.

- Infrastructure services:
  - `FileSystemService`: path checks, existence checks, canonicalization.
  - `ZipService`: ZIP inspection, supported image filtering, ordered image names.
  - `MetadataService`: load/save catalog and duplicate detection helpers.

## 4. Components to Implement

1. New Tauri command in `lib.rs`: `import_album`.
2. Request/response Rust DTOs for import command.
3. `ZipService` enhancement for robust validation and explicit error mapping.
4. `MetadataService` helper for duplicate detection and append-on-success.
5. `FileSystemService` helper(s) for ZIP path validation and canonical path operations.
6. Frontend store action `importAlbum` in `libraryStore.ts`.
7. Import UI trigger in `LibraryView.tsx` (button + feedback states).
8. Shared TypeScript types update in `shared/types/library.ts`.

## 5. Data Model

See full entity detail in [specs/002-import-zip/data-model.md](specs/002-import-zip/data-model.md).

Core entities for implementation:

- `ImportAlbumRequest`: selected ZIP path.
- `ImportError`: stable error code + user-facing message.
- `AlbumMetadata`: existing catalog entity, reused with no schema expansion beyond what is needed.

## 6. State Management

Use existing Zustand store with minimal additions:

- Add `importing: boolean`.
- Add `importAlbum(zipPath: string): Promise<boolean>` action.
- Reuse existing `error` string field for user-visible failures.
- On success, append returned album to `albums` immediately (no full reload required).

No additional global store or event bus is needed.

## 7. Rust Services

- `ZipService`:
  - Validate archive can be opened.
  - Return ordered supported image names.
  - Ignore unsupported entries.
  - Return typed failures for corrupt/empty/no-images scenarios.

- `FileSystemService`:
  - Validate selected file exists and has `.zip` extension.
  - Provide canonical path for reliable duplicate checks.

- `MetadataService`:
  - Load current catalog.
  - Detect duplicate album by canonical path.
  - Append new `AlbumMetadata` and persist atomically.

## 8. React Components

- `LibraryView.tsx`:
  - Add Import ZIP button and bind to store action.
  - Show import progress and error feedback.
  - Keep existing list rendering behavior.

- `AlbumCard.tsx`:
  - No structural change required for this feature.

- Optional small component extraction only if already needed by current file complexity (for example, import toolbar section). Otherwise keep in `LibraryView.tsx`.

## 9. File System Interactions

All filesystem operations stay in Rust infrastructure services:

- User-selected file path is passed to backend command.
- Backend validates extension and file existence through `FileSystemService`.
- Backend reads ZIP entries through `ZipService` without extraction.
- Backend stores metadata update through `MetadataService` in `albums_catalog.json`.
- No copied album contents and no extracted image cache are introduced.

## 10. Error Handling

Use explicit error categories and stable messages:

- `UNSUPPORTED_FORMAT`: selected file is not ZIP.
- `ZIP_CORRUPTED`: archive cannot be opened/read.
- `ZIP_EMPTY`: archive has no entries.
- `NO_SUPPORTED_IMAGES`: entries exist but none are supported images.
- `DUPLICATE_ALBUM`: canonical path already exists in catalog.
- `IO_FAILURE`: unexpected local file operation failure.

Frontend displays mapped, actionable messages and keeps previous library state intact on failure.

## 11. Testing Strategy

- Rust unit tests:
  - `ZipService` for valid ZIP, corrupt ZIP, empty ZIP, no-image ZIP, mixed entries with order preserved.
  - `MetadataService` duplicate detection and append behavior.
  - `FileSystemService` ZIP extension/path validation.

- Rust command tests:
  - `import_album` happy path and each error code.

- Frontend tests:
  - Store `importAlbum` action success/failure state transitions.
  - `LibraryView` import button behavior and error message rendering.

- Manual validation:
  - Run Tauri app and verify immediate album appearance after successful import.

## 12. Risks

- ZIP archives with unusual entry names could introduce edge-case parsing behavior.
- Cross-platform path normalization differences could impact duplicate detection if canonicalization is incomplete.
- Large ZIP archives may increase import latency; feedback state is required to avoid perceived freeze.

## 13. Future Extensibility

- Add optional drag-and-drop import using the same `import_album` command.
- Add richer duplicate policies (rename, keep both) later without changing current command contract.
- Add image preview pagination and viewer-level lazy loading without altering import domain logic.

These are deferred deliberately to keep current implementation simple and maintainable.

## Complexity Tracking

No constitution violations or complexity exceptions are required.
