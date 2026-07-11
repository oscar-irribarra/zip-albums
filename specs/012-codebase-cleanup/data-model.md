# Data Model: Codebase Cleanup and Technical Debt Reduction

**Feature**: 012-codebase-cleanup
**Date**: 2026-07-11

---

## Overview

This enabler introduces no new entities, no schema changes, and no new persistence
requirements. The data model is unchanged.

The only data-model-adjacent change is the removal of three dead TypeScript type
declarations from `src/shared/types/library.ts`. These types were never used; their
removal does not affect serialization, persistence, or the Tauri command surface.

---

## Types Removed

The following type declarations are being removed as part of cleanup.
They are exported from `shared/types/library.ts` but imported by zero other files.

### `ImportAlbumRequest` (TypeScript only)

```ts
// REMOVED — never imported by any source file
export interface ImportAlbumRequest {
  zip_path: string;
}
```

Note: A Rust struct named `ImportAlbumRequest` exists in `src-tauri/src/lib.rs` and is
actively used as the Tauri command parameter type. That struct is **not** removed.

### `ShortcutGesture` (TypeScript only)

```ts
// REMOVED — never imported by any source file
export type ShortcutGesture =
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End"
  | "f"
  | "Escape"
  | "Ctrl+O"
  | "Delete";
```

### `ShortcutGuardContext` (TypeScript only)

```ts
// REMOVED — never imported by any source file
export interface ShortcutGuardContext {
  viewer_active: boolean;
  is_fullscreen: boolean;
  selected_album_id: string | null;
  editable_target_active: boolean;
}
```

---

## Entities Unchanged

All active entity types remain identical:

| Type | Used By |
|------|---------|
| `AlbumSummary` | `libraryStore`, `LibraryView`, `AlbumCard` |
| `AlbumViewSession` | `libraryStore`, `ViewerScreen` |
| `LoadAlbumImageResponse` | `libraryStore`, `ViewerScreen`, `ThumbnailStrip` |
| `UserSettings` | `settingsStore`, `SettingsPanel` |
| `UpdateUserSettingsRequest` | `settingsStore`, `SettingsPanel` |
| `ViewerImageCacheEntry` | `libraryStore` |
| `CacheWindowState` | `libraryStore` |
| `ImageCacheDiagnostics` | `libraryStore` |
| `LibraryResponse` | `libraryStore` |
| `SortOrder` | `libraryStore`, `LibraryView` |
| All error/response types | respective stores and Tauri bridge |

---

## Rust Data Model

No Rust structs, enums, or types are added or modified.

The `greet` command (a `fn greet(name: &str) -> String`) is removed from `lib.rs`.
It is a plain function with no associated data types. Its removal does not affect
serialization, the catalog, or any persisted data.
