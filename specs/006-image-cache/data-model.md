# Data Model: Image Cache

## Entities

### 1) ViewerImageCacheEntry

Represents one in-memory loaded image for the active album viewer session.

- `album_id: string`
- `image_index: number`
- `image_source: string`
- `mime_type: string`
- `cached_at: string`
- `estimated_bytes: number`

Validation rules:

- Entry is valid only for the active `viewerSession.album_id`.
- `image_index` must be within `[0, total_images - 1]`.
- Duplicate entries for the same `album_id:image_index` are not allowed.

### 2) CacheWindowState

Represents cache policy and active window around current image.

- `current_index: number`
- `window_start: number`
- `window_end: number`
- `max_entries: number`
- `max_estimated_bytes: number`
- `total_estimated_bytes: number`

Validation rules:

- For v1 window radius is 1, so target window is `[current_index - 1, current_index + 1]` clamped to album boundaries.
- `window_start` and `window_end` must always remain in album bounds.
- `total_estimated_bytes` must not exceed `max_estimated_bytes` after eviction is applied.

### 3) ViewerSession (existing, extended usage)

Existing session remains the source of truth for navigation.

- `album_id: string`
- `album_name: string`
- `total_images: number`
- `current_index: number`
- `started_at: string`

Validation rules:

- Navigation updates `current_index` only after requested image load succeeds.
- Cache updates must derive from the latest accepted session state.

## Relationships

- One `ViewerSession` has many `ViewerImageCacheEntry` items.
- `CacheWindowState` is derived from `ViewerSession.current_index`.
- Cache entries outside active window are candidates for immediate eviction.

## State Transitions

1. Open viewer:
   - Create/refresh `ViewerSession`.
   - Load current image.
   - Seed cache with current image.

2. Navigate to image N:
   - Load image N on demand.
   - Set `current_index = N`.
   - Recompute active window.
   - Ensure previous/current/next are in cache (prefetch missing neighbors).
   - Evict out-of-window entries.

3. Budget enforcement:
   - If `total_estimated_bytes` exceeds budget, evict farthest entries from current index until within budget.

4. Close viewer or switch album:
   - Clear all viewer cache entries for prior session.
