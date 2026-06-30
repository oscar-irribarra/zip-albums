# Tauri command contract: Library management

## Commands

### get_library

**Purpose**: Load all albums available in the configured local catalog.

**Input**: none

**Output**:

```json
{
  "albums": [
    {
      "id": "album-1",
      "title": "Example Album",
      "path": "/albums/example.zip",
      "imageCount": 42,
      "coverIndex": 0,
      "importedAt": "2026-06-30T10:00:00.000Z"
    }
  ],
  "sortOrder": "name"
}
```

### delete_album

**Purpose**: Delete the selected album and its metadata.

**Input**:

```json
{
  "albumId": "album-1"
}
```

**Output**:

```json
{
  "success": true,
  "removedAlbumId": "album-1"
}
```

### set_library_sort_order

**Purpose**: Update the active sort mode for the library list.

**Input**:

```json
{
  "sortOrder": "date"
}
```

**Output**: none
