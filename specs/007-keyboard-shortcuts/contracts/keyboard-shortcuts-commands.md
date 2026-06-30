# Contract: Keyboard Shortcuts Command Usage

## Purpose

Define how keyboard shortcuts map to existing frontend actions and Tauri commands while preserving architecture boundaries.

## Shortcut to Action Mapping

- `ArrowLeft` -> viewer previous image (`goToImage(current - 1)`)
- `ArrowRight` -> viewer next image (`goToImage(current + 1)`)
- `Home` -> viewer first image (`goToImage(0)`)
- `End` -> viewer last image (`goToImage(total - 1)`)
- `F` -> enter fullscreen (viewer context)
- `Escape` -> exit fullscreen
- `Ctrl+O` -> import ZIP flow (`open` dialog then `import_album`)
- `Delete` -> delete selected album with confirmation (`delete_album`)

## Existing Commands Used

### 1) `import_album`

Request:

```json
{
  "zip_path": "C:/albums/trip.zip"
}
```

Success response:

```json
{
  "album": {
    "id": "trip",
    "title": "trip",
    "path": "C:/albums/trip.zip",
    "image_count": 42,
    "cover_index": 0,
    "imported_at": "2026-06-30T10:00:00Z"
  }
}
```

### 2) `delete_album`

Request:

```json
{
  "album_id": "trip"
}
```

Success response:

```json
{
  "success": true,
  "removed_album_id": "trip"
}
```

### 3) `open_album_viewer`

Request:

```json
{
  "album_id": "trip"
}
```

Success response:

```json
{
  "album_id": "trip",
  "album_name": "Trip",
  "total_images": 42,
  "start_index": 0
}
```

### 4) `load_album_image`

Request:

```json
{
  "album_id": "trip",
  "image_index": 5
}
```

Success response:

```json
{
  "album_id": "trip",
  "image_index": 5,
  "image_source": "data:image/jpeg;base64,...",
  "mime_type": "image/jpeg"
}
```

## Error Contract

Keyboard actions reuse existing errors and mapping strategy:

- `ALBUM_NOT_FOUND`
- `IMAGE_INDEX_OUT_OF_RANGE`
- `ZIP_READ_FAILURE`
- `UNSUPPORTED_IMAGE`
- `PROGRESS_WRITE_FAILURE`
- `IO_FAILURE`
- import/delete existing error contracts

## Behavioral Rules

- Shortcuts must be ignored when focus is in editable controls.
- Context-invalid shortcuts must no-op without crashing.
- Frontend must not access filesystem directly.
- Filesystem work must remain in Rust `FileSystemService`.
- ZIP operations must remain in Rust `ZipService`.
- Viewer image loading remains lazy; no full-album preload.
- No new database and no album-content duplication.

## Command Reference Validation Notes

- Viewer navigation shortcuts (`ArrowLeft`, `ArrowRight`, `Home`, `End`) must route through existing `goToImage` -> `load_album_image` flow.
- Import shortcut (`Ctrl+O`) must route through existing dialog selection and `import_album` command.
- Delete shortcut (`Delete`) must route through existing confirmation and `delete_album` command.
- Fullscreen shortcuts (`F`, `Escape`) remain frontend window actions and must not introduce new backend commands.
