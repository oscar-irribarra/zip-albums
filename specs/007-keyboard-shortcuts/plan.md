# Implementation Plan: Keyboard Shortcuts

**Branch**: `007-keyboard-shortcuts` | **Date**: 2026-06-30 | **Spec**: [specs/007-keyboard-shortcuts/spec.md](specs/007-keyboard-shortcuts/spec.md)

**Input**: Feature specification from `/specs/007-keyboard-shortcuts/spec.md`

## Summary

Add keyboard shortcuts for viewer navigation and core library actions without changing the app architecture: Arrow Left/Right, Home, End, F, Escape, Ctrl+O, and Delete. The implementation extends existing React UI event handling and existing Zustand actions, while keeping Rust responsibilities unchanged for ZIP and filesystem operations.

## Technical Context

**Language/Version**: TypeScript 5.8 + React 19 (frontend), Rust 1.75+ (Tauri backend)

**Primary Dependencies**: Zustand, Tauri invoke bridge, `@tauri-apps/plugin-dialog`, Vitest + React Testing Library, Rust existing services (`FileSystemService`, `MetadataService`, `ZipService`)

**Storage**: Existing local metadata only; no new database

**Testing**: Vitest + React Testing Library (frontend), `cargo test` (Rust), manual keyboard validation in Tauri dev runtime

**Target Platform**: Windows, Linux, macOS desktop through Tauri

**Project Type**: Offline desktop app

**Performance Goals**: Keyboard-triggered actions reflect state/UI updates in under 1 second for normal-size albums

**Constraints**: Offline-only, ZIP source-of-truth, read-only albums, filesystem via infrastructure services only, ZIP work via `ZipService`, no unnecessary abstractions, lazy loading preserved

**Scale/Scope**: Single active window and viewer session; feature scoped to keyboard interaction layer and existing commands

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0

- Pass: Feature remains fully offline and adds no network dependencies.
- Pass: No mutation/duplication of album ZIP contents.
- Pass: Architecture remains simple by extending existing `LibraryView` and `libraryStore`.
- Pass: Frontend handles interaction wiring only; backend remains owner of business/data access commands.
- Pass: Filesystem access stays in Rust infrastructure services.
- Pass: ZIP manipulation remains inside `ZipService`.
- Pass: No new database or persistent image duplication introduced.

### Post-Phase 1 Re-check

- Pass: Data model changes are interaction/context oriented and lightweight.
- Pass: Contracts reuse existing commands (`import_album`, `delete_album`, `open_album_viewer`, `load_album_image`).
- Pass: Plan keeps lazy loading behavior for image display paths.
- Pass: No new architecture layers required.

## Project Structure

### Documentation (this feature)

```text
specs/007-keyboard-shortcuts/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── keyboard-shortcuts-commands.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── features/
│   └── library/
│       ├── components/
│       │   ├── LibraryView.tsx
│       │   └── LibraryView.test.tsx
│       └── store/
│           ├── libraryStore.ts
│           └── libraryStore.test.ts
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

**Structure Decision**: Keep a single feature-focused implementation in existing library UI/store files and existing Tauri bridge/services; no new modules unless required for immediate readability.

## 1. Feature Overview

This feature enables complete keyboard-first navigation for viewing images and performing two core library actions (import ZIP and delete album). It improves speed and accessibility while preserving current mouse-based flows.

## 2. Functional Requirements

- Arrow Left loads previous image when available.
- Arrow Right loads next image when available.
- Home jumps to first image in active viewer album.
- End jumps to last image in active viewer album.
- F enters fullscreen from viewer context.
- Escape exits fullscreen when fullscreen is active.
- Ctrl+O opens ZIP import flow.
- Delete triggers album deletion flow for current selection with confirmation.
- Shortcuts are ignored in non-applicable contexts (no viewer/no selection).
- Shortcuts are ignored while typing in editable controls.

## 3. Technical Architecture

Use existing event-to-action architecture without adding a new hotkey framework:

React keyboard listener (window scope, guarded by focus/context) -> Zustand actions in `libraryStore` -> existing Tauri infrastructure commands -> Rust command handlers and services.

### Frontend responsibilities

- Register and clean keyboard listeners.
- Perform context checks (viewer active, selected album exists, editable target guard).
- Map keys to existing store actions (`goToImage`, `importAlbum`, `deleteAlbum`, viewer open/close/fullscreen toggles).
- Keep UI feedback and non-blocking error display.

### Backend (Rust) responsibilities

- Continue executing album/image/import/delete commands.
- Keep command validation and error mapping for out-of-range and IO failures.
- Keep ZIP reads routed through `ZipService` and filesystem access through `FileSystemService`.

### Shared models

- Reuse existing shared command request/response types in `src/shared/types/library.ts`.
- Add minimal keyboard context typing only if required by tests or readability.

### Infrastructure services

- `src/infrastructure/tauri.ts` remains the only frontend-to-Rust command bridge.
- `src-tauri/src/services/file_system_service.rs` remains sole filesystem access layer.
- `src-tauri/src/services/zip_service.rs` remains sole ZIP manipulation layer.
- `src-tauri/src/services/metadata_service.rs` remains unchanged except existing progress/metadata responsibilities.

## 4. Components to Implement

1. `src/features/library/components/LibraryView.tsx`
   - Extend keyboard handler for Home/End/F/Escape/Ctrl+O/Delete.
   - Keep editable-element guard and viewer boundary checks.
   - Ensure delete shortcut uses same confirmation flow as button.
2. `src/features/library/store/libraryStore.ts`
   - Expose/confirm minimal actions needed for keyboard mapping (no duplicated logic in component).
3. `src/features/library/components/LibraryView.test.tsx`
   - Add key-driven behavior tests for each shortcut and boundary cases.
4. Optional minimal updates in `src/shared/types/library.ts` only if strict typings require it.

## 5. Data Model

Detailed in [specs/007-keyboard-shortcuts/data-model.md](specs/007-keyboard-shortcuts/data-model.md). Primary entities are lightweight runtime contexts:

- `KeyboardShortcutBinding`
- `ViewerNavigationContext`
- `LibraryActionContext`
- `FullscreenContext`

No new persistent entities are introduced.

## 6. State Management

Use existing `useLibraryStore` as single source of truth:

- Keep navigation state in `viewerSession.current_index`.
- Keep selected/available albums in existing `albums` collection.
- Use existing `viewerLoading`, `viewerError`, `error` for action feedback.
- Do not create a separate shortcut store; mapping remains in component + existing store actions.

## 7. Rust Services

- No new Rust service abstraction is required.
- Existing services stay authoritative:
  - `ZipService` for ZIP reads during image loads.
  - `FileSystemService` for path and filesystem operations.
  - `MetadataService` for existing metadata writes/reads.
- If deletion/import behavior needs adjustment, modify existing command handlers only.

## 8. React Components

- `LibraryView` is the primary integration point for keyboard shortcuts.
- `ThumbnailStrip` and `AlbumCard` require no direct keyboard changes for this feature.
- Existing buttons remain as fallback UI controls; keyboard adds alternate interaction path.

## 9. File System Interactions

- Frontend performs zero direct filesystem access.
- Import and delete flows continue through `src/infrastructure/tauri.ts` commands.
- Rust command handlers route all filesystem operations through `FileSystemService`.
- Any ZIP content access remains through `ZipService`.
- No database or album-content duplication introduced.

## 10. Error Handling

- Invalid-context keypresses are ignored silently (no crash/no noisy error).
- User-facing errors come from existing store error mapping for import/delete/viewer failures.
- Fullscreen toggle failures (if any) surface recoverable message and keep current mode.
- Internal logs remain technical and never include image payload contents.

## 11. Testing Strategy

- Frontend unit/integration tests (`LibraryView.test.tsx`):
  - Arrow/Home/End navigation behavior
  - F/Escape fullscreen transitions
  - Ctrl+O import flow trigger
  - Delete flow with/without eligible selection
  - Editable-target guard (input/textarea/select/contentEditable)
- Store tests (`libraryStore.test.ts`) verify no regressions in underlying navigation/import/delete actions.
- Rust tests (`cargo test`) ensure command contracts remain stable for import/delete/image load.
- Manual validation in Tauri dev for cross-platform key behavior sanity.

## 12. Risks

- Platform-level key handling differences (Ctrl vs Command conventions).
- Global key listener may conflict with focused controls if guard coverage is incomplete.
- Fullscreen behavior can vary by runtime/window state.
- Delete shortcut misuse risk if selection context is ambiguous.

Mitigation: strict context guards, confirmation modal reuse, and targeted tests for focus/selection boundaries.

## 13. Future Extensibility

- Centralized shortcut configuration in settings (later) without changing command boundaries.
- Optional shortcut help overlay referencing the same binding map.
- Optional platform-specific modifier mapping layer only if real cross-platform pain appears.

All extensibility must preserve simple architecture, avoid unnecessary abstractions, and keep filesystem/ZIP boundaries intact.

## Agent Context Update

- Result: No agent-context update script exists under `.specify/scripts/` in this repository.
- Action: Skipped script execution; planning artifacts were generated directly.

## Complexity Tracking

No constitution violations. No unjustified abstractions introduced.

## Implementation Notes (2026-06-30)

- Extended keyboard shortcut handling in `src/features/library/components/LibraryView.tsx` with:
   - ArrowLeft / ArrowRight navigation
   - Home / End jump navigation
   - F enter fullscreen and Escape exit fullscreen
   - Ctrl+O and Meta+O import flow trigger
   - Delete album shortcut routed through existing confirmation and store action
- Added reusable keyboard helper behavior:
   - editable target guard (`input`, `textarea`, `select`, `contentEditable`)
   - normalized shortcut gesture mapping
- Added album selection support in `src/features/library/components/AlbumCard.tsx` to support safe Delete shortcut targeting.
- Added shared typing in `src/shared/types/library.ts` for shortcut gesture and guard context.
- Added and expanded tests:
   - `src/features/library/components/LibraryView.test.tsx`
   - `src/features/library/store/libraryStore.test.ts`
   - `src-tauri/src/lib.rs`

Validation results:

- `pnpm exec tsc --noEmit`: PASS
- `pnpm test -- --run src/features/library/components/LibraryView.test.tsx src/features/library/store/libraryStore.test.ts`: PASS (29 tests)
- `cargo test` (src-tauri): PASS (31 tests)
