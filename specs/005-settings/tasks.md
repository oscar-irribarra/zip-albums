# Tasks: Settings Persistence

**Input**: Design documents from `/specs/005-settings/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Testing tasks are included because this feature explicitly requires testing and validation.

**Organization**: Tasks are grouped by user story for independent delivery, and each story phase is organized into Infrastructure, Backend (Rust), Frontend (React), Integration, and Testing work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Every task includes exact file path(s)

## Phase 1: Setup (Infrastructure)

**Purpose**: Create minimal project structure for settings feature without changing behavior.

- [ ] T001 Infrastructure: Create settings feature structure in `src/features/settings/components/SettingsPanel.tsx`, `src/features/settings/store/settingsStore.ts`, and `src/features/settings/index.ts`
- [ ] T002 Infrastructure: Add settings contracts to shared frontend models in `src/shared/types/library.ts`
- [ ] T003 [P] Infrastructure: Add typed settings command wrappers in `src/infrastructure/tauri.ts`
- [ ] T004 Validation: Verify TypeScript compiles after setup changes with `pnpm exec tsc --noEmit` from repository root

**Checkpoint**: Repository builds and remains runnable with scaffolding only.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core settings persistence foundations required by all user stories.

**⚠️ CRITICAL**: No user story implementation starts before this phase completes.

### Infrastructure

- [ ] T005 Infrastructure: Extend catalog data shape with defaults for settings metadata in `src-tauri/src/services/metadata_service.rs`

### Backend (Rust)

- [ ] T006 Backend (Rust): Add read/write settings helpers in `src-tauri/src/services/metadata_service.rs`
- [ ] T007 Backend (Rust): Add albums directory validation and canonicalization helper in `src-tauri/src/services/file_system_service.rs`
- [ ] T008 Backend (Rust): Add settings command request/response structs and error mapping in `src-tauri/src/lib.rs`
- [ ] T009 Backend (Rust): Add Tauri command registration stubs for `get_startup_context`, `update_user_settings`, and `set_last_opened_album` in `src-tauri/src/lib.rs`

### Frontend (React)

- [ ] T010 Frontend (React): Implement base settings store state/actions (`loadSettings`, `saveSettings`, `applyRuntimePreferences`) in `src/features/settings/store/settingsStore.ts`

### Testing

- [ ] T011 Testing: Add Rust unit tests for settings metadata defaults and read/write roundtrip in `src-tauri/src/services/metadata_service.rs`
- [ ] T012 [P] Testing: Add Rust unit tests for albums directory validation paths in `src-tauri/src/services/file_system_service.rs`

### Validation

- [ ] T013 Validation: Run `cargo test` in `src-tauri/` and fix foundational failures before user story work

**Checkpoint**: Core persistence and validation primitives are in place and tested.

---

## Phase 3: User Story 1 - Configurar preferencias (Priority: P1) 🎯 MVP

**Goal**: User can configure and save theme, albums folder, fullscreen, remember-last-album, and initial zoom.

**Independent Test**: Open settings, change all five preferences, save, and confirm immediate runtime application and persisted response.

### Testing (US1)

- [ ] T014 [P] [US1] Testing: Add component tests for settings form controls and validation messages in `src/features/settings/components/SettingsPanel.test.tsx`
- [ ] T015 [P] [US1] Testing: Add store tests for save success/failure and optimistic UI states in `src/features/settings/store/settingsStore.test.ts`
- [ ] T016 [P] [US1] Testing: Add Rust command tests for `update_user_settings` valid/invalid payloads in `src-tauri/src/lib.rs`

### Backend (Rust) (US1)

- [ ] T017 [US1] Backend (Rust): Implement `update_user_settings` command with zoom and folder validation in `src-tauri/src/lib.rs`
- [ ] T018 [US1] Backend (Rust): Persist validated settings and updated timestamp via `MetadataService` in `src-tauri/src/services/metadata_service.rs`

### Frontend (React) (US1)

- [ ] T019 [US1] Frontend (React): Implement settings form UI and field-level validation in `src/features/settings/components/SettingsPanel.tsx`
- [ ] T020 [US1] Frontend (React): Connect settings form to settings store actions in `src/features/settings/store/settingsStore.ts` and `src/features/settings/components/SettingsPanel.tsx`

### Integration (US1)

- [ ] T021 [US1] Integration: Wire settings panel into app shell and feature export in `src/App.tsx` and `src/features/settings/index.ts`
- [ ] T022 [US1] Integration: Connect frontend settings save flow to Tauri commands in `src/infrastructure/tauri.ts` and `src/features/settings/store/settingsStore.ts`

### Validation (US1)

- [ ] T023 [US1] Validation: Execute quickstart Scenario A and document pass/fail notes in `specs/005-settings/quickstart.md`

**Checkpoint**: MVP complete. User can configure and save settings in a runnable app.

---

## Phase 4: User Story 2 - Recuperar configuracion al reiniciar (Priority: P2)

**Goal**: Settings and optional last-opened album are restored correctly across application restarts.

**Independent Test**: Save settings, close/reopen app, verify restored preferences and conditional album restore behavior.

### Testing (US2)

- [ ] T024 [P] [US2] Testing: Add Rust command tests for `get_startup_context` restoration and warning cases in `src-tauri/src/lib.rs`
- [ ] T025 [P] [US2] Testing: Add frontend startup tests for remember-last-album ON/OFF behavior in `src/features/settings/store/settingsStore.test.ts`
- [ ] T026 [P] [US2] Testing: Extend library store tests for last-opened-album persistence trigger in `src/features/library/store/libraryStore.test.ts`

### Backend (Rust) (US2)

- [ ] T027 [US2] Backend (Rust): Implement `get_startup_context` command to return settings, warnings, and conditional `restore_album_id` in `src-tauri/src/lib.rs`
- [ ] T028 [US2] Backend (Rust): Implement `set_last_opened_album` command and metadata persistence in `src-tauri/src/lib.rs` and `src-tauri/src/services/metadata_service.rs`

### Frontend (React) (US2)

- [ ] T029 [US2] Frontend (React): Implement startup initialization flow for loading/applying restored settings in `src/features/settings/store/settingsStore.ts` and `src/App.tsx`
- [ ] T030 [US2] Frontend (React): Surface startup warnings for inaccessible albums directory in `src/features/settings/components/SettingsPanel.tsx` and `src/features/library/components/LibraryView.tsx`

### Integration (US2)

- [ ] T031 [US2] Integration: Call `set_last_opened_album` when a viewer session opens and remember-last-album is enabled in `src/features/library/store/libraryStore.ts`
- [ ] T032 [US2] Integration: Restore last album on startup when `restore_album_id` is present in `src/App.tsx`, `src/features/settings/store/settingsStore.ts`, and `src/features/library/store/libraryStore.ts`

### Validation (US2)

- [ ] T033 [US2] Validation: Execute quickstart Scenarios B, C, and D and record outcomes in `specs/005-settings/quickstart.md`

**Checkpoint**: Persistence across executions works end-to-end and remains independently testable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening across both stories while preserving runnable state.

### Testing

- [ ] T034 Testing: Run full frontend tests with `pnpm test` and resolve regressions in `src/features/settings/**/*.test.ts*` and `src/features/library/**/*.test.ts*`
- [ ] T035 Testing: Run full Rust tests with `cargo test` in `src-tauri/` and resolve regressions in `src-tauri/src/**/*.rs`

### Integration

- [ ] T036 Integration: Verify command/type contract consistency between `src/shared/types/library.ts`, `src/infrastructure/tauri.ts`, and `src-tauri/src/lib.rs`

### Validation

- [ ] T037 Validation: Run complete manual startup and settings smoke flow from `specs/005-settings/quickstart.md` and confirm app remains runnable
- [ ] T038 Validation: Update feature notes and implementation assumptions in `specs/005-settings/plan.md` and `specs/005-settings/quickstart.md` if behavior changed during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 2 completion and integrates with US1 paths while remaining independently testable.
- **Phase 5 (Polish)**: Depends on desired story completion.

### User Story Dependencies

- **US1 (P1)**: First delivery slice (MVP), no dependency on US2.
- **US2 (P2)**: Depends on foundational settings primitives and integrates with viewer open flow from existing library behavior.

### Category Dependencies Inside Each Story

- Testing tasks first (expected to fail before implementation).
- Backend and Frontend implementation tasks next.
- Integration tasks after core implementation.
- Validation tasks last for each story.

### Parallel Opportunities

- Setup task `T003` can run in parallel with `T002` after `T001`.
- Foundational tests `T011` and `T012` can run in parallel.
- US1 tests `T014`, `T015`, and `T016` can run in parallel.
- US2 tests `T024`, `T025`, and `T026` can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Execute US1 testing tasks in parallel:
T014 SettingsPanel component tests
T015 settingsStore unit tests
T016 Rust update_user_settings command tests

# Then execute implementation tracks in parallel:
T017-T018 Backend (Rust)
T019-T020 Frontend (React)
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate with T023.
4. Keep app runnable and demo-ready before moving to US2.

### Incremental Delivery

1. Foundation complete -> runnable.
2. US1 complete -> configurable settings shipped.
3. US2 complete -> cross-execution restore shipped.
4. Polish phase -> full confidence and documentation sync.

### Runnable-State Rule

- Every task is scoped to a single goal.
- After each completed task, run targeted validation (`tsc`, relevant tests, or scenario checks) before moving on.
