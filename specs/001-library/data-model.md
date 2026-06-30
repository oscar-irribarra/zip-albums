# Data model: Library management

## Core entities

### Album

- id: string
- title: string
- path: string
- imageCount: number
- coverIndex: number
- importedAt: string (ISO 8601)
- lastOpenedAt: string | null

### AlbumMetadataCatalog

- version: number
- albums: Album[]

## Validation rules

- title must be non-empty
- path must be a valid local path
- imageCount must be greater than or equal to 0
- importedAt must be a valid timestamp
- coverIndex must be within the range of available images

## Relationships

- One album is backed by one ZIP file at the path stored in metadata.
- One album metadata entry corresponds to one local ZIP file.
- Deleting an album removes both the metadata entry and the ZIP file.
