# Data Model: Settings Persistence

## Entities

### 1) UserSettings

Represents persisted user preferences.

- `theme: "light" | "dark" | "system"`
- `albums_directory: string | null`
- `fullscreen: boolean`
- `remember_last_album: boolean`
- `initial_zoom: number`
- `updated_at: string`

Validation rules:

- `theme` must be one of the allowed values.
- `albums_directory` may be null, otherwise must resolve to a readable local directory.
- `initial_zoom` must stay in a bounded range (recommended: 0.5 to 3.0).

### 2) StartupContext

Represents startup data required by frontend initialization.

- `settings: UserSettings`
- `restore_album_id: string | null`
- `warnings: string[]`

Validation rules:

- `restore_album_id` is only present when `remember_last_album = true` and album exists in catalog.
- `warnings` contains recoverable issues only (for example inaccessible folder).

### 3) AlbumCatalog (existing, extended)

Current persisted metadata file (`albums_catalog.json`) gains settings fields.

- `version: u32`
- `albums: AlbumMetadata[]`
- `reading_progress: ReadingProgress[]`
- `settings: UserSettings` (new)
- `last_opened_album_id: string | null` (new)

Validation rules:

- Existing catalogs without `settings` must deserialize to safe defaults.
- `last_opened_album_id` must be null if album no longer exists.

## Relationships

- One `AlbumCatalog` contains exactly one `UserSettings` object.
- `StartupContext` is derived from `UserSettings` + current album catalog state.
- `last_opened_album_id` references at most one album in `albums`.

## State Transitions

1. App launch -> load catalog defaults -> derive `StartupContext`.
2. User edits settings -> validate -> persist `UserSettings` -> return updated settings.
3. User opens album -> update `last_opened_album_id` if remember-last-album enabled.
4. User disables remember-last-album -> keep historical value optional but do not auto-restore.
