# Tasks: Image Zoom Fix

**Input**: Design documents from `specs/013-image-zoom-fix/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ (empty — N/A)

**Source of truth**: `src/features/viewer/components/ViewerScreen.tsx` is the **only implementation file that changes**. All 5 implementation tasks target that single file in sequence.

**Organization**: Tasks grouped by user story within each phase. Infrastructure and Backend phases are documented as empty to confirm scope.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (targets a different file from concurrent tasks)
- **[Story]**: User story this task satisfies (US1, US2, US3)

---

## Phase 1: Infrastructure

**Purpose**: Project or build system changes needed before implementation.

> **No infrastructure tasks.** This feature requires no new dependencies, no project structure changes, no build configuration updates, and no new files outside the viewer component and its test file.

---

## Phase 2: Backend (Rust)

**Purpose**: Rust service or Tauri command changes.

> **No backend tasks.** Zoom and pan are ephemeral presentation state. No Tauri commands are added or modified. No filesystem access is involved.

---

## Phase 3: Frontend (React) — User Story 1: Zoom In and Out (Priority: P1) 🎯 MVP

**Goal**: Each Zoom In / Zoom Out activation changes the displayed image scale by exactly 10 percentage points. Scale is clamped between 25% and 400%.

**Independent Test**: Open the viewer, press Zoom In once — image enlarges and the style transform shows scale 1.1. Press Zoom Out once from default — scale reaches 0.9. Press Zoom Out until it stops — stops at 0.25 and control remains enabled.

**Checkpoint**: After T001 and T002, the app is fully runnable. Zoom In and Zoom Out produce correct 10% steps and respect the 25%–400% range. FR-001, FR-002, FR-003 satisfied.

- [ ] T001 [US1] Fix `ZOOM_STEP` constant from `0.25` to `0.10` in `src/features/viewer/components/ViewerScreen.tsx`
- [ ] T002 [US1] Fix `ZOOM_MIN` constant from `0.50` to `0.25` in `src/features/viewer/components/ViewerScreen.tsx`

---

## Phase 4: Frontend (React) — User Story 2: Pan Image While Zoomed (Priority: P2)

**Goal**: Click-drag panning works at any zoom level. The image follows the pointer freely with no boundary clamping.

**Independent Test**: Zoom to 300%, click and drag the image — it pans smoothly. Release — it stays in place. Drag past the edge of the viewport — the image continues to move (unconstrained). Repeat from 100% scale — drag still works.

**Checkpoint**: After T003 and T004, the app is fully runnable. Dragging is enabled at any zoom level and panning is unconstrained. FR-005 satisfied. US1 behavior unchanged.

- [ ] T003 [US2] Remove `if (zoomLevel <= 1) return;` guard from `handlePointerDown` in `src/features/viewer/components/ViewerScreen.tsx`
- [ ] T004 [US2] Remove `maxX`/`maxY` boundary clamping and the `!prevImageSize` guard from `handlePointerMove` in `src/features/viewer/components/ViewerScreen.tsx` — apply pan delta directly: `setPanOffset({ x: newX, y: newY })`

---

## Phase 5: Frontend (React) — User Story 3: Reset Zoom and Position (Priority: P3)

**Goal**: The grab cursor is shown whenever the image frame is active (drag is enabled at all zoom levels), consistent with the behaviour fixed in US2.

**Independent Test**: At 100% scale the cursor shows a grab hand on hover. At 200% scale the cursor also shows a grab hand. Reset returns scale to 100% and position to center.

**Checkpoint**: After T005, the app is fully runnable. The grab cursor appears at all zoom levels. FR-006, FR-007 remain satisfied (no reset logic changes needed — already correct). US1 and US2 behaviour unchanged.

- [ ] T005 [US3] Apply `album-viewer-image-frame--zoomed` CSS modifier class unconditionally (remove `zoomLevel > 1` conditional) in `src/features/viewer/components/ViewerScreen.tsx`

---

## Phase 6: Integration

**Purpose**: Cross-component wiring and Tauri command integration.

> **No integration tasks.** The fix is self-contained within `ViewerScreen.tsx`. Zustand store bindings (`zoomLevel`, `setZoomLevel`) are unchanged. Navigation reset paths (`goToImage`, `openAlbumViewer`) already reset zoom to 1 — no wiring changes needed. FR-008 already satisfied.

---

## Phase 7: Testing & Validation

**Purpose**: Automated regression coverage and manual acceptance validation for all three user stories.

**Checkpoint**: After T009, all 8 FRs have automated coverage. After T010, manual acceptance confirms the fix works end-to-end in the running Tauri application.

### Tests — User Story 1: Zoom In and Out

- [ ] T006 [P] [US1] Create `src/test/ViewerScreen.test.tsx`; mock `useLibraryStore` with `vi.mock`; add test: Zoom In from 1.0 calls `setZoomLevel(1.1)`; add test: Zoom In at 4.0 calls `setZoomLevel(4.0)` (clamped)
- [ ] T007 [US1] Add test: Zoom Out from 1.0 calls `setZoomLevel(0.9)`; add test: Zoom Out at 0.25 calls `setZoomLevel(0.25)` (clamped) — in `src/test/ViewerScreen.test.tsx`

### Tests — User Story 2: Pan While Zoomed

- [ ] T008 [US2] Add test: firing `pointerdown` + `pointermove` + `pointerup` at `zoomLevel` 1.0 results in a non-zero `panOffset` (drag works at 100% scale) — in `src/test/ViewerScreen.test.tsx`

### Tests — User Story 3: Reset

- [ ] T009 [US3] Add test: clicking the Reset button calls `setZoomLevel(1)` and verifies that the image `transform` style reverts to `translate(0px, 0px) scale(1)` — in `src/test/ViewerScreen.test.tsx`

### Manual Validation

- [ ] T010 [US1, US2, US3] Run all 6 acceptance scenarios in `specs/013-image-zoom-fix/quickstart.md` against the running Tauri application and confirm every Pass Criteria row is met

---

## Dependencies

```
T001 ──► T002   (same file, sequential; T001 must land before T002 for clean diff)
T002 ──► T003   (US1 complete before starting US2)
T003 ──► T004   (drag gate must be removed before testing unconstrained pan)
T004 ──► T005   (pan behaviour stable before applying CSS class change)
T005 ──► T006   (implementation complete before writing tests)
T006 ──► T007 ──► T008 ──► T009   (same test file, sequential additions)
T009 ──► T010   (all automated tests passing before manual validation)
```

T006 carries **[P]** because the test file is independent of ViewerScreen.tsx — if two developers are collaborating, one can start on the test file scaffold (T006) while the other finishes T005.

---

## Parallel Execution

T006 (test file creation) is the only task that can be started in parallel with the tail of the implementation sequence (T004–T005), since it lives in a separate file. All other tasks are sequential within their respective files.

---

## Implementation Strategy

**MVP = Phase 3 only (T001 + T002).** After two constant changes the zoom step and minimum scale are correct. Zoom In/Out and Reset all work as specified. US1 is independently testable and deliverable.

**Increment 2 = Phase 4 (T003 + T004).** Adds unconstrained panning at all zoom levels. No regressions to MVP.

**Increment 3 = Phase 5 (T005).** Aligns cursor affordance with actual drag capability. Cosmetic; no functional regressions.

**Full delivery = all phases.** Automated tests (T006–T009) and manual validation (T010) confirm correctness.
