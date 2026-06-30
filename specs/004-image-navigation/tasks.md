# Tasks: Image Navigation

**Input**: Design documents from `/specs/004-image-navigation/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/image-navigation-commands.md](contracts/image-navigation-commands.md)

**Tests**: Included. The feature requires validation and testing tasks because the spec covers user-visible navigation behavior, lazy loading, and persisted progress.

**Organization**: Tasks are grouped by implementation area, ordered by dependency, and each step leaves the app runnable.

## Format: `- [ ] T### [P] [US#] Description with file path`

- `T###`: Sequential task ID in execution order
- `[P]`: Can run in parallel with other tasks that do not share unfinished dependencies
- `[US#]`: User story label, used on story-specific tasks only
- Include exact file paths in every task description

## Phase 1: Infrastructure

**Purpose**: Prepare the viewer surface and shared types without changing navigation behavior yet.

- [X] T001 Create the viewer component split point and export surface in `src/features/library/index.ts` so the navigation work can be added without changing imports elsewhere.
- [X] T002 [P] Add the thumbnail-strip presentation styles and viewer layout hooks in `src/App.css` for a scrollable rail, active thumbnail state, and visible keyboard focus.
- [ ] T003 [P] Add any shared viewer navigation types needed for local UI state in `src/shared/types/library.ts` without introducing new persistence models.

**Checkpoint**: The app still runs with the current viewer, and the layout can support a thumbnail rail.

## Phase 2: Backend (Rust)

**Purpose**: Keep the existing Tauri commands and metadata flow ready for richer frontend navigation.

- [ ] T004 [P] Confirm the existing open/load/save command contracts remain sufficient in `src-tauri/src/lib.rs` and `src/infrastructure/tauri.ts`; only add DTO fields if a compile-time gap is found.
- [ ] T005 [P] Add or tighten image-index boundary handling and progress fallback coverage in `src-tauri/src/lib.rs` so navigation cannot escape the current album.
- [ ] T006 [P] Extend `src-tauri/src/services/metadata_service.rs` tests to verify reading progress updates remain per-album and clamp invalid restore values to the first image.
- [ ] T007 [P] Extend `src-tauri/src/services/zip_service.rs` tests to confirm `load_image_by_index` still returns exactly one image payload and rejects out-of-range access.

**Checkpoint**: Rust commands still compile and the album open/load/save path remains a stable foundation for navigation.

## Phase 3: Frontend (React) - US1

**Goal**: Allow users to move forward and backward through album images with buttons, keyboard arrows, and mouse interaction.

**Independent Test**: Open an album and verify previous/next controls and arrow keys move the image one step at a time without leaving the album bounds.

- [X] T008 [US1] Refactor `src/features/library/store/libraryStore.ts` to add a single `goToImage` navigation action that clamps bounds, loads the requested image, persists progress, and ignores stale responses.
- [X] T009 [US1] Update `src/features/library/components/LibraryView.tsx` to route previous/next buttons and keyboard arrows through the new store navigation action.
- [X] T010 [US1] Keep the viewer header counter and disabled boundary states in `src/features/library/components/LibraryView.tsx` synchronized with the active image index.
- [X] T011 [P] [US1] Add focused frontend store tests in `src/features/library/store/libraryStore.test.ts` for previous/next navigation, boundary clamping, and progress persistence after successful image loads.
- [X] T012 [P] [US1] Add focused viewer component tests in `src/features/library/components/LibraryView.test.tsx` for button and keyboard navigation behavior.
- [ ] T013 [US1] Validate the sequential navigation slice by running `pnpm test` for the touched frontend tests and confirm `pnpm run tauri dev` still opens and navigates the viewer.

**Checkpoint**: User Story 1 is independently usable and the app remains runnable with sequential navigation only.

## Phase 4: Integration - US2

**Goal**: Allow users to jump directly to any image with thumbnails, and keep the selected thumbnail visible as navigation changes.

**Independent Test**: Open an album, click a thumbnail far from the current selection, and verify the image changes immediately while the strip auto-scrolls to keep the selected thumbnail visible.

- [X] T014 [US2] Add a small thumbnail loading and selection model to `src/features/library/store/libraryStore.ts` so the active album can expose visible thumbnails without persisting extra state.
- [X] T015 [US2] Extract or extend `src/features/library/components/LibraryView.tsx` to render a scrollable thumbnail strip and forward thumbnail clicks to the shared `goToImage` action.
- [X] T016 [US2] Implement the thumbnail strip auto-scroll and active-thumb visibility behavior in `src/features/library/components/LibraryView.tsx` or a small local component if readability requires it.
- [X] T017 [P] [US2] Add frontend tests in `src/features/library/components/LibraryView.test.tsx` for thumbnail selection, active state highlighting, and visible-strip behavior.
- [X] T018 [P] [US2] Add store-level tests in `src/features/library/store/libraryStore.test.ts` for direct image jumps from thumbnail selection and for preserving the current album context.
- [ ] T019 [US2] Run the targeted UI validation for thumbnail navigation with `pnpm test` and `pnpm run tauri dev`, then confirm the strip keeps the active thumbnail visible.

**Checkpoint**: User Story 2 is independently usable and direct thumbnail navigation works without breaking sequential navigation.

## Phase 5: Integration Validation

**Purpose**: Prove the frontend, Rust commands, and navigation UI work together in the running app.

- [ ] T020 [P] Verify `src/infrastructure/tauri.ts` still maps the runtime command payloads used by `src/features/library/store/libraryStore.ts` after navigation changes.
- [ ] T021 [P] Confirm `src-tauri/src/lib.rs` still restores saved progress on open and persists the latest index on close or navigation.
- [ ] T022 Validate the full image-navigation flow manually in `specs/004-image-navigation/quickstart.md`, including sequential navigation, thumbnail jumps, and scroll visibility.

**Checkpoint**: The feature behaves end-to-end in the running application.

## Phase 6: Testing

**Purpose**: Add and run the final verification needed to keep the implementation stable and runnable.

- [X] T023 [P] Run the focused frontend test suite for `src/features/library/store/libraryStore.test.ts` and `src/features/library/components/LibraryView.test.tsx` after implementation.
- [X] T024 [P] Run `cargo test` to validate `src-tauri/src/lib.rs`, `src-tauri/src/services/metadata_service.rs`, and `src-tauri/src/services/zip_service.rs` after implementation.
- [ ] T025 Confirm the quickstart scenarios in `specs/004-image-navigation/quickstart.md` pass in `pnpm run tauri dev` and record any residual issues.

## Dependencies & Execution Order

### Phase Dependencies

- Infrastructure must complete before backend or frontend work begins.
- Backend must complete before the frontend depends on any changed Rust behavior.
- Frontend Story 1 can land before thumbnail integration if needed, but it must stay runnable.
- Integration tasks depend on the sequential navigation slice being in place.
- Final testing depends on the implementation tasks being complete.

### Story Dependencies

- **US1**: Can start after Infrastructure and Backend complete.
- **US2**: Can start after US1 because it reuses the same viewer session and navigation action.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T004 through T007 can run in parallel where their touched files do not overlap.
- T011 and T012 can run in parallel once T008-T010 are in place.
- T017 and T018 can run in parallel once the thumbnail strip implementation is started.
- T020 and T021 can run in parallel during final integration validation.
- T023 and T024 can run in parallel as final verification.

## Implementation Strategy

### MVP First

1. Complete Infrastructure.
2. Complete Backend.
3. Complete US1 sequential navigation.
4. Validate the app in `pnpm run tauri dev`.

### Incremental Delivery

1. Land the infrastructure and backend foundation.
2. Deliver sequential navigation as the first runnable improvement.
3. Add thumbnail selection and auto-scroll as the second runnable improvement.
4. Run the integration and test tasks to confirm nothing regressed.

### Notes

- Keep each task focused on one implementation goal.
- Prefer the smallest change that leaves the app runnable.
- Do not introduce extra abstractions for thumbnails, persistence, or commands unless a task explicitly requires them.
