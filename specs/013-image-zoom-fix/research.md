# Research: Image Zoom Fix

**Feature**: 013-image-zoom-fix  
**Phase**: 0 — Unknowns resolved from codebase analysis  
**Date**: 2026-07-11

---

## Existing Implementation Audit

A zoom system already exists in `ViewerScreen.tsx` and `libraryStore.ts`. This feature is a **bug fix and spec alignment** — not a greenfield implementation. The research below identifies exactly what is incorrect and what the correct values are.

### Finding 1 — Zoom Step Constant is Wrong

**Decision**: Use `ZOOM_STEP = 0.10` (10 percentage points of scale per activation).

**Current code**: `ZOOM_STEP = 0.25` in `ViewerScreen.tsx`, producing 25% steps (1.0 → 1.25 → 1.5 …).

**Spec requirement**: FR-001 / FR-002 — each activation changes scale by exactly 10 percentage points (1.0 → 1.1 → 1.2 …).

**Rationale**: The step is additive, not multiplicative. "10%" in the spec means the scale factor increases by `+0.10` each time, giving evenly-spaced human-readable percentages (100%, 110%, 120%, …). The store's `clampZoomLevel` already enforces `[0.25, 4.0]` correctly; only the step constant in the component is wrong.

**Alternatives considered**:
- Multiplicative step (`scale *= 1.10`): rejected because it produces irrational values (1.0, 1.1, 1.21, 1.331 …) and diverges from the spec's stated increment semantics.

---

### Finding 2 — Minimum Scale Constant is Wrong in Component

**Decision**: Align `ZOOM_MIN = 0.25` in `ViewerScreen.tsx`.

**Current code**: `ZOOM_MIN = 0.5` in `ViewerScreen.tsx`. The store's `clampZoomLevel` already uses `0.25` correctly.

**Spec requirement**: FR-003 — scale is clamped at 25% minimum.

**Rationale**: The component local constant is the one used in `handleZoomIn`/`handleZoomOut`. The store clamp is a safety net but the component's own guard is the effective boundary. Align both to 0.25.

**Alternatives considered**: Remove local constants and rely solely on `clampZoomLevel` in the store — feasible, but keeping local constants makes the component self-documenting. Chosen approach: fix the constant.

---

### Finding 3 — Drag is Gated on `zoomLevel > 1`

**Decision**: Remove the `if (zoomLevel <= 1) return;` guard in `handlePointerDown`.

**Current code**: `ViewerScreen.tsx` `handlePointerDown` returns early when `zoomLevel` is at or below 1.0, making dragging impossible at 100% scale.

**Spec requirement**: User Story 2, Scenario 3 — "Given an image is at 100% scale … When the user attempts to drag, Then the image may move but the zoom level is unchanged." Spec assumption — "Panning is unconstrained … the user can drag the image freely."

**Rationale**: Dragging at 100% may not be visually useful when the image fits in the viewport, but the spec explicitly permits it. Removing the guard is the minimal correct change.

**Alternatives considered**:
- Keep the guard, add scroll-wheel zoom: out of scope (spec does not require it).
- Gate drag on `scale > ZOOM_MIN`: rejected — spec allows drag at minimum scale too.

---

### Finding 4 — Pan is Constrained to Image Bounds

**Decision**: Remove maxX/maxY clamping in `handlePointerMove`; apply the delta directly.

**Current code**: `handlePointerMove` computes `maxX` / `maxY` from natural image size × scale, then clamps `panOffset` so the image cannot be dragged beyond its own bounds.

**Spec requirement / assumption**: "Panning is unconstrained — the user can drag the image freely, including beyond the viewport edge."

**Rationale**: Unconstrained pan lets the user pull the image partially out of view, which is required for inspecting edge content in large zoomed images. The spec explicitly chose this model over boundary-clamped pan.

**Alternatives considered**:
- Keep constrained pan for better UX guard: rejected — contradicts spec assumption and causes half the image to be unreachable when the image dimensions are not known at drag time.
- Soft boundary (spring-back animation): out of scope, not requested.

---

### Finding 5 — CSS Cursor Class Condition

**Decision**: Apply the grab cursor class (`album-viewer-image-frame--zoomed`) unconditionally — the image frame always supports drag.

**Current code**: Class is applied only when `zoomLevel > 1`.

**Rationale**: Since drag is enabled at all zoom levels (Finding 3), the cursor should always indicate draggability. Using the existing class unconditionally is the simplest correct fix with zero new CSS.

**Alternatives considered**:
- New class name `--draggable`: unnecessary indirection — same visual effect.
- Conditional on `scale !== 1`: No reason to hide the cursor at 100%; the grab cursor is not disruptive.

---

### Finding 6 — Navigation Reset Already Correct

**No change needed.**

Both `openAlbumViewer` and `goToImage` in `libraryStore.ts` already set `zoomLevel: 1`. The component already calls `setPanOffset({ x: 0, y: 0 })` on every navigation handler (keyboard and button). FR-008 is already satisfied.

---

### Finding 7 — No Backend Work Required

**Decision**: Zero Rust / backend changes.

**Rationale**: Zoom and pan are ephemeral presentation state. They do not interact with the filesystem, ZIP files, or any Tauri command. The feature is entirely contained in `ViewerScreen.tsx` and the one constant in `clampZoomLevel` (which is already correct in the store).

---

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `src/features/viewer/components/ViewerScreen.tsx` | `ZOOM_STEP` 0.25 → 0.10 | Spec: 10% per step |
| `src/features/viewer/components/ViewerScreen.tsx` | `ZOOM_MIN` 0.5 → 0.25 | Spec: 25% minimum |
| `src/features/viewer/components/ViewerScreen.tsx` | Remove drag gate `zoomLevel <= 1` | Spec: drag at all levels |
| `src/features/viewer/components/ViewerScreen.tsx` | Remove maxX/maxY pan clamping | Spec: unconstrained pan |
| `src/features/viewer/components/ViewerScreen.tsx` | Apply `--zoomed` class unconditionally | Drag always enabled |
