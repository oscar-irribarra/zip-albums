# Contract: Album Viewer Commands

This feature uses Tauri command contracts between React and Rust.

## 1) open_album_viewer

Opens an album session and resolves the start index (saved progress or cover fallback).

Request:

```json
{
  "albumId": "string"
}
```

Success response:

```json
{
  "albumId": "string",
  "albumName": "string",
  "totalImages": 42,
  "startIndex": 0
}
```

Error response:

```json
{
  "code": "ALBUM_NOT_FOUND|PROGRESS_READ_FAILURE|IO_FAILURE",
  "message": "string"
}
```

## 2) load_album_image

Returns the currently visible image only.

Request:

```json
{
  "albumId": "string",
  "imageIndex": 0
}
```

Success response:

```json
{
  "albumId": "string",
  "imageIndex": 0,
  "imageSource": "string",
  "mimeType": "image/jpeg"
}
```

Error response:

```json
{
  "code": "IMAGE_INDEX_OUT_OF_RANGE|ZIP_READ_FAILURE|UNSUPPORTED_IMAGE|IO_FAILURE",
  "message": "string"
}
```

## 3) save_reading_progress

Persists latest viewed index for an album.

Request:

```json
{
  "albumId": "string",
  "lastImageIndex": 0
}
```

Success response:

```json
{
  "saved": true,
  "updatedAt": "2026-06-30T18:20:00Z"
}
```

Error response:

```json
{
  "code": "ALBUM_NOT_FOUND|PROGRESS_WRITE_FAILURE|IO_FAILURE",
  "message": "string"
}
```

## Behavioral constraints

- ZIP access MUST be performed by `ZipService` only.
- Filesystem access MUST be performed by infrastructure services only.
- `load_album_image` MUST return one image payload per call.
- Progress restore MUST fallback to cover index `0` if stored index is invalid.
