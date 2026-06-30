# Tasks: Album Viewer

**Input**: Design documents from [specs/003-album-viewer](specs/003-album-viewer)

**Prerequisites**: [specs/003-album-viewer/plan.md](specs/003-album-viewer/plan.md), [specs/003-album-viewer/spec.md](specs/003-album-viewer/spec.md), [specs/003-album-viewer/research.md](specs/003-album-viewer/research.md), [specs/003-album-viewer/data-model.md](specs/003-album-viewer/data-model.md), [specs/003-album-viewer/contracts/album-viewer-commands.md](specs/003-album-viewer/contracts/album-viewer-commands.md)

**Tests**: Included by request. Each user story includes unit/component/integration validation tasks.

**Organization**: Tasks are grouped by user story and categorized as Infrastructure, Backend (Rust), Frontend (React), Integration, and Testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared contracts and validation scaffolding without changing runtime behavior.

### Infrastructure

- [x] T001 Add viewer shared request/response/error TypeScript models in src/shared/types/library.ts
- [x] T002 Align viewer command contract examples with planned payloads in specs/003-album-viewer/contracts/album-viewer-commands.md

### Testing

- [x] T003 Add phase-based validation checklist entries for viewer scenarios in specs/003-album-viewer/quickstart.md

**Checkpoint**: Repository remains runnable with no feature behavior change.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the core infrastructure required before any user story implementation.

**Critical**: No user story work starts until this phase is complete.

### Infrastructure

- [x] T004 Extend path canonicalization and album ZIP lookup helpers in src-tauri/src/services/file_system_service.rs
- [x] T005 Add reading progress metadata helper functions in src-tauri/src/services/metadata_service.rs

### Backend (Rust)

- [x] T006 Define viewer command DTOs and typed error enums in src-tauri/src/lib.rs
- [x] T007 Register viewer commands (`open_album_viewer`, `load_album_image`, `save_reading_progress`) in src-tauri/src/lib.rs

### Integration

- [x] T008 Add frontend invoke wrapper utilities for viewer commands in src/infrastructure/tauri.ts

### Testing

- [x] T009 Add foundational Rust unit tests for metadata progress helper behavior in src-tauri/src/services/metadata_service.rs

### Validation

- [x] T010 Validate foundational backend compilation from src-tauri/Cargo.toml

**Checkpoint**: Foundational primitives are in place and the app stays runnable.

---

## Phase 3: User Story 1 - Open and Read an Album (Priority: P1) 🎯 MVP

**Goal**: Open an album from library, start from cover, show album name and counter, and load only the visible image.

**Independent Test**: Open an album with no saved progress and verify cover start, header context, and one-image-per-navigation loading behavior.

### Testing (US1)

- [x] T011 [P] [US1] Add Rust unit test for `load_image_by_index` happy path in src-tauri/src/services/zip_service.rs
- [x] T012 [P] [US1] Add Rust unit test for out-of-range image index handling in src-tauri/src/services/zip_service.rs
- [x] T013 [P] [US1] Add frontend store test for open-from-cover state in src/features/library/store/libraryStore.test.ts

### Backend (Rust) (US1)

- [x] T014 [US1] Implement `open_album_viewer` cover-start orchestration with metadata lookup in src-tauri/src/lib.rs
- [x] T015 [US1] Implement `load_album_image` command to return a single visible image payload in src-tauri/src/lib.rs
- [x] T016 [US1] Implement ZIP image-by-index loading with supported-type validation in src-tauri/src/services/zip_service.rs

### Frontend (React) (US1)

- [x] T017 [US1] Add viewer session/image/loading/error state and open/load actions in src/features/library/store/libraryStore.ts
- [x] T018 [US1] Add album-open action wiring from cards to viewer flow in src/features/library/components/AlbumCard.tsx
- [x] T019 [US1] Render viewer header (album name + counter) and current image area in src/features/library/components/LibraryView.tsx

### Integration (US1)

- [x] T020 [US1] Wire store actions to Tauri invoke wrappers for open/load commands in src/features/library/store/libraryStore.ts

### Testing and Validation (US1)

- [x] T021 [US1] Add component test for header context and cover-start rendering in src/features/library/components/LibraryView.test.tsx
- [x] T022 [US1] Execute quickstart scenario 1 and record outcome in specs/003-album-viewer/quickstart.md
- [x] T023 [US1] Execute quickstart scenario 4 (lazy loading) and record outcome in specs/003-album-viewer/quickstart.md

**Checkpoint**: MVP is independently functional and app remains runnable.

---

## Phase 4: User Story 2 - Resume Reading Progress (Priority: P2)

**Goal**: Persist last viewed image and restore it when reopening the same album.

**Independent Test**: Navigate to a non-cover image, close viewer, reopen same album, and verify restoration with safe fallback when progress is invalid.

### Testing (US2)

- [x] T024 [P] [US2] Add Rust unit test for progress save and restore behavior in src-tauri/src/services/metadata_service.rs
- [x] T025 [P] [US2] Add Rust unit test for invalid-progress fallback to cover in src-tauri/src/lib.rs
- [x] T026 [P] [US2] Add frontend store test for per-album progress isolation in src/features/library/store/libraryStore.test.ts

### Backend (Rust) (US2)

- [x] T027 [US2] Implement `save_reading_progress` command with album validation in src-tauri/src/lib.rs
- [x] T028 [US2] Add progress restore fallback logic to `open_album_viewer` in src-tauri/src/lib.rs

### Frontend (React) (US2)

- [x] T029 [US2] Persist progress on successful navigation and viewer close in src/features/library/store/libraryStore.ts
- [x] T030 [US2] Apply restored start index on reopen and sync counter state in src/features/library/components/LibraryView.tsx

### Integration (US2)

- [x] T031 [US2] Wire save-progress invoke flow to store navigation lifecycle in src/features/library/store/libraryStore.ts

### Testing and Validation (US2)

- [x] T032 [US2] Add component test for resume-on-reopen behavior in src/features/library/components/LibraryView.test.tsx
- [x] T033 [US2] Execute quickstart scenario 2 and record outcome in specs/003-album-viewer/quickstart.md
- [x] T034 [US2] Execute quickstart scenario 3 and record outcome in specs/003-album-viewer/quickstart.md
- [x] T035 [US2] Execute quickstart scenario 5 and record outcome in specs/003-album-viewer/quickstart.md

**Checkpoint**: US1 and US2 work independently and app remains runnable.

---

## Phase 5: Polish and Cross-Cutting

**Purpose**: Final consistency, regression safety, and end-to-end validation.

### Infrastructure

- [x] T036 [P] Align final command error codes/messages with implemented behavior in specs/003-album-viewer/contracts/album-viewer-commands.md

### Integration

- [x] T037 [P] Update implementation notes and runnable checkpoints in specs/003-album-viewer/plan.md

### Testing and Validation

- [x] T038 Run frontend test suite covering viewer feature from src/features/library/components/LibraryView.test.tsx
- [x] T039 Run Rust test suite covering viewer services from src-tauri/Cargo.toml
- [x] T040 Run full quickstart validation and mark final pass criteria in specs/003-album-viewer/quickstart.md

---

## Dependencies and Execution Order

### Phase Dependencies

- Phase 1 (Setup): no dependencies.
- Phase 2 (Foundational): depends on Phase 1 and blocks all user stories.
- Phase 3 (US1): depends on Phase 2.
- Phase 4 (US2): depends on Phase 2 and builds on the viewer flow from US1.
- Phase 5 (Polish): depends on completion of selected user stories.

### User Story Dependencies

- US1 (P1): starts after Foundational and delivers MVP.
- US2 (P2): starts after Foundational; depends on viewer flow from US1 for reopen behavior.

### Category Flow Within Each Story

- Testing tasks first (to define behavior and catch regressions).
- Backend service/command implementation.
- Frontend state/UI implementation.
- Integration wiring.
- Validation tasks to confirm runnable state.

## Parallel Opportunities

- T011, T012, and T013 can run in parallel.
- T024, T025, and T026 can run in parallel.
- T036 and T037 can run in parallel.

## Parallel Example: User Story 1

- Run T011, T012, and T013 together (independent test additions).
- After T020, run T021 while T022 and T023 validation preparation proceeds.

## Parallel Example: User Story 2

- Run T024, T025, and T026 together.
- After T031, run T032 while validation tasks T033, T034, and T035 are prepared.

## Implementation Strategy

### MVP First

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete Phase 3 (US1).
4. Validate US1 independently through T022 and T023.

### Incremental Delivery

1. Deliver US1 as first runnable increment.
2. Add US2 persistence and restore behavior.
3. Finish with cross-cutting regression and full quickstart validation.

### Runnable State Rule

Each task is scoped to a single implementation goal and ordered so the application remains runnable after completion. Validation tasks at each phase checkpoint confirm no regression before moving forward.

