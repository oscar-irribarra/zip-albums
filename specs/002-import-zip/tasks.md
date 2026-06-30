# Tasks: Import ZIP Albums

**Input**: Design documents from [specs/002-import-zip](specs/002-import-zip)

**Prerequisites**: [specs/002-import-zip/plan.md](specs/002-import-zip/plan.md), [specs/002-import-zip/spec.md](specs/002-import-zip/spec.md), [specs/002-import-zip/research.md](specs/002-import-zip/research.md), [specs/002-import-zip/data-model.md](specs/002-import-zip/data-model.md), [specs/002-import-zip/contracts/import-zip-commands.md](specs/002-import-zip/contracts/import-zip-commands.md)

**Tests**: Included by request. Each story contains Rust and React testing tasks plus manual validation tasks.

**Organization**: Tasks are grouped by user story and categorized as Infrastructure, Backend (Rust), Frontend (React), Integration, and Testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared contracts and validation scaffolding without changing runtime behavior.

### Infrastructure

- [ ] T001 Add import request/response/error shared TypeScript models in src/shared/types/library.ts
- [ ] T002 Add import command contract baseline aligned with plan in specs/002-import-zip/contracts/import-zip-commands.md

### Testing

- [ ] T003 Add runnable validation checklist template for this feature in specs/002-import-zip/quickstart.md

**Checkpoint**: Repository remains runnable with no feature behavior change.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build infrastructure and backend primitives required by both user stories.

**Critical**: No user-story implementation starts until this phase is complete.

### Infrastructure

- [ ] T004 Extend ZIP file path validation and canonicalization helpers in src-tauri/src/services/file_system_service.rs
- [ ] T005 Add metadata duplicate detection and append helper functions in src-tauri/src/services/metadata_service.rs

### Backend (Rust)

- [ ] T006 Add import domain error/result structs and command request DTO in src-tauri/src/lib.rs
- [ ] T007 Extend ZIP inspection to return typed failure states in src-tauri/src/services/zip_service.rs
- [ ] T008 Wire import_album command registration in src-tauri/src/lib.rs

### Integration

- [ ] T009 Add foundational command contract alignment notes for import_album in specs/002-import-zip/contracts/import-zip-commands.md

### Validation

- [ ] T010 Validate foundational backend compiles cleanly using src-tauri/Cargo.toml

**Checkpoint**: Backend foundation exists and app is still runnable.

---

## Phase 3: User Story 1 - Import a New Album from ZIP (Priority: P1) 🎯 MVP

**Goal**: User can import a valid ZIP and see the new album immediately.

**Independent Test**: Import a valid ZIP with mixed supported/unsupported entries and verify album is added immediately with preserved image order and first image cover.

### Testing (US1)

- [ ] T011 [P] [US1] Add Rust unit test for valid ZIP with mixed entries and preserved order in src-tauri/src/services/zip_service.rs
- [ ] T012 [P] [US1] Add Rust unit test for metadata append success path in src-tauri/src/services/metadata_service.rs

### Backend (Rust) (US1)

- [ ] T013 [US1] Implement import_album happy-path orchestration in src-tauri/src/lib.rs

### Frontend (React) (US1)

- [ ] T014 [US1] Add importing state and importAlbum success action in src/features/library/store/libraryStore.ts
- [ ] T015 [US1] Add Import ZIP UI trigger and success feedback in src/features/library/components/LibraryView.tsx

### Integration (US1)

- [ ] T016 [US1] Integrate file selection plus import_album invoke flow in src/features/library/components/LibraryView.tsx

### Testing and Validation (US1)

- [ ] T017 [US1] Add frontend store test for successful immediate album insertion in src/features/library/store/libraryStore.test.ts
- [ ] T018 [US1] Add component test for post-import album rendering in src/features/library/components/LibraryView.test.tsx
- [ ] T019 [US1] Execute happy-path quickstart validation and capture result in specs/002-import-zip/quickstart.md

**Checkpoint**: MVP works independently and remains runnable.

---

## Phase 4: User Story 2 - Detect and Report Invalid ZIP Errors (Priority: P2)

**Goal**: User receives clear error messages for invalid import attempts.

**Independent Test**: Attempt import with non-ZIP, corrupted ZIP, empty ZIP, no-supported-images ZIP, and duplicate ZIP; verify specific message and unchanged library state.

### Testing (US2)

- [ ] T020 [P] [US2] Add Rust unit tests for corrupted, empty, and no-supported-images ZIP outcomes in src-tauri/src/services/zip_service.rs
- [ ] T021 [P] [US2] Add Rust command tests for duplicate and IO failure error mapping in src-tauri/src/lib.rs

### Backend (Rust) (US2)

- [ ] T022 [US2] Implement full import error code mapping for command responses in src-tauri/src/lib.rs

### Frontend (React) (US2)

- [ ] T023 [US2] Add backend error-code to user-message mapping in src/features/library/store/libraryStore.ts
- [ ] T024 [US2] Render import error feedback states for all invalid ZIP cases in src/features/library/components/LibraryView.tsx

### Integration (US2)

- [ ] T025 [US2] Enforce unchanged albums state on failed imports in src/features/library/store/libraryStore.ts

### Testing and Validation (US2)

- [ ] T026 [US2] Add frontend component tests for invalid ZIP error messaging in src/features/library/components/LibraryView.test.tsx
- [ ] T027 [US2] Execute invalid-case quickstart scenarios and record outcomes in specs/002-import-zip/quickstart.md

**Checkpoint**: US1 and US2 both work independently and app is runnable.

---

## Phase 5: Polish and Cross-Cutting

**Purpose**: Final contract/doc validation and regression checks without adding new abstractions.

### Infrastructure

- [ ] T028 [P] Align final command examples with implemented payloads in specs/002-import-zip/contracts/import-zip-commands.md

### Integration

- [ ] T029 [P] Add phase-by-phase runnable verification notes in specs/002-import-zip/quickstart.md

### Testing and Validation

- [ ] T030 Run full feature validation checklist and mark pass criteria in specs/002-import-zip/quickstart.md

---

## Dependencies and Execution Order

### Phase Dependencies

- Phase 1 (Setup): no dependencies.
- Phase 2 (Foundational): depends on Phase 1 and blocks all user stories.
- Phase 3 (US1): depends on Phase 2.
- Phase 4 (US2): depends on Phase 2 and builds on US1 behavior for duplicate checks.
- Phase 5 (Polish): depends on completion of selected user stories.

### User Story Dependencies

- US1 (P1): starts after Foundational and delivers MVP.
- US2 (P2): starts after Foundational; relies on import command path from US1.

### Category Flow Inside Each Story

- Infrastructure or contract-first updates (if any).
- Backend implementation.
- Frontend implementation.
- Integration wiring.
- Testing and validation before closing the story.

## Parallel Opportunities

- T011 and T012 can run in parallel.
- T017 and T018 can run in parallel.
- T020 and T021 can run in parallel.
- T028 and T029 can run in parallel.

## Parallel Example: User Story 1

- Run T011 and T012 together (independent Rust test additions in separate files).
- After T016, run T017 and T018 together (store test and component test in separate files).

## Parallel Example: User Story 2

- Run T020 and T021 together (service-level tests and command-level tests).
- Complete T023 and T024 sequentially, then run T026.

## Implementation Strategy

### MVP First

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete Phase 3 (US1).
4. Validate runnable MVP via T019.

### Incremental Delivery

1. Ship US1 as initial value increment.
2. Add US2 error handling increment.
3. Finish with Phase 5 validation and contract alignment.

### Runnable State Rule

Each task is scoped to a single goal and ordered to keep the app runnable after completion. Validation tasks at the end of each phase confirm no regressions before moving forward.