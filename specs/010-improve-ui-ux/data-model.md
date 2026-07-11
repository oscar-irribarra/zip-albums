# Data Model: Improve UI/UX (010)

**Date**: 2026-07-10
**Feature**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)

---

## Existing entities (unchanged)

### AlbumSummary (Rust + TypeScript — no schema change)

Used in `get_library`. No `cover_data` is added here (covers load lazily via the new `get_album_cover` command).

```
AlbumSummary
├── id: String              — unique album identifier (filename stem)
├── title: String           — human-readable album name
├── path: String            — absolute path to the ZIP file
├── image_count: usize      — total supported images in the ZIP
├── cover_index: usize      — always 0 (first image after sort)
├── imported_at: String     — Unix timestamp of import
└── last_opened_at: String? — Unix timestamp of last open (nullable)
```

### AlbumViewSession (TypeScript — no change)

```
AlbumViewSession
├── album_id: String
├── album_name: String
├── total_images: number
├── current_index: number
└── started_at: String      — ISO timestamp (frontend only)
```

### UserSettings (Rust + TypeScript — no change)

```
UserSettings
├── theme: "light" | "dark" | "system"
├── albums_directory: String?
├── fullscreen: bool
├── remember_last_album: bool
├── initial_zoom: f64
└── updated_at: String
```

---

## New entities

### GetAlbumCoverRequest (Rust + TypeScript)

Input for the new `get_album_cover` Tauri command.

```
GetAlbumCoverRequest
└── album_id: String        — album identifier to load cover from
```

### GetAlbumCoverResponse (Rust + TypeScript)

Output of the `get_album_cover` Tauri command.

```
GetAlbumCoverResponse
├── album_id: String        — echoed from request
├── image_source: String    — data URL: "data:<mime>;base64,<b64>"
└── mime_type: String       — e.g. "image/jpeg", "image/png", "image/webp"
```

### AlbumCoverState (TypeScript — local to AlbumCard)

Ephemeral per-card local React state. Not persisted. Not in Zustand.

```
AlbumCoverState
├── loading: boolean
├── data: string | null     — image_source from GetAlbumCoverResponse
└── error: boolean          — true if cover load failed (show placeholder)
```

### PanOffset (TypeScript — local to ImageViewer)

Ephemeral drag/pan state. Resets on image navigation. Not persisted.

```
PanOffset
├── x: number               — horizontal pan in CSS pixels
└── y: number               — vertical pan in CSS pixels
```

### ThumbnailStripVisibility (TypeScript — split across store and local state)

Controls thumbnail strip render state.

```
ThumbnailStripVisibility
├── pinned: boolean         — from libraryStore.thumbnailStripPinned (persistent across nav within session)
└── hoverVisible: boolean   — from useState in ViewerScreen (ephemeral, resets per mouse event)
```
Derived: `visible = pinned || hoverVisible`

---

## Modified Rust behavior (not new types)

### ZipService::inspect_album_checked — image sort

After collecting `image_entries`, sort ascending by lowercased filename:

```
image_entries.sort_unstable_by(|a, b| a.cmp(b))
```

Names are already lowercased at collection time, so this gives correct ascending lex order.

### ZipService::load_image_by_index — entry sort

After collecting `supported_entries: Vec<(usize, String, String)>`, sort by entry name:

```
supported_entries.sort_unstable_by(|a, b| a.1.to_lowercase().cmp(&b.1.to_lowercase()))
```

This ensures index 0 consistently maps to the alphabetically-first image, matching the cover.

### delete_album Rust command — behavior change

Remove: `FileSystemService::delete_file(&album_path)` call.  
Keep: `MetadataService::remove_album(&catalog_path, &payload.album_id)` call.

No type changes — `DeleteAlbumResponse` shape unchanged.

---

## State transitions

### Library screen load

```
App mounts
  → settingsStore.loadSettings()
  → libraryStore.loadLibrary()         → albums[]
  → Each AlbumCard mounts
      → getAlbumCover(album_id)        → cover data URL (lazy, per card)
```

### Album open (library → viewer)

```
User clicks Open on AlbumCard
  → libraryStore.openAlbumViewer(albumId)
      → Rust: open_album_viewer → session
      → Rust: load_album_image(0) → first image
  → App.tsx: viewerSession !== null → renders ViewerScreen
  → ViewerScreen mounts → keyboard shortcuts attach
```

### Viewer close (viewer → library)

```
User clicks Back button
  → libraryStore.closeViewer()
  → App.tsx: viewerSession === null → renders LibraryScreen
  → ViewerScreen unmounts → keyboard shortcuts detach
```

### Album delete

```
User clicks Delete on AlbumCard
  → Confirmation dialog (no mention of file deletion)
  → libraryStore.deleteAlbum(albumId)
      → Rust: delete_album → removes from catalog only
      → ZIP file preserved on disk
  → albums[] updates in store → card disappears
```

### Thumbnail strip toggle

```
Hidden state: narrow hover zone visible at bottom
  → onMouseEnter(hoverZone) → hoverVisible = true → strip shows
  → onMouseLeave(strip or zone) → hoverVisible = false → strip hides

  → onClick(toggle button) → pinned = !pinned
    If pinned = true → strip stays visible regardless of hover
    If pinned = false → strip follows hover state
```
