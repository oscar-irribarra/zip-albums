# Data Model: Image Zoom

**Feature**: 013-image-zoom-fix  
**Phase**: 1 — Design  
**Date**: 2026-07-11

---

## Overview

Zoom and pan are **ephemeral presentation state**. They are never persisted to disk, never sent to Rust, and reset whenever the user navigates to a different image. No new data structures need to be introduced — the existing state locations are reused with corrected values.

---

## ZoomState

Conceptual model for the zoom + pan state of the image currently displayed in the viewer.

| Field | Type | Range / Default | Location |
|-------|------|-----------------|----------|
| `scale` | `number` | `[0.25, 4.0]`, default `1.0` | `zoomLevel` in Zustand `libraryStore` |
| `panOffset.x` | `number` | unconstrained pixels, default `0` | `panOffset` local React state in `ViewerScreen` |
| `panOffset.y` | `number` | unconstrained pixels, default `0` | `panOffset` local React state in `ViewerScreen` |

### Why `scale` is in the store

`zoomLevel` is already tracked in Zustand. The store's `setZoomLevel` action clamps via `clampZoomLevel` so no component can produce an out-of-range value. Navigation actions (`openAlbumViewer`, `goToImage`) already reset it to `1` — satisfying FR-008 centrally.

### Why `panOffset` is local component state

Pan offset does not need to survive component remounts, be shared with any other component, or be reset from outside `ViewerScreen`. Using `useState` keeps it collocated with the pointer event handlers that own it. The component's own navigation handlers already reset it to `{ x: 0, y: 0 }`.

---

## Constants

These are the only named values that govern zoom behavior. They live in `ViewerScreen.tsx` alongside the handlers that use them.

```
ZOOM_STEP    = 0.10   // scale units added/subtracted per Zoom In / Zoom Out activation
ZOOM_MIN     = 0.25   // minimum allowed scale (25%)
ZOOM_MAX     = 4.00   // maximum allowed scale (400%)
ZOOM_DEFAULT = 1.00   // scale applied on reset and on image navigation
PAN_DEFAULT  = { x: 0, y: 0 }  // pan offset applied on reset and on image navigation
```

The store's `clampZoomLevel` function enforces the same `[ZOOM_MIN, ZOOM_MAX]` range as a secondary safety net; no duplication of logic, just a shared invariant.

---

## Scale Step Arithmetic

Scale transitions are **additive**:

```
Zoom In:  newScale = clamp(currentScale + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX)
Zoom Out: newScale = clamp(currentScale - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX)
Reset:    newScale = ZOOM_DEFAULT
```

This produces the evenly-spaced human-readable sequence the spec requires:
25%, 35%, 45%, … 90%, 100%, 110%, 120%, … 390%, 400%.

---

## Drag Interaction Model

```
On pointer down:
  - Record pointer position and current panOffset as drag origin
  - Capture pointer to the element

On pointer move (while captured):
  - delta = currentPointerPosition - dragOrigin
  - newOffset = dragOrigin.panOffset + delta
  - Apply newOffset directly (no clamping)

On pointer up:
  - Release pointer capture
  - Pan offset remains at last applied position
```

No constraint is applied to `newOffset`. The user can drag the image to any position, including fully off-screen.

---

## Reset Behavior

| Action | Scale result | Pan result |
|--------|-------------|------------|
| User clicks Reset | `ZOOM_DEFAULT` (1.0) | `PAN_DEFAULT` ({x:0, y:0}) |
| User navigates to next/previous image | `ZOOM_DEFAULT` | `PAN_DEFAULT` |
| User opens an album | `ZOOM_DEFAULT` | `PAN_DEFAULT` |

---

## No Persistence

Zoom state is **not** stored in settings, reading progress, or any local file. It is intentionally transient — closing and reopening an album always starts at 100% scale.

---

## No Database

No database is introduced. This feature involves no structured data storage. The existing in-memory Zustand store is sufficient.
