# Data Model: Fix Viewer Zoom Controls

**Feature**: 014-fix-viewer-zoom-buttons  
**Date**: 2026-07-11

---

## Overview

This bug fix does not introduce new entities or change the persistent data model. All state involved is
transient, client-side presentation state managed in Zustand. No Tauri commands, Rust structs, or stored
metadata are affected.

---

## Existing Entities (no changes)

### ZoomLevel

| Attribute | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `zoomLevel` | `number` | 0.25 – 4.0 | `1` | Scale factor applied to the displayed image. Clamped by `clampZoomLevel()` in the store. |

**Owned by**: `LibraryState` (Zustand)  
**Reset on**: image navigation (`goToImage`, `openAlbumViewer`), close viewer  
**Mutation**: only through `setZoomLevel(level: number)` — store enforces clamping

---

### PanOffset

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `panOffset.x` | `number` | `0` | Horizontal pixel offset applied to the image `transform: translate`. |
| `panOffset.y` | `number` | `0` | Vertical pixel offset applied to the image `transform: translate`. |

**Owned by**: `ViewerScreen` local state (`useState`)  
**Reset on**: image navigation, zoom reset button, viewer close  
**Mutation**: dragging the image frame; reset button

---

### DragState (ephemeral)

Not stored — held exclusively in `useRef` within `ViewerScreen`. Not serialized or persisted.

| Ref | Type | Description |
|-----|------|-------------|
| `isDragging` | `boolean` | Whether a drag is currently in progress. |
| `dragStart.x/y` | `number` | Client pointer coordinates at drag start. |
| `dragStart.panX/panY` | `number` | `panOffset` snapshot at drag start — used to compute delta. |

---

## State Transitions

```
Viewer opens
    └─► zoomLevel = 1, panOffset = {0,0}

Zoom In clicked
    └─► zoomLevel = clamp(current + 0.10, 0.25, 4.0)

Zoom Out clicked
    └─► zoomLevel = clamp(current − 0.10, 0.25, 4.0)

Reset Zoom clicked
    └─► zoomLevel = 1, panOffset = {0,0}

Image navigation (goToImage, arrow keys, Home, End)
    └─► zoomLevel = 1, panOffset = {0,0}

Viewer closed
    └─► zoomLevel = 1, panOffset = {0,0}

Drag start (pointerdown on frame, non-interactive target)
    └─► isDragging = true, dragStart = {clientX, clientY, panX, panY}

Drag move (pointermove while isDragging)
    └─► panOffset = {dragStart.panX + ΔX, dragStart.panY + ΔY}

Drag end (pointerup)
    └─► isDragging = false
```

---

## What Did NOT Change

- `LibraryState` interface — unchanged
- `clampZoomLevel` — unchanged
- Rust structs — unchanged
- Tauri commands — unchanged
- Zustand store persistence — unchanged (zoom is not persisted)
