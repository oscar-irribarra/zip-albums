# Interface Contracts: Image Viewer Improvements

**Feature**: 011-image-viewer-improvements
**Date**: 2026-07-10

## Summary

Feature 011 introduces **no new Tauri commands**. All changes are confined to the React frontend layer (component logic and CSS). The existing Tauri command surface is sufficient.

---

## Existing Commands Used (unchanged)

The following commands are invoked by the viewer and remain **unmodified** in this feature:

### `load_album_image`

Loads a full-resolution image by index from the currently open album's ZIP file.

```typescript
// infrastructure/tauri.ts
loadAlbumImage(request: LoadAlbumImageRequest): Promise<LoadAlbumImageResponse>

interface LoadAlbumImageRequest {
  album_id: string;
  image_index: number;
}

interface LoadAlbumImageResponse {
  image_source: string; // data: URL (base64-encoded image)
}
```

**Caller**: `libraryStore.goToImage()` → dispatches to this command.

---

### `load_thumbnail_image`

Loads a thumbnail-resolution image by index for the thumbnail strip.

```typescript
// infrastructure/tauri.ts
loadThumbnailImage(request: LoadThumbnailImageRequest): Promise<LoadAlbumImageResponse>

interface LoadThumbnailImageRequest {
  album_id: string;
  image_index: number;
}
```

**Caller**: `ThumbnailStrip` component calls `loadThumbnailImage` via the store action.

---

## No Contracts Added

No new command contracts, IPC messages, or shared data types are introduced by this feature.
All state changes (zoom bounds, pan reset, layout restructuring, CSS theming) are entirely within the React component tree and stylesheet.
