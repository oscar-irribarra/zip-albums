# Tauri Command Contract: Import ZIP Albums

## Command: import_album

Purpose: Import one ZIP file as a new album after validation.

### Input

```json
{
  "zip_path": "C:/Users/example/Pictures/my-album.zip"
}
```

### Success Output

```json
{
  "album": {
    "id": "my-album",
    "title": "my-album",
    "path": "C:/Users/example/Pictures/my-album.zip",
    "image_count": 24,
    "cover_index": 0,
    "imported_at": "1761847142",
    "last_opened_at": null
  }
}
```

### Error Output

```json
{
  "code": "NO_SUPPORTED_IMAGES",
  "message": "The ZIP does not contain supported images.",
  "details": "Supported formats: png, jpg, jpeg, webp"
}
```

### Error Codes

- `UNSUPPORTED_FORMAT`: Selected file is not ZIP.
- `ZIP_CORRUPTED`: ZIP cannot be opened/read.
- `ZIP_EMPTY`: ZIP has no entries.
- `NO_SUPPORTED_IMAGES`: ZIP has entries but no supported images.
- `DUPLICATE_ALBUM`: ZIP already imported.
- `IO_FAILURE`: Unexpected local file operation failure.

## Foundational Alignment Notes

- Request payload key is `payload.zip_path` in Tauri `invoke` calls.
- Successful responses return `album` as an `AlbumSummary` object with snake_case fields.
- Error responses include stable `code` and user-facing `message`.
- Duplicate detection is based on canonical ZIP path persisted in metadata.

## Existing Commands Used With This Feature

### get_library

Purpose: Load current library list.

### delete_album

Purpose: Delete a selected album.

No contract change required for these commands in this feature.