# Data Model: Album Viewer

## Entities

## 1) AlbumViewSession

Represents the active viewer session for one album.

- `albumId: string`
- `albumName: string`
- `totalImages: number`
- `currentIndex: number` (0-based)
- `startedAt: string` (ISO datetime)

Validation rules:

- `totalImages >= 1`
- `0 <= currentIndex < totalImages`
- `albumId` must match an existing library album

State transitions:

- `initialized` -> `ready` after open resolves
- `ready` -> `navigating` while changing image
- `navigating` -> `ready` after image load
- `ready` -> `closed` when viewer exits

## 2) ReadingProgress

Persisted metadata to resume album reading.

- `albumId: string`
- `lastImageIndex: number` (0-based)
- `updatedAt: string` (ISO datetime)

Validation rules:

- Unique by `albumId`
- `lastImageIndex >= 0`
- On restore, if `lastImageIndex >= totalImages`, fallback to `0`

## 3) ViewerHeaderContext

Derived display state for the header.

- `albumName: string`
- `currentPosition: number` (1-based for UI)
- `totalImages: number`

Validation rules:

- `1 <= currentPosition <= totalImages`
- Computed from `AlbumViewSession`

## 4) ViewImagePayload

Response payload for a single visible image.

- `albumId: string`
- `imageIndex: number`
- `imageSource: string` (viewer-consumable URI or base64)
- `mimeType: string`

Validation rules:

- `imageIndex` must be valid for album
- `mimeType` must be supported image type
- Payload must represent one image only (no batch)

## Relationships

- One `AlbumViewSession` references exactly one album.
- One album has zero or one `ReadingProgress` record.
- `ViewerHeaderContext` is derived from `AlbumViewSession`.
- Each navigation action requests one `ViewImagePayload`.
