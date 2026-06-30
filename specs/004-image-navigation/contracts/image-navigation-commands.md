# Contract: Image Navigation

This feature reuses the existing Tauri command surface. No new backend command is required for the minimal implementation.

## Reused commands

### `open_album_viewer`

Opens the current album and resolves the starting image index from saved progress or the first image.

Request:

```json
{
  "album_id": "string"
}
```

Success response:

```json
{
  "album_id": "string",
  "album_name": "string",
  "total_images": 12,
  "start_index": 0
}
```

### `load_album_image`

Loads exactly one image from the ZIP by index. The frontend uses this command for the active image and for any thumbnail that enters the visible viewport.

Request:

```json
{
  "album_id": "string",
  "image_index": 0
}
```

Success response:

```json
{
  "album_id": "string",
  "image_index": 0,
  "image_source": "string",
  "mime_type": "image/jpeg"
}
```

### `save_reading_progress`

Persists the latest completed image index for the active album.

Request:

```json
{
  "album_id": "string",
  "last_image_index": 0
}
```

Success response:

```json
{
  "saved": true,
  "updated_at": "2026-06-30T18:20:00Z"
}
```

## Behavioral rules

- React must not access the filesystem directly.
- ZIP access must remain in `ZipService`.
- Navigation state is frontend-local and does not require a new persisted backend model.
- Thumbnail scrolling is a presentation concern and stays in React.
- Progress save failures must not destroy the current viewer session.
