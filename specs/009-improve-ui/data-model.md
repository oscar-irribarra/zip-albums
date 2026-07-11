# Data Model: Improve UI Navigation Experience

**Feature**: 009-improve-ui  
**Date**: 2026-07-10

---

## Frontend State Changes

### `libraryStore` — New Fields

Two new fields are added to the existing viewer slice of `LibraryState`. No new stores are created.

```typescript
// New fields added to LibraryState in libraryStore.ts
zoomLevel: number;              // Current zoom multiplier (default 1.0, range 0.25–4.0)
thumbnailStripPinned: boolean;  // Whether the strip is locked visible (default false)
```

**Reset rules**:
- `zoomLevel` → reset to `1.0` on `openAlbumViewer()` and `goToImage()`
- `thumbnailStripPinned` → preserved across image navigation within the same album; reset to `false` on `closeViewer()`

**New actions**:
```typescript
setZoomLevel: (level: number) => void;        // Clamps to [0.25, 4.0]
setThumbnailStripPinned: (pinned: boolean) => void;
```

---

## Component-Local State

### `ImageViewer` component

```typescript
// Local state only — not in Zustand store
prevImageSize: { width: number; height: number } | null  // Updated on img onLoad
```

This drives the skeleton placeholder aspect ratio when `viewerLoading` is true.

### `SettingsFAB` / `SettingsSidePanel` interaction

```typescript
// Lifted to App.tsx — no store needed
settingsPanelOpen: boolean  // Drives whether SettingsSidePanel is rendered/visible
```

---

## Unchanged Entities

All existing types in `src/shared/types/library.ts` remain unchanged:

| Type | Status |
|------|--------|
| `AlbumSummary` | Unchanged — `cover_data` already present |
| `AlbumViewSession` | Unchanged |
| `LoadAlbumImageResponse` | Unchanged |
| `UserSettings` | Unchanged |
| `ImageCacheDiagnostics` | Unchanged |
| `ViewerImageCacheEntry` | Unchanged |

---

## No Rust / Persistence Changes

No new Tauri commands. No new settings fields. No new files on disk. The `zoomLevel` and `thumbnailStripPinned` are runtime-only UI state — they do not need to survive application restarts.
