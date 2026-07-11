# Implementation Plan: Improve UI/UX

**Branch**: `010-improve-ui-ux` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-improve-ui-ux/spec.md`

## Summary

Refactor the application into two fully independent screens (library and viewer), fix album deletion to preserve ZIP files, implement lazy album cover loading from ZIP, add bounded zoom+pan in the viewer, and redesign the thumbnail strip with a dedicated hover zone and pin toggle.

All changes are additive or surgical fixes. No database. No new dependencies. ZIP files remain read-only throughout.

---

## Technical Context

**Language/Version**: Rust 1.x (Tauri 2), TypeScript 5.8, React 19

**Primary Dependencies**: Tauri 2, React, Zustand 5, Vite 7, plain CSS (no Tailwind classes in use currently)

**Storage**: JSON catalog (`albums_catalog.json`) — no schema changes

**Testing**: `cargo test` (Rust), `vitest run` (TypeScript / Testing Library)

**Target Platform**: Windows, macOS, Linux (Tauri desktop)

**Project Type**: Desktop application

**Performance Goals**: Cover images render < 2 s per card; strip show/hide < 150 ms; pan response < 16 ms (60 fps)

**Constraints**: Offline only; ZIP files are never modified; no preloading entire albums into memory

**Scale/Scope**: Typical library of 10–200 albums; viewer shows one album at a time

---

## Constitution Check

*Evaluated against `.specify/memory/constitution.md`*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline First | ✅ Pass | No network calls introduced |
| II. ZIP is Source of Truth | ✅ Pass | Covers read from ZIP read-only; ZIP never modified |
| III. Read-Only Albums | ✅ Pass | `get_album_cover` is read-only; `delete_album` fix removes ZIP deletion |
| IV. Simple Architecture | ✅ Pass | State-based navigation (no router); pan in local state; no new abstractions |
| V. Separation of Responsibilities | ✅ Pass | Cover loading in Rust; pan/hover in React; no direct FS access from UI |
| VI. Local Persistence | ✅ Pass | No new persistence; `thumbnailStripPinned` is ephemeral (not persisted) |
| VII. Lazy Loading | ✅ Pass | Covers load per-card on mount; viewer images load on demand (unchanged) |
| VIII. Performance | ✅ Pass | Cover loads async non-blocking; pointer capture for pan is synchronous |
| IX. Error Handling | ✅ Pass | Cover errors show placeholder; all errors recoverable |
| X. Cross Platform | ✅ Pass | Pointer events API cross-platform; no platform-specific code |

**No violations. No Complexity Tracking needed.**

---

## Project Structure

### Documentation (this feature)

```text
specs/010-improve-ui-ux/
├── plan.md                          # This file
├── research.md                      # Phase 0 decisions
├── data-model.md                    # Entity and state definitions
├── quickstart.md                    # Validation scenarios
├── contracts/
│   └── ui-ux-commands.md            # Tauri command contracts
├── checklists/
│   └── requirements.md
└── tasks.md                         # Created by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── App.tsx                          # MODIFY — conditional render library/viewer
├── App.css                          # MODIFY — theme tokens, viewer bg, strip sizing
├── features/
│   ├── library/
│   │   ├── index.ts                 # MODIFY — remove ThumbnailStrip export
│   │   ├── components/
│   │   │   ├── LibraryView.tsx      # MODIFY — remove viewer block; library-only
│   │   │   └── AlbumCard.tsx        # MODIFY — lazy cover; fix delete dialog text
│   │   └── store/
│   │       └── libraryStore.ts      # NO CHANGE
│   └── viewer/                      # NEW feature directory
│       ├── index.ts                 # NEW — exports ViewerScreen, ThumbnailStrip
│       └── components/
│           ├── ViewerScreen.tsx     # NEW — full-screen viewer + keyboard shortcuts
│           └── ThumbnailStrip.tsx   # MOVED from library/components/
├── infrastructure/
│   └── tauri.ts                     # MODIFY — add getAlbumCover()
└── shared/
    └── types/
        └── library.ts               # MODIFY — add GetAlbumCover types

src-tauri/src/
├── lib.rs                           # MODIFY — add get_album_cover; fix delete_album
└── services/
    └── zip_service.rs               # MODIFY — sort image entries ascending
```

---

## 1. Feature Overview

This feature delivers four improvements in a single branch:

1. **Library screen independence** — library and viewer become separate full-screen views.
2. **Safe delete** — album deletion removes catalog entry only; ZIP preserved on disk.
3. **Viewer improvements** — Back button, bounded zoom+pan, theme-aware background.
4. **Thumbnail strip redesign** — hidden by default, hover zone trigger, pin toggle, larger size, visual separation.

---

## 2. Functional Requirements Mapping

| FR | Component | Layer |
|----|-----------|-------|
| FR-001: Library is standalone view | `App.tsx` | Frontend |
| FR-002: Library grid of album cards | `LibraryView.tsx` | Frontend |
| FR-003: Cover = first image from ZIP (sorted asc) | `AlbumCard.tsx` + `get_album_cover` | Frontend + Rust |
| FR-004: Cover preserves aspect ratio | `App.css` `.album-cover` | Frontend CSS |
| FR-005: Card shows title + image count | `AlbumCard.tsx` | Frontend |
| FR-006: Import button only on library | `LibraryView.tsx` (stays); `ViewerScreen` (no Import) | Frontend |
| FR-007: Delete removes catalog only | `lib.rs` `delete_album` | Rust |
| FR-008: ZIP never deleted | `lib.rs` `delete_album` | Rust |
| FR-009: Viewer is standalone view | `ViewerScreen.tsx` | Frontend |
| FR-010: Viewer has Back button | `ViewerScreen.tsx` | Frontend |
| FR-011: Zoom+pan with boundary clamp | `ViewerScreen.tsx` | Frontend |
| FR-012: Viewer bg matches theme | `App.css` `.album-viewer` / CSS vars | Frontend CSS |
| FR-013: Viewer shows current album only | `ViewerScreen.tsx` (single session prop) | Frontend |
| FR-014: Strip hidden by default | `ViewerScreen.tsx` initial state | Frontend |
| FR-015: Strip shows on hover zone enter | `ViewerScreen.tsx` hover zone events | Frontend |
| FR-016: Strip hides on hover zone leave | `ViewerScreen.tsx` hover zone events | Frontend |
| FR-017: Toggle button for strip | `ViewerScreen.tsx` | Frontend |
| FR-018: Toggle pin persists across nav | `libraryStore.thumbnailStripPinned` | Frontend store |
| FR-019: Strip visually separated | `App.css` gap/border | Frontend CSS |
| FR-020: Narrow hover zone when hidden | `ViewerScreen.tsx` always-visible bar | Frontend |
| FR-021: Strip larger than before | `App.css` thumbnail card sizing | Frontend CSS |

---

## 3. Technical Architecture

```
┌─────────────────────────────────────────┐
│                App.tsx                  │
│  viewerSession?                         │
│   null  → <LibraryView />               │
│   !null → <ViewerScreen />              │
│  (SettingsFAB + SettingsSidePanel       │
│   are global overlays on both screens)  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           LibraryView                   │
│  Toolbar: [Sort | Import ZIP]           │
│  AlbumGrid:                             │
│    AlbumCard × N                        │
│      ↳ lazy: getAlbumCover(albumId)     │
│      ↳ cover image (ZIP first file)     │
│      ↳ title, image count              │
│      ↳ [Open] [Delete]                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               ViewerScreen                          │
│  Header: [← Back]  Album title  1 / 42             │
│  ImageFrame (theme-bg CSS var)                      │
│    [+ − ○ zoom controls]                            │
│    <img transform="translate pan scale" />          │
│    pointer-capture drag → clamp pan                 │
│  ActionBar: [◀ Prev] [⊞ Thumbnails] [▶ Next]       │
│  ThumbnailStrip (visible = pinned‖hoverVisible)     │
│  HoverZone (16px bar, always visible)               │
└─────────────────────────────────────────────────────┘

┌───────────────────────────────────┐
│  infrastructure/tauri.ts          │
│  getAlbumCover(albumId)  ← NEW    │
│  deleteAlbum(albumId)             │
│  ... all others unchanged         │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│  Rust lib.rs                      │
│  get_album_cover()       ← NEW    │
│  delete_album()          ← FIXED  │
│                                   │
│  ZipService                       │
│  sort ascending          ← FIXED  │
└───────────────────────────────────┘
```

### Frontend responsibilities
- Derive active view from `viewerSession` in store; render library or viewer
- Lazy-load album covers per `AlbumCard` on mount via `getAlbumCover`
- Manage `panOffset` and `hoverVisible` in local component state
- Attach keyboard shortcuts in `ViewerScreen` on mount; detach on unmount
- Apply theme via CSS custom properties on `:root`

### Backend (Rust) responsibilities
- Load cover image (sorted index 0) from ZIP — `get_album_cover`
- Remove album from catalog without touching the ZIP — `delete_album` (fixed)
- Sort image filenames ascending on all ZIP operations — `ZipService`
- All existing image loading, import, settings, progress persistence (unchanged)

### Shared models (TypeScript ↔ Rust)
- `GetAlbumCoverRequest` / `GetAlbumCoverResponse` — new
- `DeleteAlbumResponse` — unchanged shape; behavior changed in Rust
- All other types — unchanged

### Infrastructure services
- `tauri.ts` — add `getAlbumCover()` thin wrapper
- `ZipService` — the only service that reads ZIP bytes (unchanged role)

---

## 4. Components to Implement

### 4.1 App.tsx — MODIFY

Replace `<LibraryView />` unconditional render with conditional:

```tsx
const viewerSession = useLibraryStore((s) => s.viewerSession);
// ...
{viewerSession
  ? <ViewerScreen />
  : <LibraryView startupWarnings={startupWarnings} rememberLastAlbum={rememberLastAlbum} />
}
```

`SettingsFAB` and `SettingsSidePanel` remain outside the conditional (visible on both screens).

---

### 4.2 LibraryView.tsx — MODIFY

Remove:
- `{viewerSession && <ImageViewer ... />}` conditional block
- All viewer-related state and handlers (`handlePrevious`, `handleNext`, `handleThumbnailSelect`, `shortcutError`, keyboard shortcut `useEffect`)
- Props flowing into `ImageViewer`

Keep:
- Album grid, toolbar (Sort + Import ZIP), loading/error states
- `selectedAlbumId` local state and `handleOpen` / `handleDelete`
- `pendingDeleteId` and `pendingImportTitle` feedback messages

---

### 4.3 AlbumCard.tsx — MODIFY

**Lazy cover loading**:
```tsx
const [cover, setCover] = useState<{ data: string | null; loading: boolean; error: boolean }>(
  { data: null, loading: true, error: false }
);

useEffect(() => {
  let cancelled = false;
  getAlbumCover({ album_id: album.id })
    .then((resp) => { if (!cancelled) setCover({ data: resp.image_source, loading: false, error: false }); })
    .catch(() => { if (!cancelled) setCover({ data: null, loading: false, error: true }); });
  return () => { cancelled = true; };
}, [album.id]);
```

Render: `<img src={cover.data ?? undefined} />` with a skeleton `<div>` while `cover.loading`.

**Delete dialog text**: Change from `"Delete this album and its ZIP file?"` to `"Remove this album from the library?"`.

---

### 4.4 ViewerScreen.tsx — NEW

**Location**: `src/features/viewer/components/ViewerScreen.tsx`

**Data**: Reads from `useLibraryStore` (same fields as `ImageViewer` previously received as props):
- `viewerSession`, `viewerImage`, `viewerLoading`, `viewerError`
- `zoomLevel`, `thumbnailStripPinned`, `thumbnailCache`
- Actions: `goToImage`, `closeViewer`, `setZoomLevel`, `setThumbnailStripPinned`, `loadThumbnailImage`

**Local state**:
- `panOffset: { x: number, y: number }` — reset to `{0,0}` on image navigation
- `hoverVisible: boolean` — controlled by hover zone events
- `prevImageSize: { width, height } | null` — for skeleton aspect ratio
- `isDragging: React.MutableRefObject<boolean>` — no re-render needed
- `dragStart: React.MutableRefObject<{x,y,panX,panY}>`

**Structure**:
```
<section className="viewer-screen">
  <header>
    <button onClick={closeViewer}>← Back</button>
    <h2>{session.album_name}</h2>
    <span>{session.current_index + 1} / {session.total_images}</span>
  </header>

  <div ref={frameRef} className="album-viewer-image-frame"
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
  >
    <div className="viewer-zoom-controls"> ... </div>
    {/* skeleton / image */}
    <img style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})` }} />
  </div>

  <div className="album-viewer-actions">
    <button onClick={prev}>Previous</button>
    <button onClick={toggleStrip}>Thumbnails</button>
    <button onClick={next}>Next</button>
  </div>

  <div className="viewer-thumbnail-area">
    <div className={`thumbnail-strip-wrapper thumbnail-strip-wrapper--${visible ? 'visible' : 'hidden'}`}>
      <ThumbnailStrip ... visible={visible} />
    </div>
    <div className="thumbnail-hover-zone"
      onMouseEnter={() => setHoverVisible(true)}
      onMouseLeave={() => setHoverVisible(false)}
    />
  </div>
</section>
```

**Pan clamp logic**:
```ts
function clampPan(dx: number, dy: number, frameRef, naturalW, naturalH, zoom): { x, y } {
  const frame = frameRef.current.getBoundingClientRect();
  const maxX = Math.max(0, (naturalW * zoom - frame.width) / 2);
  const maxY = Math.max(0, (naturalH * zoom - frame.height) / 2);
  return {
    x: Math.max(-maxX, Math.min(dx, maxX)),
    y: Math.max(-maxY, Math.min(dy, maxY)),
  };
}
```

**Keyboard shortcuts** (moved from LibraryView): `ArrowLeft/Right`, `Home/End`, `f` (fullscreen), `Escape` (exit fullscreen) — only active while viewer is mounted.

---

### 4.5 ThumbnailStrip.tsx — MOVE

Move file from `src/features/library/components/ThumbnailStrip.tsx` to `src/features/viewer/components/ThumbnailStrip.tsx`. No logic changes. Update all import paths.

---

## 5. Data Model

See [data-model.md](./data-model.md) for full entity definitions.

| Entity | Change |
|--------|--------|
| `GetAlbumCoverRequest` | NEW |
| `GetAlbumCoverResponse` | NEW |
| `AlbumCoverState` | NEW — local React state in `AlbumCard` |
| `PanOffset` | NEW — local React state in `ViewerScreen` |
| `AlbumSummary` | NO schema change |
| `DeleteAlbumResponse` | No shape change; behavior changed |

---

## 6. State Management

### libraryStore.ts — NO new fields

`viewerSession !== null` is used by `App.tsx` to derive the active screen — no new field needed.

`thumbnailStripPinned` already exists and is used unchanged.

### Local component state

| Component | State | Purpose |
|-----------|-------|---------|
| `AlbumCard` | `cover: { data, loading, error }` | Per-card cover image |
| `ViewerScreen` | `panOffset: { x, y }` | Image pan position |
| `ViewerScreen` | `hoverVisible: boolean` | Thumbnail strip hover trigger |
| `ViewerScreen` | `prevImageSize: { w, h } \| null` | Skeleton aspect ratio |

---

## 7. Rust Services

### 7.1 ZipService — MODIFY

**`inspect_album_checked`**: Sort after collecting:
```rust
image_entries.sort_unstable();  // already lowercased strings
```

**`load_image_by_index`**: Sort before indexing:
```rust
supported_entries.sort_unstable_by(|a, b| a.1.to_lowercase().cmp(&b.1.to_lowercase()));
```

### 7.2 lib.rs — new `get_album_cover` command

New types:
```rust
#[derive(Debug, Deserialize)]
pub struct GetAlbumCoverRequest { pub album_id: String }

#[derive(Debug, Serialize)]
pub struct GetAlbumCoverResponse {
    pub album_id: String,
    pub image_source: String,
    pub mime_type: String,
}
```

Command body: load catalog → find album path → call `ZipService::load_image_by_index(path, 0)` → return response. All errors mapped to `Err(String)`.

Register in `tauri::generate_handler![..., get_album_cover]`.

### 7.3 lib.rs — fix `delete_album` command

Remove these two lines from the `if let Some(album)` branch:
```rust
let album_path = PathBuf::from(&album.path);
FileSystemService::delete_file(&album_path).map_err(|err| err.to_string())?;
```

---

## 8. CSS Changes (`App.css`)

### CSS custom properties (theme tokens)

Add to `:root` and `:root[data-theme="dark"]`:
```css
:root {
  --color-bg: #f6f6f6;
  --color-surface: #ffffff;
  --color-border: #e5e7eb;
}
:root[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-surface: #111827;
  --color-border: #334155;
}
```

### Viewer screen background

Replace hardcoded `#f1f5f9` and `#ffffff` in `.album-viewer` and `.album-viewer-image-frame`:
```css
.album-viewer-image-frame {
  background: var(--color-surface);
}
```

### Album cover aspect ratio

```css
.album-cover {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: #ececec;
  border-radius: 8px;
  overflow: hidden;
}
.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Thumbnail strip — larger cards

```css
.thumbnail-card {
  width: 140px;   /* up from 96px */
  height: 100px;  /* up from 64px */
}
```

### Thumbnail hover zone and wrapper

```css
.viewer-thumbnail-area { position: relative; flex-shrink: 0; }

.thumbnail-strip-wrapper {
  overflow: hidden;
  transition: max-height 0.2s ease, opacity 0.15s ease;
}
.thumbnail-strip-wrapper--visible {
  max-height: 140px;
  opacity: 1;
  border-top: 1px solid var(--color-border);
  padding-top: 0.5rem;
}
.thumbnail-strip-wrapper--hidden {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.thumbnail-hover-zone {
  height: 16px;
  width: 100%;
  cursor: default;
}
```

---

## 9. File System Interactions

All filesystem access is routed through Rust services only.

| Operation | Route |
|-----------|-------|
| Read cover image from ZIP | `get_album_cover` → `ZipService::load_image_by_index` |
| Remove album from catalog | `delete_album` → `MetadataService::remove_album` (ZIP untouched) |
| Read viewer image | `load_album_image` → `ZipService::load_image_by_index` (unchanged) |
| Import album | `import_album` → `FileSystemService` + `ZipService` + `MetadataService` (unchanged) |

`FileSystemService::delete_file` is **never** called by `delete_album`.

---

## 10. Error Handling

| Scenario | Behavior |
|----------|----------|
| `get_album_cover` fails (ZIP missing, corrupted) | `AlbumCard` shows placeholder icon; no app error state polluted |
| `delete_album` fails | `libraryStore.error` set; shown via existing error paragraph in `LibraryView` |
| Pan attempted at zoom = 1 | `onPointerDown` guards: `if (zoomLevel <= 1) return` |
| Image navigation resets pan | `goToImage` side-effect in `ViewerScreen`: call `setPanOffset({x:0,y:0})` after successful navigation |
| Cover load race (album deleted mid-request) | Error path sets placeholder; album card may disappear from store update shortly after |

---

## 11. Testing Strategy

### Rust tests (`cargo test`)

| Test | File | Assertion |
|------|------|-----------|
| `get_album_cover_returns_first_sorted_image` | `lib.rs` | ZIP with `01.png` and `00.png`; response `image_source` matches `00.png` bytes |
| `delete_album_does_not_delete_zip_file` | `lib.rs` | After `delete_album`, ZIP still exists; catalog entry removed |
| `zip_service_image_index_zero_is_alphabetically_first` | `zip_service.rs` | ZIP with unordered entries; `load_image_by_index(path, 0)` → alphabetically-first file |

### React tests (Vitest + Testing Library)

| Test | File | Assertion |
|------|------|-----------|
| `AlbumCard loads cover from getAlbumCover` | `AlbumCard.test.tsx` | Mock `tauri.ts`; verify `<img src>` equals mocked data URL |
| `AlbumCard shows placeholder on error` | `AlbumCard.test.tsx` | Mock rejection; verify placeholder element present |
| `LibraryView does not render viewer elements` | `LibraryView.test.tsx` | Verify "Back" and zoom buttons absent from library DOM |
| `ViewerScreen renders Back button` | `ViewerScreen.test.tsx` | Verify Back button present; click calls `closeViewer` |
| `ViewerScreen: strip hidden on mount` | `ViewerScreen.test.tsx` | Wrapper has `--hidden` class initially |
| `ViewerScreen: strip shows on hover zone enter` | `ViewerScreen.test.tsx` | `fireEvent.mouseEnter` on hover zone → wrapper has `--visible` class |
| `ViewerScreen: toggle pins strip` | `ViewerScreen.test.tsx` | Click Thumbnails → strip visible; `mouseLeave` → still visible |

### Manual validation

See all 8 scenarios in [quickstart.md](./quickstart.md).

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cover load latency for 100+ album library | Medium | Visible lag | Skeleton renders immediately; covers load async in parallel; `IntersectionObserver` gating is future option |
| Pan boundary drift after window resize | Low | Minor UX glitch | Recalculate from `getBoundingClientRect()` on each `pointerDown` event |
| Hover zone triggers strip while scrolling thumbnail | Low | Confusing | Hover zone is below the strip; strip receives `onMouseLeave` before zone; ordering handled by DOM structure |
| Existing tests break on `ThumbnailStrip` move | Medium | CI failure | Update import paths in `library/index.ts` and any test files importing from old path |
| `delete_album` Rust change breaks test at line 1026 | High | CI failure | Existing test `delete_album_returns_false_for_unknown_album_id` passes; test at line 1080 (`delete_album_returns_success`) must be updated to NOT assert file removal |

---

## 13. Future Extensibility

- **`IntersectionObserver` gating**: Gate `getAlbumCover` to only fire when the card scrolls into view — important for 200+ album libraries.
- **Cover cache in store**: If re-renders cause redundant cover fetches, a `Map<albumId, dataUrl>` in `libraryStore` prevents redundancy without breaking the lazy contract.
- **Animated viewer transitions**: Slide/fade between images can be added to `ViewerScreen` without touching any data layer.
- **Natural sort for filenames**: Upgrade `ZipService` sort to numeric-aware (natural sort) for albums with inconsistent zero-padding.
- **Pinch-to-zoom**: The pointer events API already supports multi-touch; `onPointerDown` can detect two-finger events to add pinch zoom.
- **React Router migration**: If deep-linking or multi-window is ever needed, the `viewerSession`-derived conditional render is trivially replaceable with a `<Route>`.

