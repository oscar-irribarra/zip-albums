# Tasks: Improve UI Visualization

**Input**: Design documents from `/specs/008-improve-ui/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by implementation layer so the feature can be delivered incrementally while keeping the application runnable after each completed step.

## Dependency Order

1. Infrastructure
2. Backend (Rust)
3. Frontend (React)
4. Integration
5. Testing

---

## Phase 1: Infrastructure

**Purpose**: Add the minimal shared structure needed for the UI improvements without introducing extra architecture.

- [ ] T001 [P] Add a lightweight shared type for the compact settings dropdown state and cover fallback state in src/shared/types/library.ts.
- [ ] T002 [P] Add theme-aware viewer and settings CSS hooks in src/App.css so the new layout can be styled without creating a new UI layer.

---

## Phase 2: Backend (Rust)

**Purpose**: Keep ZIP-backed image and cover loading aligned with the existing backend contract.

- [ ] T003 Ensure the existing ZIP inspection and image-loading flow continues to provide viewer images and cover data through the current Tauri commands in src-tauri/src/lib.rs and src-tauri/src/services/zip_service.rs.
- [ ] T004 [P] Add Rust regression coverage for loading the first supported image from a ZIP and handling unsupported archives in src-tauri/src/services/zip_service.rs.

---

## Phase 3: Frontend (React)

**Purpose**: Implement the visual improvements in the viewer, library cards, and settings entry.

- [ ] T005 Update the viewer container in src/features/library/components/LibraryView.tsx so the active image fills the available area and uses a theme-aware background.
- [ ] T006 [P] Update the album card in src/features/library/components/AlbumCard.tsx to render the album cover from album.cover_data with lazy loading and an empty-state fallback.
- [ ] T007 [P] Convert the settings UI in src/features/settings/components/SettingsPanel.tsx into a compact lower-right dropdown control while preserving the current form behavior.
- [ ] T008 Ensure the settings store in src/features/settings/store/settingsStore.ts continues to drive theme state for the viewer without introducing new persistence.

---

## Phase 4: Integration

**Purpose**: Connect the UI changes to the existing store and bridge flow without changing the app architecture.

- [ ] T009 Wire the new viewer layout and settings control to the existing library store in src/features/library/store/libraryStore.ts and keep the bridge usage in src/infrastructure/tauri.ts aligned with the current command contract.
- [ ] T010 [P] Confirm that imported album cover data reaches the library list without duplicating album contents or introducing separate cover persistence.

---

## Phase 5: Testing

**Purpose**: Verify the new presentation behavior and confirm that the feature remains runnable.

- [ ] T011 Add component tests for the viewer fill behavior and theme-aware background in src/features/library/components/LibraryView.test.tsx.
- [ ] T012 [P] Add component tests for cover rendering and empty-state fallback in src/features/library/components/AlbumCard.test.tsx.
- [ ] T013 [P] Add or extend Rust tests for ZIP-based cover/image retrieval in src-tauri/src/services/zip_service.rs.
- [ ] T014 Run validation checks (`pnpm exec tsc --noEmit`, `pnpm test -- --run src/features/library/components/LibraryView.test.tsx src/features/library/components/AlbumCard.test.tsx`, and `cargo test`) and record the results in specs/008-improve-ui/quickstart.md.

---

## Notes

- Each task targets a single implementation goal and can be completed without introducing unrelated behavior changes.
- The feature remains runnable after each completed task because the work is layered around the existing viewer, library, settings, and ZIP-loading flow.
- Validation tasks are explicit so regressions are caught before the feature is considered complete.
