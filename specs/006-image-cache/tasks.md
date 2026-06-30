# Tasks: Image Cache

**Input**: Design documents from `/specs/006-image-cache/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Testing and validation tasks are included because this feature explicitly requires measurable performance and stability verification.

**Organization**: Tasks are grouped by user story for independent delivery, and each story phase is organized into Infrastructure, Backend (Rust), Frontend (React), Integration, and Testing work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Every task includes exact file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare non-functional scaffolding for image cache work without changing behavior.

### Infrastructure

- [X] T001 Add image-cache task references and scenario placeholders in specs/006-image-cache/quickstart.md
- [X] T002 Add cache contract verification notes in specs/006-image-cache/contracts/image-cache-commands.md

### Backend (Rust)

- [X] T003 Add viewer command baseline assertions for cache-related invariants in src-tauri/src/lib.rs

### Frontend (React)

- [X] T004 Add cache configuration constants (window radius, entry cap, byte budget) in src/features/library/store/libraryStore.ts

### Integration

- [X] T005 Add non-breaking cache state placeholders to LibraryState shape in src/features/library/store/libraryStore.ts

### Testing

- [X] T006 [P] Add baseline store test scaffold for image-cache flows in src/features/library/store/libraryStore.test.ts

### Validation

- [X] T007 Run baseline validation (`pnpm exec tsc --noEmit` and `pnpm test -- libraryStore.test.ts`) from repository root and record status in specs/006-image-cache/quickstart.md

**Checkpoint**: Setup complete, app remains runnable, and no user-visible behavior changes yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement reusable cache primitives that all user stories depend on.

**⚠️ CRITICAL**: No user story implementation starts before this phase completes.

### Infrastructure

- [X] T008 Define frontend cache entry and cache window TypeScript models in src/shared/types/library.ts
- [X] T009 [P] Add typed cache utility wrappers/helpers used by store actions in src/infrastructure/tauri.ts

### Backend (Rust)

- [X] T010 Keep stable viewer error contract for cache-triggered loads by hardening IMAGE_INDEX_OUT_OF_RANGE mapping in src-tauri/src/lib.rs

### Frontend (React)

- [X] T011 Implement pure helper functions for cache window calculation and boundary clamping in src/features/library/store/libraryStore.ts
- [X] T012 Implement pure helper functions for image-size estimation and deterministic eviction ordering in src/features/library/store/libraryStore.ts

### Integration

- [X] T013 Wire cache helper outputs into non-mutating store selectors for diagnostics in src/features/library/store/libraryStore.ts

### Testing

- [X] T014 [P] Add unit tests for cache window and boundary helper functions in src/features/library/store/libraryStore.test.ts
- [X] T015 [P] Add unit tests for eviction ordering and byte-budget helper functions in src/features/library/store/libraryStore.test.ts
- [X] T016 [P] Add Rust regression tests for viewer error code stability in src-tauri/src/lib.rs

### Validation

- [X] T017 Run foundational test suite (`pnpm test -- libraryStore.test.ts` and `cargo test`) and update results in specs/006-image-cache/quickstart.md

**Checkpoint**: Foundational cache primitives are tested and stable; user story work can proceed.

---

## Phase 3: User Story 1 - Navegacion fluida entre imagenes (Priority: P1) 🎯 MVP

**Goal**: Keep previous/current/next images ready so immediate navigation feels smooth.

**Independent Test**: Open an album and navigate N -> N+1 -> N-1 with responsive transitions and correct image rendering.

### Infrastructure (US1)

- [X] T018 [US1] Add optional cache diagnostics fields for current/prev/next occupancy in src/shared/types/library.ts

### Backend (Rust) (US1)

- [X] T019 [US1] Ensure load_album_image command path remains lazy and single-image only for prefetch calls in src-tauri/src/lib.rs

### Frontend (React) (US1)

- [X] T020 [US1] Seed viewer cache with current image on openAlbumViewer success in src/features/library/store/libraryStore.ts
- [X] T021 [US1] Implement adjacent prefetch routine for current_index - 1 and current_index + 1 in src/features/library/store/libraryStore.ts
- [X] T022 [US1] Reuse cached entries before invoking loadAlbumImage in goToImage and loadThumbnailImage in src/features/library/store/libraryStore.ts

### Integration (US1)

- [X] T023 [US1] Integrate adjacent-prefetch trigger after successful navigation update in src/features/library/store/libraryStore.ts
- [X] T024 [US1] Keep ThumbnailStrip selection flow compatible with cache hits in src/features/library/components/ThumbnailStrip.tsx

### Testing (US1)

- [X] T025 [P] [US1] Add store tests for cache seeding on viewer open in src/features/library/store/libraryStore.test.ts
- [X] T026 [P] [US1] Add store tests for adjacent prefetch on next/previous navigation in src/features/library/store/libraryStore.test.ts
- [X] T027 [P] [US1] Add component test for responsive previous/next navigation rendering in src/features/library/components/LibraryView.test.tsx

### Validation (US1)

- [X] T028 [US1] Execute quickstart Scenario A and record measured outcomes in specs/006-image-cache/quickstart.md

**Checkpoint**: MVP complete; adjacent navigation is improved and independently testable in a runnable app.

---

## Phase 4: User Story 2 - Uso de memoria controlado (Priority: P2)

**Goal**: Enforce bounded in-memory cache and evict distant images deterministically.

**Independent Test**: Navigate continuously in a large album and confirm cache remains within configured limits without breaking viewer behavior.

### Infrastructure (US2)

- [X] T029 [US2] Add configurable cache budget constants with safe defaults in src/features/library/store/libraryStore.ts

### Backend (Rust) (US2)

- [X] T030 [US2] Add Rust command-level regression test to confirm no cache persistence side effects in metadata paths in src-tauri/src/lib.rs

### Frontend (React) (US2)

- [X] T031 [US2] Implement out-of-window eviction pass after each navigation update in src/features/library/store/libraryStore.ts
- [X] T032 [US2] Implement byte-budget enforcement pass that evicts farthest entries until under budget in src/features/library/store/libraryStore.ts
- [X] T033 [US2] Preserve current and adjacent entries as eviction-protected candidates when feasible in src/features/library/store/libraryStore.ts

### Integration (US2)

- [X] T034 [US2] Integrate eviction and budget enforcement into openAlbumViewer/goToImage/loadThumbnailImage lifecycle in src/features/library/store/libraryStore.ts
- [X] T035 [US2] Clear cache deterministically on closeViewer and album switch in src/features/library/store/libraryStore.ts

### Testing (US2)

- [X] T036 [P] [US2] Add store tests for distant-image eviction behavior in src/features/library/store/libraryStore.test.ts
- [X] T037 [P] [US2] Add store tests for byte-budget enforcement and farthest-first eviction in src/features/library/store/libraryStore.test.ts
- [X] T038 [P] [US2] Add store tests for rapid back-and-forth navigation without duplicate cache entries in src/features/library/store/libraryStore.test.ts

### Validation (US2)

- [X] T039 [US2] Execute quickstart Scenarios B and E and log memory-behavior results in specs/006-image-cache/quickstart.md

**Checkpoint**: Cache memory remains bounded and independently verifiable while app stays runnable.

---

## Phase 5: User Story 3 - Comportamiento estable en bordes (Priority: P3)

**Goal**: Ensure boundary-safe cache behavior for first/last image and jump navigation.

**Independent Test**: Validate first image, last image, and distant jump navigation without invalid neighbor requests.

### Infrastructure (US3)

- [X] T040 [US3] Add boundary-case validation checklist entries in specs/006-image-cache/quickstart.md

### Backend (Rust) (US3)

- [X] T041 [US3] Add Rust regression test for out-of-range image load responses used by boundary handling in src-tauri/src/lib.rs

### Frontend (React) (US3)

- [X] T042 [US3] Clamp adjacent prefetch targets to valid index range for first/last image in src/features/library/store/libraryStore.ts
- [X] T043 [US3] Recenter cache window and drop stale distant entries after jump navigation in src/features/library/store/libraryStore.ts
- [X] T044 [US3] Prevent duplicate cache keys during rapid boundary navigation updates in src/features/library/store/libraryStore.ts

### Integration (US3)

- [X] T045 [US3] Keep LibraryView boundary controls aligned with cache-safe navigation behavior in src/features/library/components/LibraryView.tsx

### Testing (US3)

- [X] T046 [P] [US3] Add store tests for first/last boundary cache updates in src/features/library/store/libraryStore.test.ts
- [X] T047 [P] [US3] Add store tests for jump navigation recentering and stale-entry cleanup in src/features/library/store/libraryStore.test.ts
- [X] T048 [P] [US3] Add component test to assert no invalid boundary navigation calls from UI controls in src/features/library/components/LibraryView.test.tsx

### Validation (US3)

- [X] T049 [US3] Execute quickstart Scenarios C and D and record pass/fail evidence in specs/006-image-cache/quickstart.md

**Checkpoint**: Boundary and jump behavior are robust and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and runnable-state hardening across all stories.

### Infrastructure

- [X] T050 Update implementation notes and final cache policy values in specs/006-image-cache/plan.md

### Backend (Rust)

- [X] T051 Verify Rust command/type consistency for cache-related flows in src-tauri/src/lib.rs and src-tauri/src/services/zip_service.rs

### Frontend (React)

- [X] T052 Remove temporary debug-only cache traces while keeping diagnostics needed for tests in src/features/library/store/libraryStore.ts

### Integration

- [X] T053 Verify cross-layer contract consistency between src/shared/types/library.ts, src/infrastructure/tauri.ts, and src-tauri/src/lib.rs

### Testing

- [X] T054 Run full frontend tests with pnpm test and resolve regressions in src/features/library/components/*.test.tsx and src/features/library/store/libraryStore.test.ts
- [X] T055 Run full Rust tests with cargo test in src-tauri/ and resolve regressions in src-tauri/src/lib.rs

### Validation

- [X] T056 Run complete quickstart validation from specs/006-image-cache/quickstart.md and confirm app remains runnable after each completed phase

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 3 because budget/eviction builds on adjacent prefetch behavior.
- **Phase 5 (US3)**: Depends on Phase 3 and Phase 4 cache lifecycle behavior.
- **Phase 6 (Polish)**: Depends on all user stories.

### User Story Dependencies

- **US1 (P1)**: Delivers MVP and is independently testable.
- **US2 (P2)**: Extends US1 with memory-budget controls and remains independently testable.
- **US3 (P3)**: Hardens edge behavior and remains independently testable.

### Category Dependencies Inside Each Story

- Testing tasks first (expected to fail before implementation).
- Infrastructure/Backend/Frontend implementation tasks next.
- Integration tasks after core implementation.
- Validation tasks last for each story.

### Parallel Opportunities

- Phase 1: `T006` can run in parallel after `T004`.
- Phase 2: `T014`, `T015`, and `T016` can run in parallel.
- US1: `T025`, `T026`, and `T027` can run in parallel.
- US2: `T036`, `T037`, and `T038` can run in parallel.
- US3: `T046`, `T047`, and `T048` can run in parallel.

---

## Parallel Example: User Story 2

```bash
# Execute US2 testing tasks in parallel:
T036 Distant-image eviction tests
T037 Byte-budget enforcement tests
T038 Duplicate-entry prevention tests

# Then implementation can proceed in focused tracks:
T031-T033 Frontend cache lifecycle logic
T034-T035 Integration into viewer lifecycle
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate with `T028`.
4. Keep app runnable and demo-ready before memory-control work.

### Incremental Delivery

1. Foundation complete -> runnable baseline.
2. US1 complete -> adjacent-cache navigation improvement shipped.
3. US2 complete -> bounded-memory behavior shipped.
4. US3 complete -> robust boundary/jump handling shipped.
5. Polish complete -> full regression confidence.

### Runnable-State Rule

- Every task targets a single implementation goal.
- After each task, run the smallest relevant validation command/test before continuing.
- Do not merge tasks that span unrelated responsibilities.

