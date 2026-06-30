# Research: Library management feature

## Decisions

- Use a local JSON metadata catalog stored in the Tauri app data directory for album metadata such as title, path, image count, cover index, and import date.
- Read album ZIP files on startup and derive display data from the ZIP contents through a dedicated Rust ZipService.
- Expose album list and delete operations through typed Tauri commands instead of direct filesystem access from the UI.
- Keep the initial implementation scoped to a single album directory and a simple sort toggle for name/date.

## Rationale

These decisions keep the feature offline, simple, and aligned with the constitution. They avoid introducing a database and keep ZIP files as the source of truth while still allowing the app to track metadata needed for display and deletion.

## Alternatives considered

- Store all album metadata in a database: rejected because the spec does not require it and it adds unnecessary complexity.
- Read every album directly from the UI: rejected because the constitution requires filesystem access to remain in Rust infrastructure services.
- Preload full album thumbnails for every card: rejected because it would violate lazy loading and hurt responsiveness.
