# Tasks: Fix Viewer Zoom Controls

**Input**: Design documents from `specs/014-fix-viewer-zoom-buttons/`

**Feature branch**: `014-fix-viewer-zoom-buttons`  
**Date**: 2026-07-11  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the development environment is ready for this fix. No project bootstrapping
is required — the fix targets a single existing React component.

- [ ] T001 Verify `pnpm test` passes with 0 failures before making any changes (baseline)

**Checkpoint**: Baseline green — no regressions before work begins.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `isInteractiveTarget` helper and the pointer-capture guard are the shared foundation
that all three zoom-button user stories depend on. They must be in place before any story can be
validated.

- [ ] T002 Add `isInteractiveTarget(target: EventTarget | null): boolean` helper function above the
  `ViewerScreen` function body in
  `src/features/viewer/components/ViewerScreen.tsx`.
  The function must return `true` when `e.target` is inside `.viewer-zoom-controls` or any
  `button | a | input | textarea | select` element (using `el.closest`). It must return `false`
  for plain `<div>` or `<img>` elements.

- [ ] T003 Add early-return guard at the top of `handlePointerDown` in
  `src/features/viewer/components/ViewerScreen.tsx`:
  `if (isInteractiveTarget(e.target)) return;`
  This must appear before `isDragging.current = true` and before `setPointerCapture` is called.

- [ ] T004 Add `hasPointerCapture` safety guard to `handlePointerUp` in
  `src/features/viewer/components/ViewerScreen.tsx`:
  only call `e.currentTarget.releasePointerCapture(e.pointerId)` when
  `e.currentTarget.hasPointerCapture?.(e.pointerId)` is truthy.
  Wrap the call in `try/catch` as fallback for WebView environments that do not implement the full
  Pointer Events API.

**Checkpoint**: Foundation complete — zoom buttons will now receive `click` events. Pan drag still
works for non-interactive targets.

---

## Phase 3: User Story 1 — Zoom In on Current Image (Priority: P1) 🎯 MVP

**Goal**: The "+" button must increase the zoom level by 10% per click, clamped to a 400% maximum.

**Independent Test**: Open the viewer, click "+", confirm the image visibly enlarges. Click repeatedly
to confirm clamping at the maximum.

### Tests for User Story 1

- [ ] T005 [P] [US1] In `src/test/ViewerScreen.test.tsx`, add a test group
  `"ViewerScreen — Zoom In/Out (US1)"` with the following assertions:
  - `fireEvent.click` on the "Zoom In" button at `zoomLevel = 1.0` → `setZoomLevel` called with `1.1`
  - `fireEvent.click` on "Zoom In" at `zoomLevel = 4.0` → `setZoomLevel` called with `4.0` (clamped)

### Implementation for User Story 1

- [ ] T006 [P] [US1] Confirm `handleZoomIn` in
  `src/features/viewer/components/ViewerScreen.tsx`
  calls `setZoomLevel(Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP))` where
  `ZOOM_STEP = 0.10` and `ZOOM_MAX = 4.0`.
  No change is required if already correct.

**Checkpoint**: US1 independently complete. Clicking "+" enlarges the image and clamps at 400%.

---

## Phase 4: User Story 2 — Zoom Out on Current Image (Priority: P1)

**Goal**: The "−" button must decrease the zoom level by 10% per click, clamped to a 25% minimum.

**Independent Test**: Zoom in first, then click "−" and confirm the image shrinks. Continue to minimum
and confirm it stops.

### Tests for User Story 2

- [ ] T007 [P] [US2] In `src/test/ViewerScreen.test.tsx`, within the
  `"ViewerScreen — Zoom In/Out (US1)"` group (or a dedicated US2 group), add:
  - `fireEvent.click` on "Zoom Out" at `zoomLevel = 1.0` → `setZoomLevel` called with `0.9`
  - `fireEvent.click` on "Zoom Out" at `zoomLevel = 0.25` → `setZoomLevel` called with `0.25` (clamped)

### Implementation for User Story 2

- [ ] T008 [P] [US2] Confirm `handleZoomOut` in
  `src/features/viewer/components/ViewerScreen.tsx`
  calls `setZoomLevel(Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP))` where `ZOOM_MIN = 0.25`.
  No change is required if already correct.

**Checkpoint**: US2 independently complete. "−" shrinks the image and stops at 25%.

---

## Phase 5: User Story 3 — Reset Zoom and Pan (Priority: P1)

**Goal**: The "○" button must restore `zoomLevel` to 1 and `panOffset` to `{x:0, y:0}` in a single
click.

**Independent Test**: Zoom in and pan the image off-center, then click "○". Image must return to 100%
scale, centered, in one click.

### Tests for User Story 3

- [ ] T009 [US3] In `src/test/ViewerScreen.test.tsx`, add a test group
  `"ViewerScreen — Reset (US3)"` with the following assertion:
  - Pan the image via `fireEvent.pointerDown/pointerMove/pointerUp` on the frame to establish a
    non-zero offset.
  - `fireEvent.click` on "Reset zoom" button.
  - `setZoomLevel` must be called with `1`.
  - The `<img>` element must have `transform: translate(0px, 0px) scale(1)`.

### Implementation for User Story 3

- [ ] T010 [US3] Confirm `handleZoomReset` in
  `src/features/viewer/components/ViewerScreen.tsx`
  calls `setZoomLevel(1)` AND `setPanOffset({ x: 0, y: 0 })` together.
  No change is required if already correct.

**Checkpoint**: US3 independently complete. "○" restores image to 100%, centered, in one action.

---

## Phase 6: User Story 4 — Zoom Controls Do Not Interfere with Panning (Priority: P2)

**Goal**: Clicking zoom buttons must NOT activate pointer capture on the image frame. Dragging the
image frame (non-button area) must still activate pointer capture normally.

**Independent Test**: Click a zoom button — `setPointerCapture` must not be called. Drag the image
frame — `setPointerCapture` must be called. Both operations must work in sequence.

### Tests for User Story 4

- [ ] T011 [P] [US4] In `src/test/ViewerScreen.test.tsx`, add a test group
  `"ViewerScreen — Pointer Capture Guard (US4)"` with:
  - Stub `HTMLElement.prototype.setPointerCapture = vi.fn()` in `beforeEach`.
  - **Test A**: `fireEvent.pointerDown` with target = a zoom button (`getByRole('button', { name: /zoom in/i })`) →
    `setPointerCapture` must **NOT** have been called.
  - **Test B**: `fireEvent.pointerDown` with target = `.album-viewer-image-frame` div (not a button) →
    `setPointerCapture` **must** have been called once.

- [ ] T012 [P] [US4] In `src/test/ViewerScreen.test.tsx`, within the same group, add:
  - **Test C**: Pan drag still works after a zoom button click — simulate zoom click then
    `pointerDown/pointerMove/pointerUp` on the frame; image `transform` must reflect the drag delta.
  - **Test D**: `fireEvent.pointerDown` on zoom button + `fireEvent.pointerUp` on frame →
    `releasePointerCapture` must **NOT** have been called (no capture was set).

### Implementation for User Story 4

- [ ] T013 [US4] Verify `isInteractiveTarget` in
  `src/features/viewer/components/ViewerScreen.tsx`
  correctly distinguishes button targets from plain div/img targets by checking the existing
  implementation against the test assertions added in T011–T012.
  Adjust the selector or guard logic if any test fails.

**Checkpoint**: US4 complete. Pointer capture guard is verified at the unit level.

---

## Phase 7: Polish & Validation

**Purpose**: Final verification that all user stories are green and no regressions were introduced.

- [ ] T014 [P] Run `pnpm test` and confirm all test files pass with 0 failures.
  Expected: ≥ 37 tests (34 existing + ≥ 3 new US4 tests), 0 failures.

- [ ] T015 [P] Run `pnpm build` (`tsc && vite build`) and confirm TypeScript compilation produces
  0 errors.

- [ ] T016 Perform manual validation per `specs/014-fix-viewer-zoom-buttons/quickstart.md`:
  run `pnpm tauri dev`, open an album, exercise all five manual scenarios
  (SC-001 through SC-005), confirm zero console errors.

---

## Dependencies & Execution Order

### Phase Dependencies

```
T001 (baseline)
  └─► T002, T003, T004 (foundational guard — must all complete before US phases)
        ├─► T005, T006 (US1 — zoom in)
        ├─► T007, T008 (US2 — zoom out)
        ├─► T009, T010 (US3 — reset)
        └─► T011, T012, T013 (US4 — capture guard)
              └─► T014, T015, T016 (polish & validation)
```

### Within-Phase Parallelism

- T002, T003, T004 — sequential (T003 and T004 depend on T002's helper being in place)
- T005/T006, T007/T008, T009/T010 — all marked `[P]` can be worked in parallel once Phase 2 is done
- T011, T012 — marked `[P]`, can be written in parallel (different test cases in the same file)
- T014, T015 — marked `[P]`, run in parallel (independent commands)

### Parallel Execution Example: User Stories 1–3

Once T002–T004 are complete, the following can proceed simultaneously:

```
Developer A: T005 → T006 → (US1 checkpoint)
Developer B: T007 → T008 → (US2 checkpoint)
Developer C: T009 → T010 → (US3 checkpoint)
```

---

## Implementation Strategy

**MVP** (minimum to unblock manual testing): T001 → T002 → T003 → T004  
These four tasks alone restore the zoom buttons in the running application.

**Full delivery** (all tests green, no regressions): T001 through T016 in dependency order.

**No Rust work required.** No new files. No new dependencies.  
All changes are confined to:
- `src/features/viewer/components/ViewerScreen.tsx` (T002–T004, T006, T008, T010, T013)
- `src/test/ViewerScreen.test.tsx` (T005, T007, T009, T011, T012)
