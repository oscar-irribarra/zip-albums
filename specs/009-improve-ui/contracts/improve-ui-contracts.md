# Contracts: Improve UI Navigation Experience

**Feature**: 009-improve-ui  
**Date**: 2026-07-10

---

## No New Tauri Commands

This feature introduces no new Tauri commands. All 5 user stories are implemented entirely on the frontend.

The following existing Tauri commands remain unchanged and are still consumed:

| Command | Used By |
|---------|---------|
| `get_library` | Album grid — returns `AlbumSummary[]` with `cover_data` |
| `open_album_viewer` | Image viewer — opens a session |
| `load_album_image` | Image viewer + thumbnail strip |
| `update_user_settings` | Settings side panel |
| `save_reading_progress` | Viewer close |

---

## Component Props Contracts

### `SettingsFAB`

```typescript
interface SettingsFABProps {
  onClick: () => void;
}
```

### `SettingsSidePanel`

```typescript
interface SettingsSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  startupWarnings?: string[];
  rememberLastAlbum?: boolean;
}
```

### `ImageViewer`

```typescript
interface ImageViewerProps {
  session: AlbumViewSession;
  image: LoadAlbumImageResponse | null;
  loading: boolean;
  error: string | null;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  thumbnailStripPinned: boolean;
  onToggleThumbnailStrip: () => void;
  thumbnailCache: Record<string, LoadAlbumImageResponse>;
  loadThumbnailImage: (index: number) => Promise<LoadAlbumImageResponse | null>;
}
```

### `ThumbnailStrip` — Updated Props

```typescript
interface ThumbnailStripProps {
  albumId: string;
  totalImages: number;
  selectedIndex: number;
  thumbnailCache: Record<string, LoadAlbumImageResponse>;
  onSelect: (index: number) => void;
  loadThumbnailImage: (imageIndex: number) => Promise<LoadAlbumImageResponse | null>;
  visible: boolean;  // NEW — controlled by hover + pinned state in ImageViewer
}
```

### `AlbumCard` — Unchanged

No prop changes. Visual behavior changes only (CSS).
