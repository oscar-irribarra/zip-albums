# Data Model: Image Viewer Improvements

**Phase**: 1 — Design
**Feature**: 011-image-viewer-improvements
**Date**: 2026-07-10

No new persistent entities. No schema changes. No new Tauri commands.

All changes are confined to **local React component state** and **CSS presentation rules**.

---

## Modified State: ViewerScreen local state

### ZoomLevel (existing — modified constraints)

| Field | Type | Default | Constraint |
|-------|------|---------|------------|
| `zoomLevel` | `number` | `1.0` | `0.5 ≤ zoomLevel ≤ 4.0` |

- Stored in **Zustand store** (`libraryStore`) via `zoomLevel` / `setZoomLevel`.
- Bounds enforced in `ViewerScreen` navigation handlers **before** calling `setZoomLevel`.
- **Change**: Previous implementation had no bounds. New constraint: `min = 0.5`, `max = 4.0`, `step = 0.25`.
- **Reset trigger**: Every image navigation event (prev, next, keyboard shortcuts ArrowLeft/Right/Home/End).

---

### PanOffset (existing — reset behavior fixed)

| Field | Type | Default | Reset on |
|-------|------|---------|----------|
| `panOffset.x` | `number` | `0` | Image navigation |
| `panOffset.y` | `number` | `0` | Image navigation, zoom reset |

- Stored in **local component state** (`useState`) in `ViewerScreen`.
- **Change**: Pan reset was missing from keyboard navigation handlers. All handlers now reset both `panOffset` and `zoomLevel` on every image change.

---

### HoverVisible (existing — no change)

| Field | Type | Default | Set to `true` | Set to `false` |
|-------|------|---------|---------------|----------------|
| `hoverVisible` | `boolean` | `false` | `mouseenter` on hover zone | `mouseleave` on hover zone |

- Local component state in `ViewerScreen`.
- No changes.

---

### ThumbnailStripPinned (existing — no change)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `thumbnailStripPinned` | `boolean` | `false` | Toggled by the Thumbnails action button |

- Stored in **Zustand store**.
- No logic changes. Existing behavior preserved.

---

### PrevImageSize (existing — no change)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prevImageSize.width` | `number \| null` | `null` | Natural pixel width of last loaded image |
| `prevImageSize.height` | `number \| null` | `null` | Natural pixel height of last loaded image |

- Used to set `aspect-ratio` on the loading skeleton so it matches the previous image dimensions.
- No logic changes; skeleton rendering is unchanged in logic. Only **styling** changes (dark theme colors).

---

## CSS State Encoding

The following UI states are encoded in CSS classes only (no new JS state):

| Visual State | CSS Mechanism | Element |
|---|---|---|
| Thumbnail strip visible | `.thumbnail-strip-wrapper--visible` / `--hidden` | wrapper div |
| Thumbnail strip hidden | `max-height: 0; opacity: 0` (transition) | wrapper div |
| Image dragging cursor | `.album-viewer-image-frame--zoomed:active { cursor: grabbing }` | frame div |
| Image grabbable cursor | `.album-viewer-image-frame--zoomed { cursor: grab }` | frame div |
| Skeleton dark theme | `[data-theme="dark"] .image-skeleton` override | skeleton div |
| Back button dark theme | `[data-theme="dark"] .viewer-back-btn` override | button |

---

## Unchanged Entities

The following entities are used by this feature but require **no changes**:

| Entity | Location | Notes |
|--------|----------|-------|
| `ViewerSession` | `shared/types/library.ts` | `album_id`, `album_name`, `current_index`, `total_images` |
| `LoadAlbumImageResponse` | `shared/types/library.ts` | `image_source` (data URL) |
| `AlbumSummary` | `shared/types/library.ts` | Not used in viewer directly |
| Zustand `libraryStore` | `library/store/libraryStore.ts` | `goToImage`, `closeViewer`, `setZoomLevel`, `setThumbnailStripPinned`, `loadThumbnailImage` |

---

## Summary of Changes vs. 010

| Item | 010 State | 011 Change |
|------|-----------|------------|
| Zoom bounds | None (unbounded) | min 0.5, max 4.0 |
| Zoom reset on navigation | Missing | Added in all handlers |
| Pan reset on navigation | Partial (mouse only, missing keyboard) | Complete (all navigation paths) |
| Skeleton colors | Hardcoded light-gray | Dark theme override added |
| Thumbnail card shape | 140×100 px (landscape) | 64px wide, `aspect-ratio: 3/4` (portrait) |
| Back button position | Inside `.album-viewer` container | Above `.album-viewer` in `viewer-top-bar` |
| Back button theme | Hardcoded light border | Dark theme override added |
| Action bar alignment | `justify-content: flex-end` | `justify-content: center` |
| Drag cursor | Always `grab` when zoomed | `grab` at rest, `grabbing` via `:active` |
