# Implementation Plan: Improve UI Visualization

**Branch**: `008-improve-ui` | **Date**: 2026-07-01 | **Spec**: [specs/008-improve-ui/spec.md](specs/008-improve-ui/spec.md)

**Input**: Feature specification from `/specs/008-improve-ui/spec.md`

## Summary

Improve the existing album viewer and library presentation with a simple UI-focused change set: show images at full available size, adapt the viewer background to the active light/dark theme, add a compact settings entry in the lower-right corner that reveals a dropdown, and use the first image inside each ZIP as the library album cover. The implementation stays within the current React + Zustand + Tauri structure and avoids introducing new architectural layers.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19 + Vite, Rust 1.75+ (Tauri backend)

**Primary Dependencies**: Zustand, Tauri invoke bridge, `@tauri-apps/plugin-dialog`, Vitest + React Testing Library, existing Rust services (`FileSystemService`, `MetadataService`, `ZipService`)

**Storage**: Existing local metadata and ZIP files only; no new database

**Testing**: Vitest + React Testing Library (frontend), `cargo test` (Rust), manual UI verification in the Tauri runtime

**Target Platform**: Windows, Linux, macOS desktop through Tauri

**Project Type**: Offline desktop app

**Performance Goals**: Viewer and library UI updates feel immediate; album cover rendering and image opening remain responsive for normal albums

**Constraints**: Offline-only, ZIP remains the source of truth, albums remain read-only, filesystem access only through infrastructure services, ZIP work only through `ZipService`, no unnecessary abstractions, lazy loading preserved

**Scale/Scope**: Single-window desktop app with existing library and viewer flows; feature scoped to presentation, settings affordance, and cover generation from existing ZIP metadata

## Constitution Check

*GATE: Must pass before implementation begins. Re-check after design is finalized.*

### Pre-Implementation

- Pass: The feature remains fully offline and introduces no network dependency.
- Pass: The implementation does not modify ZIP contents or duplicate album contents; it only reads existing ZIP data and uses it for display.
- Pass: The approach stays simple by extending existing UI components and existing store behavior rather than introducing new abstractions.
- Pass: Frontend handles presentation and interaction only; backend remains responsible for ZIP/image access and metadata operations.
- Pass: Filesystem access remains routed through Rust infrastructure services; ZIP access remains routed through `ZipService`.
- Pass: No new database or image duplication is required.

### Post-Design Re-check

- Pass: The plan uses existing shared models and only adds lightweight UI-state types when required.
- Pass: The plan reuses current Tauri bridge commands and existing Rust service boundaries.
- Pass: The plan preserves lazy loading for displayed images.
- Pass: No new architectural layer or persistence model is introduced.

## Project Structure

### Documentation (this feature)

```text
specs/008-improve-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-improvement-commands.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── features/
│   ├── library/
│   │   ├── components/
│   │   │   ├── AlbumCard.tsx
│   │   │   ├── LibraryView.tsx
│   │   │   └── ThumbnailStrip.tsx
│   │   └── store/
│   │       └── libraryStore.ts
│   └── settings/
│       ├── components/
│       │   └── SettingsPanel.tsx
│       └── store/
│           └── settingsStore.ts
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

**Structure Decision**: Extend the existing library and settings UI, reuse the existing Zustand store, and keep Rust responsibilities inside current Tauri command handlers and service modules.

## 1. Feature Overview

This feature improves visual clarity and accessibility for the main album-reading experience. The viewer will show the selected image using the available area without awkward scaling, the viewer background will reflect the current theme, the settings control will be compact and reveal a dropdown from the lower-right corner, and the library will display album covers derived from the first image in each imported ZIP.

## 2. Functional Requirements

- The viewer MUST display the active image at full available size within the viewer container.
- The viewer background MUST change with the active theme (light or dark).
- The settings control MUST be hidden by default behind a compact icon.
- Activating the settings icon MUST reveal a dropdown menu.
- The settings icon MUST be anchored to the lower-right area of the main interface.
- The library MUST render a cover for each album based on the first image inside the corresponding ZIP when a valid cover is available.
- The UI MUST degrade gracefully when a cover image is missing or unreadable.

## 3. Technical Architecture

Use the existing React + Zustand + Tauri request flow and keep presentation logic in the UI layer while keeping ZIP/image access in Rust services.

### Frontend responsibilities

- Render the viewer with a layout that fills the available space.
- Apply theme-aware background classes or styles to the viewer shell.
- Manage the collapsed settings control and dropdown open/close state.
- Render album cards with cover images using lazy loading and a fallback empty state.
- Keep user interaction logic simple and local to UI components or the existing Zustand stores.

### Backend (Rust) responsibilities

- Continue exposing album and image loading commands for the UI.
- Continue reading ZIP content and returning image bytes or data URIs for the viewer and covers.
- Continue handling metadata and import state through the existing services.
- Keep ZIP access isolated to `ZipService` and filesystem access isolated to `FileSystemService`.

### Shared models

- Reuse existing shared types from `src/shared/types/library.ts` for album summaries, viewer responses, and settings.
- Add only minimal UI-specific types if needed for the new dropdown/cover state.

### Infrastructure services

- Keep the frontend bridge in `src/infrastructure/tauri.ts` intact and only use it for commands that require Rust-backed data.
- Keep all filesystem interactions inside Rust infrastructure services.
- Keep all ZIP image extraction inside `ZipService`.

## 4. Components to Implement

1. `src/features/library/components/LibraryView.tsx`
   - Adjust the viewer layout so the active image occupies the available area.
   - Ensure the viewer shell uses theme-aware styling.
   - Add a compact settings control entry in the lower-right area of the main layout.
   - Reuse the existing library state for album selection and viewer state.

2. `src/features/library/components/AlbumCard.tsx`
   - Render the album cover using the existing cover data from the album summary.
   - Apply lazy loading and fallback presentation when cover data is unavailable.

3. `src/features/settings/components/SettingsPanel.tsx`
   - Convert the settings UI into a compact dropdown-triggered control instead of always visible.
   - Keep the existing form behavior intact.

4. `src/features/settings/store/settingsStore.ts`
   - No major structural changes; only ensure the existing settings panel can be toggled and remain stateful.

5. `src/shared/types/library.ts`
   - Extend only if the UI needs a small type for the dropdown visibility or cover-state handling.

## 5. Data Model

No new persistence model is required. The existing data model is sufficient.

- `AlbumSummary`
  - Already carries the album cover payload, title, path, image count, cover index, and import timestamp.
  - The plan uses this existing data for cover presentation.
- `AlbumViewSession`
  - Already tracks the currently opened album and image index.
  - The viewer layout uses this state to render the current image.
- `UserSettings`
  - Already carries theme and other preferences that drive the viewer background adaptation.

## 6. State Management

Use the existing Zustand stores rather than adding a new state layer.

- `useLibraryStore`
  - Owns album data, viewer session, current image, and library selection.
  - No new store is needed for this feature.
- `useSettingsStore`
  - Owns theme settings and other runtime preferences.
  - The viewer background will read from these settings through the existing store.
- Local component state
  - Use local state only for the dropdown open/closed state of the settings control and any transient UI feedback.

## 7. Rust Services

No new Rust service is required. The existing services remain the single source of truth.

- `ZipService`
  - Responsible for reading ZIP contents and extracting the first image or any requested image for display.
  - This is the only path for ZIP-based cover or viewer image loading.
- `FileSystemService`
  - Responsible for local file and directory access for import metadata and album file handling.
- `MetadataService`
  - Responsible for reading and writing local metadata such as album records and progress information.

## 8. React Components

- `LibraryView`
  - Primary integration point for the viewer presentation and settings control placement.
- `AlbumCard`
  - Responsible for cover display and fallback behavior.
- `SettingsPanel`
  - Converted into a compact dropdown experience while keeping current settings fields and save behavior.
- `ThumbnailStrip`
  - No structural change required beyond ensuring it remains visually coherent with the improved viewer layout.

## 9. File System Interactions

Frontend code must not access the filesystem directly.

- Import and library loading continue to use Tauri bridge commands.
- ZIP image extraction remains inside Rust via `ZipService`.
- Any future cover/image loading for album list or viewer uses the same existing Rust-backed commands rather than duplicating data locally.

## 10. Error Handling

Handle failures gracefully and without blocking the main user flow.

- If a cover image cannot be read, show a neutral fallback placeholder rather than a broken image.
- If the viewer image cannot be loaded, show a visible error message in the viewer area and keep the rest of the UI usable.
- If the settings dropdown cannot be opened or closed due to state issues, fall back to the normal collapsed state.
- Keep errors surfaced as concise, actionable messages while preserving the existing store error handling patterns.

## 11. Testing Strategy

Use lightweight frontend tests and manual validation in the desktop app.

- Component tests for `AlbumCard`
  - Verify cover image is rendered when cover data is present.
  - Verify fallback placeholder appears when cover data is missing.
- Component tests for `LibraryView`
  - Verify the viewer image fills the viewer container.
  - Verify the settings control toggles the dropdown.
  - Verify the viewer background responds to the active theme.
- Store tests for `useSettingsStore` and `useLibraryStore`
  - Confirm theme-driven rendering state is driven by existing settings state.
- Rust tests
  - Verify ZIP image retrieval and cover selection remain correct for valid and invalid archives.
- Manual validation
  - Open an album, confirm image sizing, switch theme, toggle settings menu, and verify album covers in the library.

## 12. Risks

- Theme styling may be inconsistent if the viewer container does not inherit from the right root classes.
- Cover images may be large and affect initial library rendering performance if decoded eagerly.
- Some ZIPs may not contain usable images, so the UI must handle that case gracefully.

Mitigation: use existing CSS and lazy-loading patterns, keep the viewer container layout simple, and use the existing fallback state rather than introducing extra caching layers.

## 13. Future Extensibility

The implementation should remain simple but flexible enough for later enhancements.

- The settings dropdown can later host more options without changing the overall pattern.
- The viewer container can later support zoom or fit modes without changing the data flow.
- The album cover rendering can later be upgraded to thumbnails or cached covers if performance becomes a concern.

All future changes should preserve the current architecture: frontend for presentation, Rust for ZIP and filesystem access, shared models only for data contracts, and no unnecessary abstraction layers.

## Implementation Notes

The change will be implemented by extending the current library and settings UI paths rather than introducing a parallel architecture. The main work is concentrated in the existing viewer and album-card components, with minimal changes to the stores and no database or duplicate album-content persistence.
