# Implementation Plan: Improve UI Navigation Experience

**Branch**: `009-improve-ui` | **Date**: 2026-07-10 | **Spec**: [spec.md](spec.md)

---

## 1. Feature Overview

This feature improves the navigation and visual experience of the album viewer desktop application across five areas:

1. **Settings FAB** — Replace the inline settings panel with a floating action button (FAB) fixed to the bottom-right corner of the screen.
2. **Settings Side Panel** — Display all settings in a slide-in side panel triggered by the FAB, with multiple dismiss gestures.
3. **Thumbnail Strip Redesign** — Reduce the strip height, auto-hide on mouse leave, and add a manual pin/unpin toggle.
4. **Image Viewer Improvements** — Preserve aspect ratio during navigation, show a skeleton during loading, increase the image display area, and add zoom controls.
5. **Album Card Uniformity** — Enforce uniform card dimensions and a consistent cover-image aspect ratio across the album grid.

All changes are **frontend-only**. No new Tauri commands are required.

---

## 2. Functional Requirements

| ID | Requirement | Story |
|----|-------------|-------|
| FR-001 | FAB with gear icon always visible at bottom-right | US-001 |
| FR-002 | FAB visible and styled correctly in light and dark themes | US-001 |
| FR-003 | FAB does not overlap the main image display area | US-001 |
| FR-004 | Existing inline settings section removed from layout | US-001 |
| FR-005 | Settings side panel opens on FAB click | US-002 |
| FR-006 | Side panel contains all existing settings | US-002 |
| FR-007 | Side panel closes on X button click | US-002 |
| FR-008 | Side panel closes on backdrop click | US-002 |
| FR-009 | Side panel closes on ESC key press | US-002 |
| FR-010 | Thumbnail strip height reduced (≤ 64px cards) | US-003 |
| FR-011 | Thumbnail strip hidden by default; shown on hover | US-003 |
| FR-012 | Thumbnail strip hides on mouse leave | US-003 |
| FR-013 | Toggle button pins/unpins strip visibility | US-003 |
| FR-014 | Viewer preserves aspect ratio on image change | US-004 |
| FR-015 | Skeleton shown during image load (sized to previous image) | US-004 |
| FR-016 | Image occupies more vertical space (80vh frame) | US-004 |
| FR-017 | Zoom-in, zoom-out, and zoom-reset buttons in viewer top-right | US-004 |
| FR-018 | All album cards same fixed size in the grid | US-005 |
| FR-019 | Album cover is first image (cover_data already populated) | US-005 |
| FR-020 | All album covers rendered at 3:4 aspect ratio | US-005 |

---

## 3. Technical Architecture

### Responsibilities

| Layer | Responsibility |
|-------|---------------|
| **Frontend — React** | All visual components, layout, hover/zoom/panel state |
| **Frontend — Zustand** | Viewer state extensions (`zoomLevel`, `thumbnailStripPinned`) |
| **Frontend — CSS** | Transitions, fixed positioning, aspect-ratio, grid uniformity |
| **Backend — Rust** | No changes. Existing commands unchanged. |
| **Infrastructure** | No changes. Filesystem access routes unchanged. |

### Architecture Decisions

**No new Tauri commands.** Album cover data is already returned by `get_library()` via `AlbumSummary.cover_data`. Image loading continues through `load_album_image`. All other features are pure layout and interaction changes.

**No new abstractions.** The side panel wraps the existing `SettingsPanel` component. The new `ImageViewer` component is an extraction of inline JSX from `LibraryView`, not a new architectural layer.

**FAB open/close state lives in `App.tsx`** as a `useState<boolean>`. It does not belong in a Zustand store — it is UI state with no cross-component consumer beyond `SettingsFAB` and `SettingsSidePanel`, which are siblings in `App.tsx`.

---

## 4. Components to Implement

| Component | Action | Location |
|-----------|--------|----------|
| `SettingsFAB` | Create new | `src/features/settings/components/SettingsFAB.tsx` |
| `SettingsSidePanel` | Create new | `src/features/settings/components/SettingsSidePanel.tsx` |
| `ImageViewer` | Create new (extract from LibraryView) | `src/features/library/components/ImageViewer.tsx` |
| `ThumbnailStrip` | Modify | `src/features/library/components/ThumbnailStrip.tsx` |
| `LibraryView` | Modify | `src/features/library/components/LibraryView.tsx` |
| `AlbumCard` | Modify | `src/features/library/components/AlbumCard.tsx` |
| `App` | Modify | `src/App.tsx` |
| `App.css` | Modify | `src/App.css` |

---

## 5. Data Model

### `libraryStore` — New Fields

```typescript
// Added to LibraryState
zoomLevel: number;              // Default: 1.0, Range: 0.25–4.0
thumbnailStripPinned: boolean;  // Default: false

// New actions
setZoomLevel: (level: number) => void;        // Clamps to [0.25, 4.0]
setThumbnailStripPinned: (pinned: boolean) => void;
```

**Reset rules**:
- `zoomLevel` → reset to `1.0` inside `openAlbumViewer()` and `goToImage()` (before loading the new image)
- `thumbnailStripPinned` → reset to `false` inside `closeViewer()`

### Component-Local State

**`ImageViewer`**:
```typescript
const [prevImageSize, setPrevImageSize] = useState<{width: number; height: number} | null>(null);
```
Updated in the `<img>` element's `onLoad` handler via `e.currentTarget.naturalWidth / naturalHeight`. Used to set the skeleton's `aspect-ratio` CSS while the next image loads.

**`App.tsx`**:
```typescript
const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
```

### Unchanged Types

All types in `src/shared/types/library.ts` remain unchanged. No Rust structs change.

---

## 6. State Management

### Zustand Store Changes — `libraryStore`

**File**: `src/features/library/store/libraryStore.ts`

```
State additions:
  zoomLevel: number = 1.0
  thumbnailStripPinned: boolean = false

Action additions:
  setZoomLevel(level) → clamp(level, 0.25, 4.0)
  setThumbnailStripPinned(pinned) → set pinned value

Modifications to existing actions:
  openAlbumViewer() → additionally set zoomLevel = 1.0
  goToImage()       → additionally set zoomLevel = 1.0
  closeViewer()     → additionally set thumbnailStripPinned = false
```

### No Settings Store Changes

The settings panel open/close state is local to `App.tsx`. The settings store (`settingsStore`) is unchanged.

---

## 7. Rust Services

**No changes required.** This feature has no Rust implementation work.

Existing commands consumed by the UI remain unchanged:

| Command | Consumer |
|---------|---------|
| `get_library` | Album grid (`LibraryView`) |
| `open_album_viewer` | Viewer session init (`libraryStore`) |
| `load_album_image` | Viewer image + thumbnails (`libraryStore`) |
| `update_user_settings` | Settings form (`SettingsPanel`) |
| `save_reading_progress` | Viewer close (`libraryStore`) |

---

## 8. React Components

### 8.1 `SettingsFAB`

**File**: `src/features/settings/components/SettingsFAB.tsx`

```
Props: { onClick: () => void }

Render:
  <button className="settings-fab" onClick={onClick} aria-label="Open settings">
    <SettingsIcon />   {/* SVG gear icon inline */}
  </button>

CSS:
  position: fixed
  bottom: 1.5rem
  right: 1.5rem
  z-index: 50
  width: 3rem
  height: 3rem
  border-radius: 50%
  background: accent color (theme-aware)
  box-shadow: elevation shadow
```

### 8.2 `SettingsSidePanel`

**File**: `src/features/settings/components/SettingsSidePanel.tsx`

```
Props: {
  isOpen: boolean
  onClose: () => void
  startupWarnings?: string[]
  rememberLastAlbum?: boolean
}

Render:
  {isOpen && (
    <>
      <div className="side-panel-backdrop" onClick={onClose} />
      <aside className="side-panel side-panel--open">
        <button className="side-panel-close" onClick={onClose} aria-label="Close settings">✕</button>
        <SettingsPanel startupWarnings={startupWarnings} rememberLastAlbum={rememberLastAlbum} />
      </aside>
    </>
  )}

Behavior:
  useEffect: add/remove keydown listener for 'Escape' → calls onClose
  Cleanup: remove listener on unmount or when isOpen changes to false
```

### 8.3 `App.tsx` — Updated

```
Remove: <SettingsPanel ... /> from render
Add:    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
Add:    <SettingsFAB onClick={() => setSettingsPanelOpen(true)} />
Add:    <SettingsSidePanel
          isOpen={settingsPanelOpen}
          onClose={() => setSettingsPanelOpen(false)}
          startupWarnings={startupWarnings}
          rememberLastAlbum={rememberLastAlbum}
        />
```

### 8.4 `ImageViewer` (extracted component)

**File**: `src/features/library/components/ImageViewer.tsx`

Extracted from the inline `{viewerSession && ...}` block in `LibraryView.tsx`.

```
Props: ImageViewerProps (see contracts/improve-ui-contracts.md)

Local state:
  prevImageSize: { width: number; height: number } | null

Render structure:
  <section className="album-viewer" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>

    <header className="album-viewer-header">
      <h3>{session.album_name}</h3>
      <p>{counter}</p>
      <div className="viewer-zoom-controls">   ← top-right of frame, absolute position
        <button onClick={onZoomIn}  aria-label="Zoom in">+</button>
        <button onClick={onZoomOut} aria-label="Zoom out">−</button>
        <button onClick={onZoomReset} aria-label="Reset zoom">↺</button>
      </div>
    </header>

    <div className="album-viewer-image-frame">
      {loading && prevImageSize && (
        <div
          className="image-skeleton"
          style={{ aspectRatio: `${prevImageSize.width}/${prevImageSize.height}` }}
        />
      )}
      {!loading && image && (
        <img
          src={image.image_source}
          alt={...}
          style={{ transform: `scale(${zoomLevel})` }}
          onLoad={(e) => setPrevImageSize({
            width: e.currentTarget.naturalWidth,
            height: e.currentTarget.naturalHeight
          })}
        />
      )}
    </div>

    <ThumbnailStrip visible={isHovered || thumbnailStripPinned} ... />

    <div className="album-viewer-actions">
      <button onClick={onPrev}>Previous</button>
      <button onClick={onToggleThumbnailStrip} aria-label="Toggle thumbnail strip">☰</button>
      <button onClick={onNext}>Next</button>
      <button onClick={onClose}>Close</button>
    </div>

  </section>

Hover logic:
  isHovered: boolean (local state)
  onMouseEnter → setIsHovered(true)
  onMouseLeave → setIsHovered(false)
```

### 8.5 `ThumbnailStrip` — Updated

**File**: `src/features/library/components/ThumbnailStrip.tsx`

```
New prop: visible: boolean

CSS change: Add transition-based show/hide via CSS class
  .thumbnail-strip { transition: opacity 0.2s, max-height 0.2s; }
  .thumbnail-strip--hidden { opacity: 0; max-height: 0; overflow: hidden; pointer-events: none; }
  .thumbnail-strip--visible { opacity: 1; max-height: 80px; }

Card height change:
  .thumbnail-card → height: 64px (was 96px implicit square)
  .thumbnail-preview → aspect-ratio: 1/1; height: 100%

Apply className based on visible prop:
  className={`thumbnail-strip ${visible ? 'thumbnail-strip--visible' : 'thumbnail-strip--hidden'}`}
```

### 8.6 `AlbumCard` — Updated

**File**: `src/features/library/components/AlbumCard.tsx`

```
No prop changes.

CSS changes:
  .album-cover img {
    width: 100%;
    aspect-ratio: 3/4;    ← was height: 140px
    object-fit: cover;
    height: unset;
  }
```

### 8.7 Album Grid CSS

**File**: `src/App.css`

```css
/* Uniform card sizing */
.album-list {
  grid-template-columns: repeat(auto-fill, minmax(180px, 180px));  /* was auto-fit */
  justify-content: start;
}
```

---

## 9. File System Interactions

No new file system interactions. All image loading continues through the existing `load_album_image` Tauri command routed through `libraryStore`. Album cover data is already loaded by `get_library()` and stored in `AlbumSummary.cover_data`.

---

## 10. Error Handling

| Scenario | Handling |
|----------|---------|
| `cover_data` is null | `AlbumCard` falls back to existing `/vite.svg` placeholder — unchanged behavior |
| Image load fails in viewer | Existing `viewerError` state in `libraryStore` displays error message — unchanged |
| ESC key listener throws | No-op; `try/catch` not needed for a `keydown` event handler |
| Zoom at boundary | `setZoomLevel` clamps silently — buttons become visually disabled at limits (optional CSS: `opacity: 0.4` when at boundary) |
| Side panel ESC while panel already closed | `isOpen` guard in the effect prevents calling `onClose` when panel is not open |

---

## 11. Testing Strategy

### Unit Tests (Vitest + Testing Library)

| Test | File |
|------|------|
| `SettingsFAB` renders gear icon; calls `onClick` | `src/test/SettingsFAB.test.tsx` |
| `SettingsSidePanel` opens/closes on X, backdrop click, ESC | `src/test/SettingsSidePanel.test.tsx` |
| `ImageViewer` shows skeleton when `loading=true` with `prevImageSize` | `src/test/ImageViewer.test.tsx` |
| `ImageViewer` zoom: in/out/reset buttons call correct callbacks | `src/test/ImageViewer.test.tsx` |
| `ThumbnailStrip` applies `--hidden` class when `visible=false` | `src/test/ThumbnailStrip.test.tsx` |
| `libraryStore`: `setZoomLevel` clamps to 0.25–4.0 | `src/test/libraryStore.test.ts` |
| `libraryStore`: `goToImage` resets zoom to 1.0 | `src/test/libraryStore.test.ts` |
| `libraryStore`: `closeViewer` resets `thumbnailStripPinned` | `src/test/libraryStore.test.ts` |

### Manual / Visual Validation

Use the [quickstart.md](quickstart.md) step-by-step guide to validate all 5 user stories end-to-end via `pnpm tauri dev`.

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| FAB overlaps viewer controls on small windows | Medium | Low | Set `z-index` hierarchy correctly; verify at 800×600px |
| Skeleton aspect-ratio unavailable on first image load | Low | Low | `prevImageSize` starts null; show a generic loading text instead of skeleton on first load only |
| Zoom + scroll interaction confusing when zoomed in | Medium | Medium | Limit zoom to 4× max; ensure `overflow: auto` on the image frame when `zoomLevel > 1` |
| `max-height` transition on ThumbnailStrip causes jank | Low | Low | Use a fixed `max-height: 80px` (known value) not `max-height: auto` — avoids browser inconsistencies |
| Album grid `justify-content: start` leaves ragged right edge | Low | Low | Acceptable tradeoff for uniform card size; alternative: keep `space-evenly` |

---

## 13. Future Extensibility

These are deferred concerns — not part of this implementation:

- **Pinch-to-zoom** for trackpad/touch — zoom state infrastructure is already in place; gesture handling can be added later.
- **Persisted thumbnail strip pin** — currently resets on app restart; could be added to `UserSettings` if users request it.
- **Settings panel width preference** — side panel currently fixed width (360px); could be user-resizable.
- **Custom album cover** — `cover_index` field already exists in `AlbumSummary`; a future "set cover" UI could write a different index without any model changes.
- **Keyboard zoom shortcuts** (`+`/`-` keys) — the `ShortcutGesture` type in the keyboard shortcuts feature can be extended to include zoom actions.

---

## Project Structure

### Documentation

```text
specs/009-improve-ui/
├── plan.md              ← this file
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── improve-ui-contracts.md
└── tasks.md             ← generated by /speckit.tasks
```

### Source Code Changes

```text
src/
├── App.tsx                                               ← modified
├── App.css                                               ← modified
└── features/
    ├── settings/
    │   └── components/
    │       ├── SettingsPanel.tsx                         ← unchanged
    │       ├── SettingsFAB.tsx                           ← NEW
    │       └── SettingsSidePanel.tsx                     ← NEW
    └── library/
        ├── store/
        │   └── libraryStore.ts                           ← modified (zoomLevel, thumbnailStripPinned)
        └── components/
            ├── LibraryView.tsx                           ← modified (use ImageViewer, remove inline viewer)
            ├── ImageViewer.tsx                           ← NEW (extracted + enhanced)
            ├── ThumbnailStrip.tsx                        ← modified (visible prop, reduced height)
            └── AlbumCard.tsx                             ← modified (aspect-ratio cover image)
```

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline First | ✅ Pass | No network calls introduced |
| II. ZIP is Source of Truth | ✅ Pass | No ZIP modifications |
| III. Read-Only Albums | ✅ Pass | No album edits |
| IV. Simple Architecture | ✅ Pass | Existing components refactored, minimal new abstractions |
| V. Separation of Responsibilities | ✅ Pass | All new code is presentation-layer only |
| VI. Local Persistence | ✅ Pass | No new persisted data; zoom and pin state are runtime-only |
| VII. Lazy Loading | ✅ Pass | Image loading pattern unchanged |
| VIII. Performance | ✅ Pass | CSS transitions only; no blocking operations added |
| IX. Error Handling | ✅ Pass | Existing error patterns preserved |
| X. Cross Platform | ✅ Pass | Pure CSS/React changes; no platform-specific code |

## Complexity Tracking

No constitution violations. No complexity justification required.
