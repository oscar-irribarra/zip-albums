# Data Model: Image Navigation

## Entities

### 1) AlbumViewSession

Represents the active viewer session for the currently open album.

- `album_id: string`
- `album_name: string`
- `total_images: number`
- `current_index: number` (0-based)
- `started_at: string`

Validation rules:

- `total_images >= 1`
- `0 <= current_index < total_images`
- The active session must belong to a single album only

### 2) ReadingProgress

Persisted per-album metadata used to restore the viewer.

- `album_id: string`
- `last_image_index: number` (0-based)
- `updated_at: string`

Validation rules:

- One progress record per album
- `last_image_index >= 0`
- Restore must clamp to `0` if the stored index is outside the current album bounds

### 3) ThumbnailCacheEntry

Frontend-local cache entry for a thumbnail or other visible preview.

- `album_id: string`
- `image_index: number`
- `image_source: string`
- `mime_type: string`
- `status: "idle" | "loading" | "ready" | "error"`

Validation rules:

- Cache entries are ephemeral and must never be persisted as album metadata
- Cache size should stay bounded to the visible thumbnail window plus a small buffer

### 4) ThumbnailViewportState

Frontend-local scroll state for the thumbnail rail.

- `selected_index: number`
- `scroll_left: number`
- `visible_start_index: number`
- `visible_end_index: number`

Validation rules:

- The selected thumbnail must be kept visible after every image change
- The viewport state is derived from UI state, not persisted data

## Relationships

- One `AlbumViewSession` belongs to exactly one album.
- One album may have zero or one `ReadingProgress` record.
- Many `ThumbnailCacheEntry` items may exist transiently for one active session.
- `ThumbnailViewportState` is derived from the selected index and the thumbnail strip scroll container.
