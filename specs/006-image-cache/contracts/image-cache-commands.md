# Contract: Image Cache Command Usage

## Purpose

Define how image cache behavior consumes existing Tauri commands while preserving architecture boundaries.

## Existing Commands Used

### 1) `open_album_viewer`

Used to initialize viewer session and determine start index.

Request:

```json
{
  "album_id": "summer-trip"
}
```

Success response:

```json
{
  "album_id": "summer-trip",
  "album_name": "Summer Trip",
  "total_images": 120,
  "start_index": 0
}
```

### 2) `load_album_image`

Used for lazy image load of current image and adjacent prefetch targets.

Request:

```json
{
  "album_id": "summer-trip",
  "image_index": 42
}
```

Success response:

```json
{
  "album_id": "summer-trip",
  "image_index": 42,
  "image_source": "data:image/jpeg;base64,...",
  "mime_type": "image/jpeg"
}
```

### 3) `save_reading_progress`

Used after successful navigation to persist current index.

Request:

```json
{
  "album_id": "summer-trip",
  "last_image_index": 42
}
```

Success response:

```json
{
  "saved": true,
  "updated_at": "1761847200"
}
```

## Error Contract

Viewer error payloads remain unchanged:

```json
{
  "code": "IMAGE_INDEX_OUT_OF_RANGE",
  "message": "The requested image index is out of range.",
  "details": null
}
```

Expected codes for cache-related navigation flows:

- `ALBUM_NOT_FOUND`
- `IMAGE_INDEX_OUT_OF_RANGE`
- `ZIP_READ_FAILURE`
- `UNSUPPORTED_IMAGE`
- `PROGRESS_WRITE_FAILURE`
- `IO_FAILURE`

## Behavioral Rules

- Frontend cache must never access filesystem directly.
- Any filesystem access remains in Rust infrastructure services.
- Any ZIP image read remains routed through `ZipService` via existing commands.
- Cache is in-memory only and session-scoped.
- Album ZIP contents must never be duplicated or rewritten.
