# Implementation Plan: Gestión de biblioteca de álbumes

**Branch**: `001-library` | **Date**: 2026-06-30 | **Spec**: [specs/001-library/spec.md](specs/001-library/spec.md)

**Input**: Feature specification from `/specs/001-library/spec.md`

## Summary

Implement a simple offline library view for locally stored album ZIP files. The plan uses the existing Tauri + React + Rust architecture, keeps ZIP files as the source of truth, and routes filesystem and ZIP operations through Rust infrastructure services. The UI will load album metadata on startup, support sorting by name and import date, and allow deleting an album after confirmation with the library updating immediately.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19, Rust 1.75+

**Primary Dependencies**: Vite, React, Tauri, Rust standard library, Tauri invoke commands

**Storage**: Local files plus a lightweight JSON metadata catalog stored in the app data directory

**Testing**: Vitest for frontend-focused logic, Rust unit tests for services, and manual Tauri validation for end-to-end behavior

**Target Platform**: Windows, Linux, and macOS desktop

**Project Type**: Desktop app

**Performance Goals**: Library view should load in under 10 seconds for a typical local album set and remain responsive during delete operations

**Constraints**: Fully offline, no database, no duplicate album contents, no UI direct filesystem access, lazy loading for images

**Scale/Scope**: Single-library view with a modest number of albums and local ZIP files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: The plan remains offline-first and does not require network access.
- Pass: ZIP files remain the source of truth and are not modified.
- Pass: Album contents are not duplicated; metadata only is stored separately.
- Pass: Filesystem access is delegated to Rust infrastructure services.
- Pass: UI remains presentation-oriented and does not access the filesystem directly.
- Pass: The implementation stays simple and avoids an unnecessary database or abstraction layer.
- Pass: Images are not preloaded in bulk; the UI will load them lazily.

## Project Structure

### Documentation (this feature)

```text
specs/001-library/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── features/
│   └── library/
│       ├── components/
│       ├── store/
│       └── types/
├── infrastructure/
├── shared/
└── App.tsx

src-tauri/
├── src/
│   ├── lib.rs
│   └── services/
└── target/
```

**Structure Decision**: Keep the feature within the existing React feature-based structure and add Rust services under the Tauri backend for filesystem and ZIP handling.

## Feature Overview

This feature provides a simple library experience for browsing albums stored as local ZIP files. The app will scan the configured local album location, read album metadata and cover information, render a card-based library view, and support deletion with confirmation. The flow is intentionally narrow and focused on the user stories in the specification.

## Functional Requirements

- Display all locally available albums at startup.
- Show each album cover, name, image count, and import date.
- Support sorting by album name and import date.
- Provide delete action with explicit confirmation.
- Remove metadata and ZIP file after confirmation.
- Refresh the library instantly after a successful delete.
- Show an empty state when no albums exist.
- Show clear errors if deletion fails.

## Technical Architecture

The implementation will follow a thin-client architecture:

- Frontend responsibilities:
  - Render the library view and empty-state UI.
  - Manage local UI state for sort order and delete confirmation.
  - Call Tauri commands to load and delete albums.
  - Display errors and loading states.

- Backend (Rust) responsibilities:
  - Discover local album ZIP files.
  - Read album metadata and count images from ZIP entries.
  - Resolve the first image as the cover.
  - Persist a small metadata catalog in JSON.
  - Delete the metadata entry and the underlying ZIP file.
  - Expose typed commands for the React frontend.

- Shared models:
  - Album summary payload used by the UI.
  - Library sort enum and deletion result payload.

- Infrastructure services:
  - FileSystemService for local file and directory operations.
  - ZipService for reading ZIP contents and extracting metadata without modifying the archive.
  - MetadataService for reading and writing the JSON catalog.

This keeps the UI free from direct file access and keeps ZIP logic isolated in Rust.

## Components to Implement

1. Library page or view container in the frontend feature module.
2. Album card component for cover, name, count, and import date.
3. Sort control component for name/date ordering.
4. Delete confirmation dialog or modal.
5. Library store for UI state and async command handling.
6. Rust Tauri commands for loading and deleting albums.
7. Rust infrastructure services for filesystem, zip, and metadata persistence.

## Data Model

The feature uses a minimal metadata structure:

- Album
  - id
  - title
  - path
  - imageCount
  - coverIndex
  - importedAt
  - lastOpenedAt

- AlbumMetadataCatalog
  - version
  - albums

The metadata is not a replacement for the ZIP file; it is a lightweight index used to render the library list efficiently.

## State Management

State will remain local to the feature and simple:

- albums: array of album summaries
- loading: boolean
- error: optional error message
- sortOrder: name | date
- selectedAlbumId: optional
- deleteConfirmOpen: boolean

The store will be implemented with Zustand or a small local React state container if the existing project does not yet use Zustand. The plan favors the simplest viable approach that fits the current codebase.

## Rust Services

- ZipService
  - Read ZIP entries without modifying files.
  - Determine image count and identify the first image as the cover.
  - Return album metadata fields needed by the UI.

- FileSystemService
  - Resolve the configured album directory.
  - Check whether files exist.
  - Delete the underlying ZIP file.
  - Ensure the metadata catalog path is valid.

- MetadataService
  - Read and write the JSON metadata catalog.
  - Update the catalog after delete operations.
  - Keep the metadata format simple and versioned.

## React Components

- LibraryView
  - Responsible for loading albums on mount and rendering the list.

- AlbumCard
  - Displays cover image, title, image count, import date, and delete action.

- SortControl
  - Lets the user switch between name and date sorting.

- EmptyState
  - Displays a friendly message when no albums are present.

- DeleteConfirmationDialog
  - Confirms destructive deletion before execution.

## File System Interactions

All filesystem actions are routed through Rust services:

- Scan the configured albums directory for ZIP files.
- Read ZIP metadata without extracting contents.
- Persist metadata catalog in JSON.
- Delete ZIP archive files.
- Delete metadata records from the catalog.

No React component will directly access the file system.

## Error Handling

The implementation will use explicit, user-facing error states:

- If the library cannot be loaded, show a non-blocking error message explaining what failed and that the user can retry.
- If deletion fails, show the reason and how to recover, such as checking file permissions or ensuring the file still exists.
- If metadata is missing or incomplete, the app should skip the broken entry or show a warning rather than crashing.
- All unexpected errors should be logged in Rust and surfaced to the UI through a clear message.

## Testing Strategy

- Frontend
  - Unit test sorting logic and transform functions.
  - Component tests for empty state, list rendering, and delete confirmation behavior.

- Rust
  - Unit tests for ZipService metadata parsing.
  - Unit tests for MetadataService reading/writing and delete behavior.
  - Integration tests for the Tauri commands that load and delete albums.

- Manual validation
  - Launch the app with sample ZIP files.
  - Confirm the library loads and sorts correctly.
  - Confirm deletion updates the list immediately.

## Risks

- ZIP metadata may be inconsistent or malformed, causing parsing errors.
- File permissions may prevent deletion of a ZIP file.
- The app may encounter partially imported albums with incomplete metadata.
- The initial implementation depends on a simple metadata catalog and may need refinement if album folders grow in complexity.

## Future Extensibility

The structure is intentionally simple and can be extended later by adding:

- thumbnail caching
- search and filtering
- favorites or tags
- more advanced metadata fields
- a richer album detail view

These additions can be layered onto the existing services and UI without changing the core architecture.

## Complexity Tracking

No complexity deviations from the constitution are required for this feature.
