# Data Model: Import ZIP Albums

## Overview

This feature reuses the existing album metadata catalog and adds import-specific request/result models. No database is introduced and no album content is duplicated.

## Entities

### ImportAlbumRequest

- Description: Input payload from frontend to backend import command.
- Fields:
  - `zip_path: string` (absolute local path selected by user)
- Validation rules:
  - Must exist.
  - Must be a regular file.
  - Must end with `.zip` (case-insensitive).

### ImportError

- Description: Normalized failure category for import attempts.
- Fields:
  - `code: string` (`UNSUPPORTED_FORMAT` | `ZIP_CORRUPTED` | `ZIP_EMPTY` | `NO_SUPPORTED_IMAGES` | `DUPLICATE_ALBUM` | `IO_FAILURE`)
  - `message: string` (user-facing message)
  - `details?: string` (optional technical info for logs)

### ImportAlbumResponse

- Description: Result payload for successful import.
- Fields:
  - `album: AlbumSummary`

### AlbumSummary (existing shared model)

- Description: Library list projection for frontend rendering.
- Fields:
  - `id: string`
  - `title: string`
  - `path: string`
  - `image_count: number`
  - `cover_index: number`
  - `imported_at: string`
  - `last_opened_at?: string | null`

### AlbumMetadataCatalog (existing persisted model)

- Description: Metadata file persisted as JSON.
- Fields:
  - `version: number`
  - `albums: AlbumMetadata[]`

## Relationships

- `ImportAlbumRequest` -> validated by `FileSystemService` and `ZipService`.
- Successful validation produces `AlbumMetadata`, appended to `AlbumMetadataCatalog`.
- `AlbumMetadata` is mapped to `AlbumSummary` in command response.

## State Transitions

1. `Idle` -> `ValidatingInput` when import command is invoked.
2. `ValidatingInput` -> `InspectingZip` after path and extension checks pass.
3. `InspectingZip` -> `Rejected` when ZIP is corrupted/empty/no supported images.
4. `InspectingZip` -> `CheckingDuplicate` when at least one supported image exists.
5. `CheckingDuplicate` -> `Rejected` if catalog already contains the same canonical path.
6. `CheckingDuplicate` -> `PersistingMetadata` when duplicate check passes.
7. `PersistingMetadata` -> `Imported` after catalog save succeeds.
8. Any state -> `Rejected` on unexpected IO failure.

## Invariants

- Catalog is updated only on successful import.
- Failed imports do not mutate library metadata.
- ZIP internal image order is preserved in inspection result.
- `cover_index` is always `0` when at least one supported image exists.