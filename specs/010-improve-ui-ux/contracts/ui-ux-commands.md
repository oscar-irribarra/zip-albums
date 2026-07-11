# Tauri Command Contracts: Improve UI/UX (010)

**Date**: 2026-07-10
**Feature**: [spec.md](../spec.md)

This document describes the Tauri IPC command contracts exposed by the Rust backend and consumed by the React frontend. Only commands that are new or modified by this feature are listed.

---

## New command: `get_album_cover`

### Purpose

Lazily loads the cover image (first image sorted ascending by filename) for a given album directly from its ZIP file. Called per `AlbumCard` on mount. Never modifies the ZIP.

### Request

```json
{
  "album_id": "<string>"
}
```

| Field      | Type   | Description                              |
|------------|--------|------------------------------------------|
| `album_id` | string | Identifier of the album to fetch cover for |

### Success Response

```json
{
  "album_id": "<string>",
  "image_source": "data:image/jpeg;base64,<base64-encoded-bytes>",
  "mime_type": "image/jpeg"
}
```

| Field          | Type   | Description                                              |
|----------------|--------|----------------------------------------------------------|
| `album_id`     | string | Echoed from request                                      |
| `image_source` | string | Data URL ready for use in `<img src>`, never a file path |
| `mime_type`    | string | One of: `image/png`, `image/jpeg`, `image/webp`          |

### Error Response

Returns a plain string error message (Tauri `Err(String)` convention used by existing commands).

| Condition                    | Behavior                              |
|------------------------------|---------------------------------------|
| Album not in catalog         | Error: `"Album not found"`            |
| ZIP path does not exist      | Error: `"ZIP file not accessible"`    |
| ZIP has no supported images  | Error: `"No supported images in ZIP"` |
| ZIP corrupted                | Error: `"ZIP archive is corrupted"`   |

### Invariants

- The ZIP file is opened read-only; its contents are never modified.
- The image index used is always `0` after ascending lexicographic sort of image filenames.
- Response is not cached server-side; the frontend is responsible for avoiding redundant calls.

---

## Modified command: `delete_album`

### What changed

**Before**: Removes album from catalog **and** deletes the ZIP file from disk.  
**After**: Removes album from catalog **only**. The original ZIP file is never touched.

### Request (unchanged)

```json
{
  "album_id": "<string>"
}
```

### Success Response (unchanged)

```json
{
  "success": true,
  "removed_album_id": "<string>"
}
```

### Behavior when album not found (unchanged)

```json
{
  "success": false,
  "removed_album_id": null
}
```

### Invariants

- The ZIP file at `album.path` is preserved on the filesystem in all cases.
- Only the album entry in `albums_catalog.json` is removed.
- Associated `reading_progress` entry for the album is NOT removed (orphaned entries are harmless).

---

## Existing commands (reference — no changes)

| Command                  | Purpose                                             |
|--------------------------|-----------------------------------------------------|
| `get_library`            | Returns all albums in catalog (no cover data)       |
| `import_album`           | Validates and registers a new ZIP album             |
| `open_album_viewer`      | Restores reading progress, returns session info     |
| `load_album_image`       | Returns image by index as base64 data URL           |
| `save_reading_progress`  | Persists last viewed index for an album             |
| `get_startup_context`    | Returns settings + restore album + warnings         |
| `update_user_settings`   | Persists user preferences                           |
| `set_last_opened_album`  | Records last opened album for session restore       |
