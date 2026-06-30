# Contract: Settings Commands

## Purpose

Define Tauri command contracts needed to persist and restore user settings.

## 1) `get_startup_context`

Returns effective settings and startup restore context.

Request:

```json
{}
```

Success response:

```json
{
  "settings": {
    "theme": "system",
    "albums_directory": "C:/Users/user/Pictures/Albums",
    "fullscreen": false,
    "remember_last_album": true,
    "initial_zoom": 1.0,
    "updated_at": "1761847142"
  },
  "restore_album_id": "summer-trip",
  "warnings": []
}
```

## 2) `update_user_settings`

Validates and persists user settings.

Request:

```json
{
  "theme": "dark",
  "albums_directory": "C:/Users/user/Pictures/Albums",
  "fullscreen": true,
  "remember_last_album": true,
  "initial_zoom": 1.25
}
```

Success response:

```json
{
  "settings": {
    "theme": "dark",
    "albums_directory": "C:/Users/user/Pictures/Albums",
    "fullscreen": true,
    "remember_last_album": true,
    "initial_zoom": 1.25,
    "updated_at": "1761847152"
  }
}
```

## 3) `set_last_opened_album`

Records the most recently opened album for conditional restore.

Request:

```json
{
  "album_id": "summer-trip"
}
```

Success response:

```json
{
  "saved": true,
  "updated_at": "1761847160"
}
```

## Error Contract

```json
{
  "code": "INVALID_ALBUMS_DIRECTORY",
  "message": "Configured albums directory is not accessible.",
  "details": "Path does not exist"
}
```

Expected settings error codes:

- `SETTINGS_READ_FAILURE`
- `SETTINGS_WRITE_FAILURE`
- `INVALID_ALBUMS_DIRECTORY`
- `INVALID_ZOOM_VALUE`
- `STARTUP_CONTEXT_FAILURE`

## Behavioral Rules

- Frontend must not access filesystem directly.
- Folder path validation and canonicalization must happen in Rust `FileSystemService`.
- Persist only metadata; do not duplicate album ZIP contents.
- ZIP reads (if any are needed by future settings-related flows) must stay in `ZipService`.
