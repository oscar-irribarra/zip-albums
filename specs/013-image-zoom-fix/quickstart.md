# Quickstart Validation Guide: Image Zoom Fix

**Feature**: 013-image-zoom-fix  
**Date**: 2026-07-11

This guide describes how to validate that the zoom fix is working correctly. Run these scenarios after implementation to confirm every requirement is met.

---

## Prerequisites

1. The application is built and running (`pnpm tauri dev` or a production build).
2. At least one album has been imported into the library.
3. Open the album viewer by clicking an album.

---

## Scenario 1 — Zoom In Steps (FR-001, FR-003, SC-001)

**Goal**: Confirm each Zoom In step increases scale by exactly 10% and stops at 400%.

1. Open the image viewer. Confirm the image is displayed at default size (no visible transform).
2. Click the **+** (Zoom In) button once.
   - **Expected**: Image visibly enlarges. Scale is now 110%.
3. Click Zoom In **9 more times** (total 10 clicks from default).
   - **Expected**: Scale is now 200%.
4. Continue clicking Zoom In until it no longer grows.
   - **Expected**: Scale stops at **400%**. Further Zoom In clicks have no effect. The Zoom In button remains enabled (not disabled or greyed out).

---

## Scenario 2 — Zoom Out Steps (FR-002, FR-003, SC-001)

**Goal**: Confirm each Zoom Out step decreases scale by exactly 10% and stops at 25%.

1. From 100% scale, click the **−** (Zoom Out) button once.
   - **Expected**: Image visibly shrinks. Scale is now 90%.
2. Continue clicking Zoom Out until it no longer shrinks.
   - **Expected**: Scale stops at **25%**. Further Zoom Out clicks have no effect. The Zoom Out button remains enabled.

---

## Scenario 3 — Reset Zoom and Position (FR-006, FR-007, SC-004)

**Goal**: Confirm Reset returns both scale and position to defaults in one action.

1. Click Zoom In several times to reach approximately 200%.
2. Drag the image to an off-center position (see Scenario 4 below).
3. Click the **○** (Reset Zoom) button.
   - **Expected**: Image immediately returns to 100% scale AND the image position returns to centered/default. No separate reset steps needed.

---

## Scenario 4 — Pan While Zoomed (FR-005, SC-002, SC-003)

**Goal**: Confirm click-drag panning works when zoomed in.

1. Click Zoom In until the image is clearly larger than the viewport (e.g., 300%).
2. Click and hold the mouse button on the image area.
3. Drag in any direction while holding.
   - **Expected**: The image follows the pointer smoothly. Different portions of the image become visible as you drag.
4. Release the mouse button.
   - **Expected**: Image remains at the dragged position. No snap-back.
5. Drag the image toward an edge and keep dragging past it.
   - **Expected**: The image continues to move (unconstrained). It is possible to drag the image partially or fully out of view.

---

## Scenario 5 — Pan at 100% Scale (User Story 2, Scenario 3)

**Goal**: Confirm dragging is not blocked at 100% scale.

1. Ensure the image is at 100% scale (use Reset if needed).
2. Click and drag the image.
   - **Expected**: The cursor shows a grab hand. The image moves with the drag. The zoom level remains 100% after release.

---

## Scenario 6 — Scale Resets on Image Navigation (FR-008, SC-005)

**Goal**: Confirm zoom and pan reset when navigating to a different image.

1. Zoom in to ~200% and drag the image off-center.
2. Click the **Next** button (or press Arrow Right).
   - **Expected**: The new image loads at 100% scale and centered position — not at 200% with an offset.
3. Press Arrow Left to return to the previous image.
   - **Expected**: The returned image also starts at 100% scale and centered (not restored to the previous zoom state).

---

## Pass Criteria

| FR | Scenario | Pass when |
|----|----------|-----------|
| FR-001 | 1 | Each Zoom In step enlarges by 10% |
| FR-002 | 2 | Each Zoom Out step shrinks by 10% |
| FR-003 | 1, 2 | Scale never exceeds 400% or falls below 25% |
| FR-004 | 1, 2 | Controls remain enabled at all scale values |
| FR-005 | 4, 5 | Image pans on click-drag at any scale |
| FR-006 | 3 | Reset sets scale to 100% |
| FR-007 | 3 | Reset centers/restores image position |
| FR-008 | 6 | Navigation always starts at 100% + default position |
