# Tasks: Keyboard Shortcuts

**Input**: Design documents from `/specs/007-keyboard-shortcuts/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included as requested. Every story contains testing and validation tasks.

**Organization**: Tasks are grouped by user story for independent implementation, testing, and incremental runnable delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Story label for user story phases only (`[US1]`, `[US2]`, `[US3]`)
- Each task includes concrete file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare keyboard-shortcut implementation scaffolding without changing behavior.

### Infrastructure

- [X] T001 Document shortcut scope and manual validation matrix in specs/007-keyboard-shortcuts/quickstart.md

### Backend (Rust)

- [X] T002 Add test placeholder section for shortcut-regression checks in src-tauri/src/lib.rs

### Frontend (React)

- [X] T003 Add shortcut constants map scaffold for supported key gestures in src/features/library/components/LibraryView.tsx

### Integration

- [X] T004 Confirm command references used by shortcuts and annotate contract notes in specs/007-keyboard-shortcuts/contracts/keyboard-shortcuts-commands.md

### Testing

- [X] T005 [P] Add frontend keyboard test describe blocks (empty scaffolds) in src/features/library/components/LibraryView.test.tsx
- [X] T006 [P] Add store regression test describe blocks (empty scaffolds) in src/features/library/store/libraryStore.test.ts

**Checkpoint**: Setup completed; app remains runnable with no functional behavior changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared shortcut guards and minimal contracts required before implementing user stories.

**⚠️ CRITICAL**: No user story implementation should start before this phase is complete.

### Infrastructure

- [X] T007 Define shared shortcut guard helper typing in src/shared/types/library.ts

### Backend (Rust)

- [X] T008 Add Rust regression test for unchanged image-load error contract in src-tauri/src/lib.rs

### Frontend (React)

- [X] T009 Implement reusable editable-target keyboard guard utility in src/features/library/components/LibraryView.tsx
- [X] T010 Implement key gesture normalization helper for shortcut matching in src/features/library/components/LibraryView.tsx

### Integration

- [X] T011 Wire normalized gesture mapping to existing store actions without behavior expansion in src/features/library/components/LibraryView.tsx

### Testing

- [X] T012 [P] Add unit tests for editable-target guard and gesture normalization in src/features/library/components/LibraryView.test.tsx

### Validation

- [X] T013 Run foundational validation (`pnpm exec tsc --noEmit`, `pnpm test -- --run src/features/library/components/LibraryView.test.tsx`, `cargo test`) and record outcomes in specs/007-keyboard-shortcuts/quickstart.md

**Checkpoint**: Shared shortcut foundation is complete and tested; user stories can now be implemented incrementally.

---

## Phase 3: User Story 1 - Navegar imagenes sin mouse (Priority: P1) 🎯 MVP

**Goal**: Enable Arrow Left/Right and Home/End keyboard navigation in viewer context.

**Independent Test**: With an opened album viewer, navigate with Arrow Left/Right/Home/End and verify expected image index transitions.

### Infrastructure

- [X] T014 [US1] Add viewer-navigation shortcut acceptance checklist entries in specs/007-keyboard-shortcuts/quickstart.md

### Backend (Rust)

- [X] T015 [US1] Add Rust regression test for boundary-safe `load_album_image` behavior used by keyboard navigation in src-tauri/src/lib.rs

### Frontend (React)

- [X] T016 [US1] Implement ArrowLeft and ArrowRight key handling with viewer boundary guards in src/features/library/components/LibraryView.tsx
- [X] T017 [US1] Implement Home key handling to navigate to first image via existing goToImage action in src/features/library/components/LibraryView.tsx
- [X] T018 [US1] Implement End key handling to navigate to last image via existing goToImage action in src/features/library/components/LibraryView.tsx

### Integration

- [X] T019 [US1] Ensure keyboard navigation path reuses existing lazy image-loading flow in src/features/library/store/libraryStore.ts

### Testing

- [X] T020 [P] [US1] Add component tests for ArrowLeft/ArrowRight navigation behavior in src/features/library/components/LibraryView.test.tsx
- [X] T021 [P] [US1] Add component tests for Home/End navigation behavior in src/features/library/components/LibraryView.test.tsx

### Validation

- [X] T022 [US1] Execute quickstart Scenarios A and B and log results in specs/007-keyboard-shortcuts/quickstart.md

**Checkpoint**: MVP completed; viewer keyboard navigation works independently while app remains runnable.

---

## Phase 4: User Story 2 - Controlar pantalla completa por teclado (Priority: P2)

**Goal**: Enable fullscreen enter/exit with F and Escape in proper viewer/fullscreen context.

**Independent Test**: Open viewer, press F to enter fullscreen, press Escape to exit fullscreen.

### Infrastructure

- [X] T023 [US2] Add fullscreen-shortcut validation steps and expected outcomes in specs/007-keyboard-shortcuts/quickstart.md

### Backend (Rust)

- [X] T024 [US2] Add Rust smoke regression test ensuring viewer commands remain unaffected by fullscreen shortcut flows in src-tauri/src/lib.rs

### Frontend (React)

- [X] T025 [US2] Implement F key handling to request fullscreen only when viewer is active in src/features/library/components/LibraryView.tsx
- [X] T026 [US2] Implement Escape key handling to exit fullscreen only when fullscreen is active in src/features/library/components/LibraryView.tsx

### Integration

- [X] T027 [US2] Integrate fullscreen shortcut errors with existing non-blocking viewer error messaging in src/features/library/components/LibraryView.tsx

### Testing

- [X] T028 [P] [US2] Add component tests for F fullscreen entry behavior in src/features/library/components/LibraryView.test.tsx
- [X] T029 [P] [US2] Add component tests for Escape fullscreen exit behavior in src/features/library/components/LibraryView.test.tsx

### Validation

- [X] T030 [US2] Execute quickstart Scenario C and log results in specs/007-keyboard-shortcuts/quickstart.md

**Checkpoint**: Fullscreen keyboard flow is complete and testable independent of remaining stories.

---

## Phase 5: User Story 3 - Ejecutar acciones de biblioteca con atajos (Priority: P3)

**Goal**: Enable Ctrl+O import and Delete album action with context guards and confirmation.

**Independent Test**: Trigger import via Ctrl+O and delete selected album via Delete+confirm while ensuring no action on invalid context.

### Infrastructure

- [X] T031 [US3] Add library-action shortcut validation steps and edge-case matrix in specs/007-keyboard-shortcuts/quickstart.md

### Backend (Rust)

- [X] T032 [US3] Add Rust regression test for `delete_album` contract stability used by keyboard-triggered deletion in src-tauri/src/lib.rs

### Frontend (React)

- [X] T033 [US3] Implement Ctrl+O handling to open existing ZIP import flow in src/features/library/components/LibraryView.tsx
- [X] T034 [US3] Implement Delete handling to trigger existing deletion confirmation flow for selected album in src/features/library/components/LibraryView.tsx
- [X] T035 [US3] Implement invalid-context no-op logic for Delete when no eligible album selection exists in src/features/library/components/LibraryView.tsx

### Integration

- [X] T036 [US3] Ensure Ctrl+O and Delete shortcuts invoke existing infrastructure command paths without bypassing src/infrastructure/tauri.ts in src/features/library/store/libraryStore.ts

### Testing

- [X] T037 [P] [US3] Add component tests for Ctrl+O import trigger path in src/features/library/components/LibraryView.test.tsx
- [X] T038 [P] [US3] Add component tests for Delete confirmation and no-selection no-op behavior in src/features/library/components/LibraryView.test.tsx

### Validation

- [X] T039 [US3] Execute quickstart Scenarios D and E and log results in specs/007-keyboard-shortcuts/quickstart.md

**Checkpoint**: Library keyboard actions are complete and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening across stories while preserving runnable state.

### Infrastructure

- [X] T040 Update final implementation notes and scenario pass/fail summary in specs/007-keyboard-shortcuts/plan.md

### Backend (Rust)

- [X] T041 Verify no shortcut-related command regressions in src-tauri/src/lib.rs and src-tauri/src/services/zip_service.rs

### Frontend (React)

- [X] T042 Harden cross-platform modifier handling notes (Ctrl/Command fallback behavior) in src/features/library/components/LibraryView.tsx

### Integration

- [X] T043 Validate cross-layer contract consistency between src/shared/types/library.ts, src/infrastructure/tauri.ts, and src/features/library/components/LibraryView.tsx

### Testing

- [X] T044 Run full frontend test sweep for library feature (`pnpm test -- --run src/features/library/components/LibraryView.test.tsx src/features/library/store/libraryStore.test.ts`) and record outcomes in specs/007-keyboard-shortcuts/quickstart.md
- [X] T045 Run full Rust test sweep (`cargo test` in src-tauri) and record outcomes in specs/007-keyboard-shortcuts/quickstart.md

### Validation

- [X] T046 Execute complete quickstart validation sequence and confirm runnable state after each phase in specs/007-keyboard-shortcuts/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user story work.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 3 (viewer context and key handler base already active).
- **Phase 5 (US3)**: Depends on Phase 2; scheduled after US2 by priority.
- **Phase 6 (Polish)**: Depends on all user stories being complete.

### User Story Dependencies

- **US1 (P1)**: MVP story and first independent deliverable.
- **US2 (P2)**: Builds on viewer keyboard context established in US1.
- **US3 (P3)**: Depends on foundational guards and existing library actions; remains independently testable.

### Within Each User Story

- Testing tasks for the story are defined before implementation tasks.
- Infrastructure/Rust/Frontend tasks are completed before integration task.
- Integration task completes before story validation task.

### Parallel Opportunities

- Setup testing scaffolds `T005` and `T006` can run in parallel.
- Foundational tests `T012` can run in parallel with Rust contract test `T008`.
- US1 tests `T020` and `T021` can run in parallel.
- US2 tests `T028` and `T029` can run in parallel.
- US3 tests `T037` and `T038` can run in parallel.

---

## Parallel Example: User Story 1

- Task `T020`: Add ArrowLeft/ArrowRight component tests in src/features/library/components/LibraryView.test.tsx
- Task `T021`: Add Home/End component tests in src/features/library/components/LibraryView.test.tsx

---

## Parallel Example: User Story 2

- Task `T028`: Add F fullscreen entry test in src/features/library/components/LibraryView.test.tsx
- Task `T029`: Add Escape fullscreen exit test in src/features/library/components/LibraryView.test.tsx

---

## Parallel Example: User Story 3

- Task `T037`: Add Ctrl+O import trigger test in src/features/library/components/LibraryView.test.tsx
- Task `T038`: Add Delete confirmation/no-selection tests in src/features/library/components/LibraryView.test.tsx

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 Setup.
2. Complete Phase 2 Foundational.
3. Complete Phase 3 (US1).
4. Validate US1 independently through Scenarios A and B.

### Incremental Delivery

1. Deliver US1 keyboard navigation.
2. Deliver US2 fullscreen shortcuts.
3. Deliver US3 library action shortcuts.
4. Run final polish validation.

### Runnable-State Rule

- Each task is scoped to a single implementation goal.
- Tasks avoid unrelated responsibilities in one step.
- Every phase ends with explicit validation confirming the app remains runnable.
