# Implementation Plan: Settings Persistence

**Branch**: `005-settings` | **Date**: 2026-06-30 | **Spec**: [specs/005-settings/spec.md](specs/005-settings/spec.md)

**Input**: Feature specification from `/specs/005-settings/spec.md`

## Summary

Implement user settings persistence for theme, albums folder, fullscreen preference, remember-last-album, and initial zoom using the existing React + Zustand + Tauri architecture. Persist metadata only in local files (no database), keep filesystem access in Rust infrastructure services, and ensure startup restoration is deterministic and recoverable.

## Technical Context

**Language/Version**: TypeScript 5.8 + React 19 (frontend), Rust 1.75+ (Tauri backend)

**Primary Dependencies**: Zustand, Tauri invoke bridge, serde/serde_json, existing `FileSystemService`, existing `MetadataService`, existing `ZipService`

**Storage**: Local JSON metadata file (`albums_catalog.json`) extended with settings metadata only

**Testing**: Vitest + React Testing Library (frontend), `cargo test` (Rust), manual Tauri smoke validation

**Target Platform**: Windows, Linux, macOS (desktop via Tauri)

**Project Type**: Offline desktop application

**Performance Goals**: Settings load at startup without visible UI blocking; image loading remains lazy and unchanged for viewer flows

**Constraints**: Offline-only, ZIP is source of truth, no album-content duplication, no database introduction, filesystem through infrastructure services only, ZIP access via `ZipService` only

**Scale/Scope**: Single-user local desktop settings profile

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0

- Pass: Offline-first is preserved; no network dependency introduced.
- Pass: Persistence is metadata-only; no album-content duplication.
- Pass: Simple architecture preserved by extending current store/services instead of adding new layers.
- Pass: Frontend remains presentation/state orchestration only.
- Pass: Rust owns persistence and path validation responsibilities.
- Pass: Filesystem access remains in `FileSystemService`.
- Pass: Any ZIP manipulation remains in `ZipService`; this feature does not introduce new ZIP behavior.
- Pass: No database is introduced.

### Post-Phase 1 Re-check

- Pass: Data model and contracts keep settings in metadata, not in a DB.
- Pass: Planned components avoid premature abstractions and reuse existing modules.
- Pass: Startup restore and last-album behavior stay in Rust service + command layer.

## Project Structure

### Documentation (this feature)

```text
specs/005-settings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── settings-commands.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── App.tsx
├── features/
│   ├── library/
│   │   ├── components/
│   │   │   └── LibraryView.tsx
│   │   └── store/
│   │       └── libraryStore.ts
│   └── settings/
│       ├── components/
│       │   └── SettingsPanel.tsx
│       ├── store/
│       │   └── settingsStore.ts
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

**Structure Decision**: Add a small `settings` feature module in frontend for UI/state clarity, while reusing existing infrastructure and Rust services. Keep the implementation flat and explicit.

## 1. Feature Overview

Users can configure five preferences (theme, albums folder, fullscreen, remember last album, initial zoom) and have them restored on every launch. The app starts with persisted settings, restores last album only when enabled, and provides recovery messaging if configured folder paths are no longer accessible.

## 2. Functional Requirements

- Provide a settings UI to read/update all five preferences.
- Persist settings between executions.
- Restore settings at startup.
- Restore last album conditionally (`remember_last_album = true`).
- Validate zoom and folder values before save.
- Show recoverable errors when saved folder is unavailable.

## 3. Technical Architecture

Use a command-based flow: React components dispatch settings actions -> frontend infrastructure (`tauri.ts`) invokes Tauri commands -> Rust commands use metadata/filesystem services -> updated settings are returned and reflected in stores.

### Frontend responsibilities

- Render settings form and validation feedback.
- Hold temporary form state and dispatch save/apply actions.
- Apply visual preferences (theme/fullscreen) after successful load/save.
- Trigger startup initialization flow and render fallback messages.

### Backend (Rust) responsibilities

- Own settings read/write from local metadata.
- Validate and normalize settings payloads.
- Resolve configured albums folder availability via `FileSystemService`.
- Resolve startup context (effective settings + optional last album restore target).

### Shared models

- `UserSettings`
- `UpdateUserSettingsRequest`
- `StartupContextResponse`
- `SettingsCommandError`

### Infrastructure services

- `src/infrastructure/tauri.ts` exposes typed settings commands only.
- `FileSystemService` validates/canonicalizes folder paths.
- `MetadataService` persists/retrieves settings and last-opened album metadata.
- `ZipService` remains unchanged and is only used by image flows.

## 4. Components to Implement

1. `src/features/settings/components/SettingsPanel.tsx`
2. `src/features/settings/store/settingsStore.ts`
3. `src/features/settings/index.ts`
4. Integrate settings entry point in `src/App.tsx` / `src/features/library/components/LibraryView.tsx`
5. Extend `src/infrastructure/tauri.ts` with settings commands
6. Extend `src/shared/types/library.ts` with settings DTOs
7. Add Tauri commands in `src-tauri/src/lib.rs`
8. Extend `src-tauri/src/services/metadata_service.rs` and `src-tauri/src/services/file_system_service.rs`

No extra service layer is added in frontend.

## 5. Data Model

Persist in local metadata only.

- `UserSettings`
  - `theme: "light" | "dark" | "system"`
  - `albums_directory: string | null`
  - `fullscreen: boolean`
  - `remember_last_album: boolean`
  - `initial_zoom: number`
  - `updated_at: string`

- `StartupContext`
  - `settings: UserSettings`
  - `restore_album_id: string | null`
  - `warnings: string[]`

- `AlbumCatalog` extension
  - add `settings: UserSettings` (with defaults)
  - add `last_opened_album_id: string | null`

Validation:

- `initial_zoom` bounded (e.g. 0.5 to 3.0).
- `albums_directory` canonicalized if provided.
- `restore_album_id` only set when album still exists.

## 6. State Management

- Keep existing `libraryStore` for library/viewer state.
- Add `settingsStore` for settings-specific state and lifecycle:
  - `settings`, `loading`, `saving`, `error`, `warnings`
  - `loadSettings()`, `saveSettings()`, `applyRuntimePreferences()`
- Startup order:
  1. load startup context from Rust
  2. apply theme/fullscreen defaults
  3. if `restore_album_id` exists and remember enabled, open album viewer

No global event bus or extra abstraction is introduced.

## 7. Rust Services

- `MetadataService`
  - add defaults for settings
  - add read/write methods for settings
  - add get/set for `last_opened_album_id`

- `FileSystemService`
  - add directory validation helper for configured albums folder
  - canonicalize and reject invalid paths with actionable error details

- `ZipService`
  - unchanged for this feature
  - remains mandatory path for any ZIP image reads elsewhere

## 8. React Components

- `SettingsPanel`
  - form controls for all five preferences
  - save/cancel behavior and validation messaging
  - folder picker integration through existing dialog plugin

- `LibraryView`
  - read settings warnings/startup effects
  - keep existing lazy image display behavior unchanged

- `App`
  - host settings panel access (inline section or simple toggle)

## 9. File System Interactions

- Frontend never accesses filesystem directly.
- All folder checks and canonicalization happen in Rust `FileSystemService`.
- Settings persistence uses `MetadataService` writing to local metadata JSON.
- No album ZIP copy/extract/duplication.
- If settings point to inaccessible folder, keep value and return warning for UX recovery.

## 10. Error Handling

Add settings-oriented error codes (example):

- `SETTINGS_READ_FAILURE`
- `SETTINGS_WRITE_FAILURE`
- `INVALID_ALBUMS_DIRECTORY`
- `INVALID_ZOOM_VALUE`
- `STARTUP_CONTEXT_FAILURE`

Rules:

- Failed settings save does not crash app; keep previous persisted settings.
- Invalid field returns per-field feedback.
- Inaccessible folder returns warning and recovery instruction.
- Internal logs keep technical context only; never log image payloads.

## 11. Testing Strategy

- Frontend unit/component tests (Vitest)
  - render and edit all settings controls
  - validation for zoom and folder input
  - save success/failure behavior
  - startup restore behavior with remember-last-album on/off

- Store tests
  - `settingsStore` load/save transitions
  - runtime preference application

- Rust unit tests (`cargo test`)
  - metadata defaults + migrations for missing settings
  - settings read/write roundtrip
  - folder validation/canonicalization
  - startup context computation with missing album/folder edge cases

- Manual validation
  - restart app and verify persisted values
  - toggle remember-last-album and verify restore behavior
  - configure invalid folder and verify warning/recovery

## 12. Risks

- Existing metadata file schema changes could break older files if defaults are not handled safely.
- Fullscreen behavior may vary by OS/window manager.
- Folder validation differences across platforms (permissions/path format).
- Startup restore race (settings load vs library load) if sequencing is not explicit.

Mitigation: default-safe deserialization, sequenced startup initialization, and cross-platform smoke tests.

## 13. Future Extensibility

- Add optional per-album preferences later without changing current settings contract.
- Add export/import settings file later (still local, no DB).
- Add more themes/zoom presets by extending enum/range validation.
- Keep room for future thumbnail/cache settings without altering ZIP source-of-truth constraints.

## Complexity Tracking

No constitution violations. No additional abstraction was introduced beyond a small dedicated settings feature module.
