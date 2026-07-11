# Tasks: Codebase Cleanup and Technical Debt Reduction

**Branch**: `012-codebase-cleanup`

**Input**: [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/cleanup-commands.md](contracts/cleanup-commands.md) · [quickstart.md](quickstart.md)

**Story map**:
- US1 = Source Code Cleanup (P1)
- US2 = UI Component and Asset Cleanup (P2)
- US3 = Dependency and Import Cleanup (P3)
- US4 = Legacy and Compatibility Layer Removal (P4)

**Rule**: every task must leave the application in a runnable state when complete.

---

## Phase 1: Infrastructure — Baseline Verification

**Purpose**: Confirm the full test suite and build are green before any change is made.
No file is modified in this phase. All subsequent phases must preserve this baseline.

- [X] T001 Run `pnpm test` in the repo root and record the passing test count as baseline
- [X] T002 Run `cargo test` inside `src-tauri/` and record the passing test count as baseline
- [X] T003 Run `pnpm build` and confirm TypeScript compilation exits with code 0

**Checkpoint**: Baseline green. All three commands succeed. Do not proceed unless T001–T003 all pass.

---

## Phase 2: Backend (Rust) — Remove `greet` Scaffold Command

**Goal**: Delete the unused Tauri template command from `src-tauri/src/lib.rs`.
After this phase the application builds and runs identically — the `greet` command
was never reachable from the frontend.

**Independent Test**: `cargo build` exits 0; `cargo test` still passes; `grep -n "greet" src-tauri/src/lib.rs` returns no results.

- [X] T004 [US1] Remove the `#[tauri::command]` attribute and `fn greet(name: &str) -> String` function body from `src-tauri/src/lib.rs`
- [X] T005 [US1] Remove the `greet,` entry from `tauri::generate_handler![...]` inside `pub fn run()` in `src-tauri/src/lib.rs`
- [X] T006 [US1] Run `cargo build` inside `src-tauri/` and confirm exit code 0 with no dead-code warnings

**Checkpoint**: Rust builds cleanly. `greet` is fully gone from the binary.

---

## Phase 3: Frontend (React) — Remove Dead Components

**Goal**: Delete `ImageViewer.tsx` (superseded by `ViewerScreen`) and its orphaned
colocated `ThumbnailStrip.tsx`. Neither file is imported by any live production code path.

**Independent Test**: `pnpm build` exits 0; `grep -r "ImageViewer" src/ --include="*.tsx" --include="*.ts"` returns zero results in non-test files.

- [X] T007 [US2] Delete `src/features/library/components/ImageViewer.tsx`
- [X] T008 [P] [US2] Delete `src/features/library/components/ThumbnailStrip.tsx`
- [X] T009 [US2] Run `pnpm build` and confirm no import resolution errors for the deleted files

**Checkpoint**: `ImageViewer` and its orphaned `ThumbnailStrip` are gone. `ViewerScreen` continues to use `src/features/viewer/components/ThumbnailStrip.tsx`. Build passes.

---

## Phase 4: Frontend (React) — Remove `loadAlbumImageForCache` Proxy

**Goal**: Remove the one-line proxy function from the infrastructure layer and update
its single caller in `libraryStore.ts` to call `loadAlbumImage` directly.

**Independent Test**: `pnpm build` exits 0; `grep -r "loadAlbumImageForCache" src/` returns no results.

- [X] T010 [US3] Remove the `loadAlbumImageForCache` export function from `src/infrastructure/tauri.ts` (the 3-line function that delegates to `loadAlbumImage`)
- [X] T011 [US3] In `src/features/library/store/libraryStore.ts`, replace the `loadAlbumImageForCache` import with `loadAlbumImage` and update the call site inside the store to invoke `loadAlbumImage` instead
- [X] T012 [US3] Run `pnpm build` and confirm exit code 0 with no unresolved import errors

**Checkpoint**: `loadAlbumImageForCache` is gone from the infrastructure layer. The store calls `loadAlbumImage` directly.

---

## Phase 5: Frontend (React) — Remove Dead Type Declarations

**Goal**: Delete three TypeScript types from `src/shared/types/library.ts` that are
exported but imported by zero other files in the project.

**Independent Test**: `pnpm build` exits 0; `grep -rn "ImportAlbumRequest\|ShortcutGesture\|ShortcutGuardContext" src/` returns no results.

- [X] T013 [US3] Confirm zero imports exist: run `grep -rn "ImportAlbumRequest\|ShortcutGesture\|ShortcutGuardContext" src/ --include="*.ts" --include="*.tsx"` and verify only the definition lines in `library.ts` appear
- [X] T014 [US3] Remove the `ImportAlbumRequest` interface block from `src/shared/types/library.ts`
- [X] T015 [P] [US3] Remove the `ShortcutGesture` type alias block from `src/shared/types/library.ts`
- [X] T016 [P] [US3] Remove the `ShortcutGuardContext` interface block from `src/shared/types/library.ts`
- [X] T017 [US3] Run `pnpm build` and confirm exit code 0

**Checkpoint**: Three dead type declarations removed. Build is clean.

---

## Phase 6: Testing — Remove Dead and Duplicate Test Files

**Goal**: Delete test files that reference removed code or duplicate an existing test file.

**Independent Test**: `pnpm test` exits 0; the two deleted files no longer appear in the test runner output; `src/features/library/store/libraryStore.test.ts` still passes and its test count matches the baseline from T001.

- [X] T018 [US2] Delete `src/test/ImageViewer.test.tsx` (tests the removed `ImageViewer` component)
- [X] T019 [P] [US4] Delete `src/test/libraryStore.test.ts` (byte-identical duplicate of `src/features/library/store/libraryStore.test.ts`)
- [X] T020 [US3] Remove the `loadAlbumImageForCache: (...args) => loadAlbumImageMock(...args)` entry from the `vi.mock` factory in `src/features/library/store/libraryStore.test.ts`
- [X] T021 [US3] Run `pnpm test` and confirm all remaining tests pass

**Checkpoint**: No test references a removed symbol. No duplicate test file remains. `pnpm test` is green.

---

## Phase 7: Integration — Full Build and Smoke Validation

**Purpose**: End-to-end verification that the application compiles, all tests pass,
and the running application behaves identically to the pre-cleanup baseline.

- [X] T022 Run `pnpm test` — all tests pass; test count equals baseline minus deleted tests (T018, T019)
- [X] T023 Run `cargo test` inside `src-tauri/` — all Rust tests pass; count matches T002 baseline
- [X] T024 Run `pnpm build` — TypeScript build is clean, exit code 0
- [X] T025 Run `cargo build` inside `src-tauri/` — Rust build is clean, zero dead-code warnings, exit code 0
- [X] T026 Verify deleted files are absent: `src/features/library/components/ImageViewer.tsx`, `src/features/library/components/ThumbnailStrip.tsx`, `src/test/ImageViewer.test.tsx`, `src/test/libraryStore.test.ts`
- [X] T027 Verify modified files contain no removed symbols: `loadAlbumImageForCache` absent from `tauri.ts` and `libraryStore.ts`; `ImportAlbumRequest`, `ShortcutGesture`, `ShortcutGuardContext` absent from `library.ts`; `greet` absent from `lib.rs`
- [ ] T028 Run `pnpm tauri dev` and smoke-test: library view loads, opening an album launches `ViewerScreen`, keyboard navigation works, settings panel opens and saves

**Checkpoint**: Definition of Done satisfied. All acceptance criteria from [spec.md](spec.md) met.

---

## Dependencies

```
T001–T003 (baseline)
  ├─► T004–T006  Backend: remove greet
  ├─► T007–T009  Frontend: delete ImageViewer + ThumbnailStrip
  │       └─► T018–T019  Testing: delete dead/duplicate test files
  ├─► T010–T012  Frontend: remove loadAlbumImageForCache proxy
  │       └─► T020–T021  Testing: clean up mock + run tests
  └─► T013–T017  Frontend: remove dead types
          │
          └─► T022–T028  Integration: full validation (requires all phases above)
```

### Parallel opportunities per phase

| Phase | Parallel tasks |
|-------|---------------|
| 3 | T007 and T008 (delete two independent files) |
| 5 | T015 and T016 (remove two independent blocks in same file — apply sequentially within the file) |
| 6 | T018 and T019 (delete two independent test files) |
| 7 | T022–T025 (build and test commands are independent; run sequentially to isolate failures) |

### Implementation strategy

**MVP**: Complete Phases 2–4 (Rust cleanup + two frontend changes). The application is
fully runnable after each phase. Phases 5–6 are safe to do in any order after Phase 4.
Phase 7 is always last.
  ├─► Phase 2 (Rust: greet)          ← can start immediately after Phase 1
  ├─► Phase 3 (ImageViewer + Strip)   ← can run in parallel with Phase 2
  └─► Phase 7 (Validation)
```

### Parallel opportunities per phase
