# Implementation Plan: Image Viewer Improvements

**Branch**: `011-image-viewer-improvements` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-image-viewer-improvements/spec.md`

## Summary

Fix and polish the image viewer: add bounded zoom controls (0.5×–4.0×), reset zoom and pan position on every image navigation, make loading skeletons theme-aware, redesign the thumbnail strip with portrait-oriented cards and hover-only reveal, and restructure viewer layout so the Back button lives above the image display area and navigation buttons are centered below it.

All changes are **frontend-only** (React + CSS). No new Tauri commands. No Rust changes. No new dependencies. No database.

---

## Technical Context

**Language/Version**: Rust 1.x (Tauri 2), TypeScript 5.8, React 19

**Primary Dependencies**: Tauri 2, React, Zustand 5, Vite 7, plain CSS

**Storage**: JSON catalog (`albums_catalog.json`) — no changes

**Testing**: `vitest run` (TypeScript / Testing Library), `cargo test` (Rust — no changes)

**Target Platform**: Windows, macOS, Linux (Tauri desktop)

**Project Type**: Desktop application

**Performance Goals**: Zoom step respond < 16 ms; pan response < 16 ms (60 fps); thumbnail strip show/hide < 200 ms

**Constraints**: Offline only; ZIP files never modified; no preloading entire albums

**Scale/Scope**: Viewer shows one album at a time; typical album 20–400 images

---

## Constitution Check

*Evaluated against `.specify/memory/constitution.md`*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline First | ✅ Pass | No network calls; all changes are local UI |
| II. ZIP is Source of Truth | ✅ Pass | No ZIP manipulation; reading unchanged |
| III. Read-Only Albums | ✅ Pass | No album mutation |
| IV. Simple Architecture | ✅ Pass | No new abstractions; surgical fixes to existing components |
| V. Separation of Responsibilities | ✅ Pass | CSS handles cursor; React handles state; Rust untouched |
| VI. Local Persistence | ✅ Pass | No new persistence; `thumbnailStripPinned` already in store |
| VII. Lazy Loading | ✅ Pass | Thumbnail loading unchanged; no preloading added |
| VIII. Performance | ✅ Pass | Cursor via CSS `:active` avoids re-renders on pointer events |
| IX. Error Handling | ✅ Pass | Existing error paths unchanged |
| X. Cross Platform | ✅ Pass | Pointer Events API and CSS `:active` are cross-platform |

**No violations. No Complexity Tracking needed.**

---

## Project Structure

### Documentation (this feature)

```text
specs/011-image-viewer-improvements/
├── plan.md                                # This file
├── research.md                            # Phase 0 decisions
├── data-model.md                          # State and entity definitions
├── quickstart.md                          # Validation scenarios
├── contracts/
│   └── image-viewer-commands.md           # Existing commands referenced (none new)
├── checklists/
│   └── requirements.md
└── tasks.md                               # Created by /speckit.tasks
```

### Source Code (modified files only)

```text
src/
├── App.css                                # MODIFY — skeleton theming, thumbnail portrait,
│                                          #   back-btn theme, action-bar centering,
│                                          #   zoom cursor CSS, layout classes
└── features/
    └── viewer/
        └── components/
            └── ViewerScreen.tsx           # MODIFY — zoom bounds, nav reset, JSX restructure
```

**No new files. No Rust changes. No store changes.**

---

## 1. Feature Overview

Four targeted improvements to the image viewer, all in the frontend layer:

| Story | Problem | Fix |
|-------|---------|-----|
| US-001 Zoom | No zoom bounds; cursor always `grab` | Clamp to [0.5, 4.0]; CSS `:active` for `grabbing` |
| US-002 Image change | Zoom and pan carry over on navigation; skeleton ignores theme | Reset both on all navigation paths; add dark skeleton override |
| US-003 Thumbnail strip | Thumbnails landscape-oriented; strip overlaps image layout | Portrait card shape (3:4); hover-only reveal without layout shift |
| US-004 Button layout | Back inside viewer card; actions right-aligned | Back in `viewer-top-bar` above image; actions centered below |

---

## 2. Functional Requirements Mapping

| FR | Component | Layer |
|----|-----------|-------|
| FR-001: `+` increases zoom by step | `ViewerScreen.tsx` click handler | Frontend |
| FR-002: `−` decreases zoom; min bound 0.5 | `ViewerScreen.tsx` click handler | Frontend |
| FR-003: Reset zoom to 1.0, center | `ViewerScreen.tsx` reset handler | Frontend |
| FR-004: Pan while zoomed in; bounded | `ViewerScreen.tsx` pointer handlers | Frontend |
| FR-005: Image centered when fits viewport | `App.css` `.album-viewer-image-frame` `place-items: center` | CSS (already working) |
| FR-006: Zoom resets on image change | `ViewerScreen.tsx` all nav handlers | Frontend |
| FR-007: Pan resets on image change | `ViewerScreen.tsx` all nav handlers | Frontend |
| FR-008: Skeleton matches active theme | `App.css` dark theme override | CSS |
| FR-009: Strip hidden by default | `ViewerScreen.tsx` initial state | Frontend (already working) |
| FR-010: Strip visible on hover zone | `ViewerScreen.tsx` hover zone events | Frontend (already working) |
| FR-011: Strip hides on hover leave | `ViewerScreen.tsx` hover zone events | Frontend (already working) |
| FR-012: Thumbnails portrait shape | `App.css` `.thumbnail-card`, `.thumbnail-preview` | CSS |
| FR-013: Strip toggle does not resize image | `App.css` layout structure + fixed frame height | CSS |
| FR-014: Back button outside image area | `ViewerScreen.tsx` JSX restructure | Frontend |
| FR-015: Back button adapts to theme | `App.css` dark theme override | CSS |
| FR-016: Prev/Next/Thumbnails centered | `App.css` `.album-viewer-actions` | CSS |
| FR-017: Prev/Next/Thumbnails outside image | `ViewerScreen.tsx` JSX restructure | Frontend |

---

## 3. Technical Architecture

```
┌──────────────────────────────────────────────┐
│            viewer-screen-shell               │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         viewer-top-bar (NEW)           │  │
│  │  [← Back]  Album title  1 / 42        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │       .album-viewer (image only)       │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  .album-viewer-image-frame       │  │  │
│  │  │  [+ − ○]  (zoom controls)        │  │  │
│  │  │  <img transform=translate+scale> │  │  │
│  │  │  or <div.image-skeleton>         │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │     .viewer-thumbnail-area             │  │
│  │       thumbnail-strip-wrapper          │  │
│  │         ThumbnailStrip (portrait)      │  │
│  │       thumbnail-hover-zone             │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │   .album-viewer-actions (centered)     │  │
│  │   [◀ Prev]  [⊞ Thumbnails]  [▶ Next]  │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘

No Rust layer changes.
No store changes.
```

### Frontend responsibilities

- Enforce zoom bounds [0.5, 4.0] in component click handlers before calling `setZoomLevel`.
- Reset `zoomLevel` (via `setZoomLevel(1)`) and `panOffset` (via `setPanOffset({x:0,y:0})`) in **every** navigation handler: `handlePrev`, `handleNext`, and keyboard shortcut `useEffect` (all four keys: ArrowLeft, ArrowRight, Home, End).
- Restructure JSX: move `<header>` with Back button to a `viewer-top-bar` div wrapping the `.album-viewer` section from the outside.
- Apply `album-viewer-image-frame--zoomed` CSS class when `zoomLevel > 1` to enable grab/grabbing cursor via `:active`.

### Backend (Rust) responsibilities

- **None.** Zero changes to Rust code.

### Shared models (TypeScript ↔ Rust)

- **None.** No new types. All existing types unchanged.

### Infrastructure services

- **None.** `tauri.ts` is unchanged. No new Tauri commands.

---

## 4. Components to Implement

### 4.1 ViewerScreen.tsx — MODIFY

**Location**: `src/features/viewer/components/ViewerScreen.tsx`

#### 4.1.1 Zoom bounds

Change the `+` and `−` click handlers:

```tsx
// Before
onClick={() => setZoomLevel(zoomLevel + 0.25)}
onClick={() => setZoomLevel(zoomLevel - 0.25)}

// After
const ZOOM_STEP = 0.25;
const ZOOM_MIN  = 0.5;
const ZOOM_MAX  = 4.0;

onClick={() => setZoomLevel(Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP))}
onClick={() => setZoomLevel(Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP))}
```

#### 4.1.2 Reset zoom in handlePrev / handleNext

```tsx
const handlePrev = () => {
  if (session.current_index > 0) {
    setZoomLevel(1);                 // ADD
    setPanOffset({ x: 0, y: 0 });
    void goToImage(session.current_index - 1);
  }
};

const handleNext = () => {
  if (session.current_index < session.total_images - 1) {
    setZoomLevel(1);                 // ADD
    setPanOffset({ x: 0, y: 0 });
    void goToImage(session.current_index + 1);
  }
};
```

#### 4.1.3 Reset zoom in keyboard shortcut handler

Inside the `useKeyDown` effect, add `setZoomLevel(1); setPanOffset({x:0, y:0})` before every `goToImage` call:

```ts
if (event.key === "ArrowLeft" && sessionCurrentIndex > 0) {
  event.preventDefault();
  setZoomLevel(1);
  setPanOffset({ x: 0, y: 0 });
  void goToImage(sessionCurrentIndex - 1);
} else if (event.key === "ArrowRight" && sessionCurrentIndex < sessionTotalImages - 1) {
  event.preventDefault();
  setZoomLevel(1);
  setPanOffset({ x: 0, y: 0 });
  void goToImage(sessionCurrentIndex + 1);
} else if (event.key === "Home" && sessionCurrentIndex !== 0) {
  event.preventDefault();
  setZoomLevel(1);
  setPanOffset({ x: 0, y: 0 });
  void goToImage(0);
} else if (event.key === "End" && sessionCurrentIndex !== sessionTotalImages - 1) {
  event.preventDefault();
  setZoomLevel(1);
  setPanOffset({ x: 0, y: 0 });
  void goToImage(sessionTotalImages - 1);
}
```

The `useEffect` dependency array must include `setZoomLevel` and `setPanOffset` (stable Zustand selector and `useState` setter respectively — no stale closure risk).

#### 4.1.4 Drag cursor via CSS class

Replace the inline cursor style with a CSS class toggle:

```tsx
// Before
style={{ cursor: zoomLevel > 1 ? "grab" : "default" }}

// After
className={`album-viewer-image-frame${zoomLevel > 1 ? " album-viewer-image-frame--zoomed" : ""}`}
// Remove inline cursor style
```

The `.album-viewer-image-frame--zoomed` and `.album-viewer-image-frame--zoomed:active` rules are added in CSS (section 4.2).

#### 4.1.5 JSX restructure — Back button outside `.album-viewer`

```tsx
// New top-level structure:
return (
  <div className="viewer-screen-shell">
    {/* TOP BAR — outside the viewer image section */}
    <div className="viewer-top-bar">
      <button
        type="button"
        className="viewer-back-btn"
        onClick={() => void closeViewer()}
        aria-label="Back to library"
      >
        ← Back
      </button>
      <h3>{session.album_name}</h3>
      <p className="album-viewer-counter">{counter}</p>
    </div>

    {/* IMAGE SECTION — the "visor" */}
    <section className="album-viewer" aria-label="Album viewer">
      <div
        ref={frameRef}
        className={`album-viewer-image-frame${zoomLevel > 1 ? " album-viewer-image-frame--zoomed" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="viewer-zoom-controls">
          <button type="button" onClick={handleZoomIn}  aria-label="Zoom in"    title="Zoom in">+</button>
          <button type="button" onClick={handleZoomOut} aria-label="Zoom out"   title="Zoom out">−</button>
          <button type="button" onClick={handleZoomReset} aria-label="Reset zoom" title="Reset zoom">○</button>
        </div>
        {loading && prevImageSize && <div className="image-skeleton" style={skeletonStyle} />}
        {loading && !prevImageSize && <p>Loading image...</p>}
        {!loading && image && (
          <img
            src={image.image_source}
            alt={`${session.album_name} page ${session.current_index + 1}`}
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`, transformOrigin: "center" }}
            onLoad={(e) => setPrevImageSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
          />
        )}
      </div>
      {error && <p className="error-message">{error}</p>}
    </section>

    {/* THUMBNAIL STRIP — below image, above actions */}
    <div className="viewer-thumbnail-area">
      <div className={`thumbnail-strip-wrapper thumbnail-strip-wrapper--${thumbnailVisible ? "visible" : "hidden"}`}>
        <ThumbnailStrip
          albumId={session.album_id}
          totalImages={session.total_images}
          selectedIndex={session.current_index}
          thumbnailCache={thumbnailCache}
          onSelect={(index) => void goToImage(index)}
          loadThumbnailImage={loadThumbnailImage}
          visible={thumbnailVisible}
        />
      </div>
      <div
        className="thumbnail-hover-zone"
        onMouseEnter={() => setHoverVisible(true)}
        onMouseLeave={() => setHoverVisible(false)}
      />
    </div>

    {/* ACTION BUTTONS — outside viewer section, centered */}
    <div className="album-viewer-actions">
      <button type="button" onClick={handlePrev} disabled={disablePrevious}>Previous</button>
      <button
        type="button"
        onClick={() => setThumbnailStripPinned(!thumbnailStripPinned)}
        aria-label="Toggle thumbnail strip"
      >
        Thumbnails
      </button>
      <button type="button" onClick={handleNext} disabled={disableNext}>Next</button>
    </div>
  </div>
);
```

Extract the zoom handlers to named functions for clarity:

```tsx
const handleZoomIn    = () => setZoomLevel(Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP));
const handleZoomOut   = () => setZoomLevel(Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP));
const handleZoomReset = () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); };
```

---

### 4.2 App.css — MODIFY

#### A. Viewer layout — new wrapper and top bar

```css
.viewer-screen-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem;
  gap: 0.5rem;
}

.viewer-top-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* .album-viewer no longer has a header inside — remove justify-content / header flex rules that relied on the Back button being inside */
.album-viewer {
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

#### B. Action bar — center the buttons

```css
/* Before */
.album-viewer-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* After */
.album-viewer-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
```

#### C. Zoom cursor via CSS class

```css
.album-viewer-image-frame--zoomed {
  cursor: grab;
}

.album-viewer-image-frame--zoomed:active {
  cursor: grabbing;
}
```

#### D. Skeleton dark theme override

```css
/* Add alongside existing dark theme overrides */
:root[data-theme="dark"] .image-skeleton {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
}

:root[data-theme="dark"] .album-cover-skeleton {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
}
```

#### E. Thumbnail portrait shape

```css
/* Before */
.thumbnail-card {
  flex: 0 0 auto;
  width: 140px;
  height: 100px;
  /* ... */
}

.thumbnail-preview {
  aspect-ratio: 1 / 1;
  /* ... */
}

/* After */
.thumbnail-card {
  flex: 0 0 auto;
  width: 64px;
  aspect-ratio: 3 / 4;   /* portrait — height ~85px */
  /* ... same border, radius, bg, padding, cursor ... */
}

.thumbnail-preview {
  /* Remove aspect-ratio: 1 / 1 — let the card's aspect-ratio drive height */
  width: 100%;
  flex: 1;
  /* ... same border-radius, overflow, display, place-items, bg, font ... */
}
```

#### F. Back button dark theme override

```css
:root[data-theme="dark"] .viewer-back-btn {
  border-color: #475569;
  color: #e2e8f0;
  background: transparent;
}
```

---

### 4.3 ThumbnailStrip.tsx — NO CHANGE

The `ThumbnailStrip` component logic and props interface are unchanged. Only its parent (`ViewerScreen`) layout and CSS rules change.

---

## 5. Data Model

See [data-model.md](./data-model.md) for full definitions.

| State | Existing / New | Change |
|-------|---------------|--------|
| `zoomLevel` | Existing (store) | Bounds enforced: [0.5, 4.0] |
| `panOffset` | Existing (local) | Reset added in keyboard handlers |
| `hoverVisible` | Existing (local) | No change |
| `thumbnailStripPinned` | Existing (store) | No change |
| `prevImageSize` | Existing (local) | No change (logic); dark CSS override added |

---

## 6. State Management

### libraryStore.ts — NO CHANGES

`zoomLevel`, `setZoomLevel`, `thumbnailStripPinned`, `setThumbnailStripPinned`, `goToImage` are all used as-is.

### Local component state — ViewerScreen

| State | Trigger | Change in this feature |
|-------|---------|----------------------|
| `panOffset` | Reset on prev/next/keyboard | Fixed: keyboard handlers now reset |
| `zoomLevel` (store) | Reset on prev/next/keyboard | Fixed: keyboard handlers now reset |
| `hoverVisible` | Mouse enter/leave hover zone | No change |
| `prevImageSize` | Image `onLoad` | No change |

---

## 7. Rust Services

**No changes.** The Rust backend is not touched by this feature.

---

## 8. React Components

| Component | File | Change Type | Summary |
|-----------|------|-------------|---------|
| `ViewerScreen` | `src/features/viewer/components/ViewerScreen.tsx` | MODIFY | Zoom bounds, nav reset, JSX restructure |
| `ThumbnailStrip` | `src/features/viewer/components/ThumbnailStrip.tsx` | NO CHANGE | — |
| `App` | `src/App.tsx` | NO CHANGE | — |
| `LibraryView` | `src/features/library/components/LibraryView.tsx` | NO CHANGE | — |

---

## 9. File System Interactions

**None.** This feature introduces no new filesystem interactions. All existing filesystem access routes through Rust services via existing Tauri commands (unchanged).

---

## 10. Error Handling

No new error paths are introduced.

Zoom bound enforcement is a silent clamp (no error message needed — the button simply stops having an effect at the limit). This is standard behavior for zoom controls.

All existing error paths (`viewerError`, image loading failures, etc.) are unchanged.

---

## 11. Testing Strategy

### Unit Tests (vitest)

No new unit tests are strictly required for this feature — all changes are either:
- Pure CSS (not unit-testable)
- Simple arithmetic bound checks (trivial)
- JSX structural rearrangement (integration-level)

If desired, add a single unit test to verify zoom bound clamping logic:

```ts
// src/test/zoomBounds.test.ts
describe("zoom clamping", () => {
  const ZOOM_STEP = 0.25, ZOOM_MIN = 0.5, ZOOM_MAX = 4.0;
  it("does not exceed max", () => expect(Math.min(ZOOM_MAX, 4.0 + ZOOM_STEP)).toBe(4.0));
  it("does not go below min", () => expect(Math.max(ZOOM_MIN, 0.5 - ZOOM_STEP)).toBe(0.5));
});
```

### Manual Validation

Follow the four scenarios in [quickstart.md](./quickstart.md) for end-to-end validation.

### Regression

- Existing `ImageViewer.test.tsx` and `libraryStore.test.ts` must continue passing without modification.
- Run `pnpm vitest run` before submitting the branch.

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Keyboard handler stale closure after adding `setZoomLevel`/`setPanOffset` to deps | Low | Incorrect reset (zoom not cleared) | Verify dep array includes `setZoomLevel`, `setPanOffset`; vitest will catch stale refs |
| CSS specificity conflict with new `.viewer-screen-shell` wrapper | Low | Visual regression in non-viewer screens | Wrapper class is viewer-specific; does not affect library or settings screens |
| Thumbnail portrait shape breaks horizontal scroll in strip | Low | Strip thumbnails overflow or wrap | `flex: 0 0 auto` on card prevents wrapping; `overflow-x: auto` on strip is unchanged |
| `data-theme="dark"` skeleton override order conflict | Very low | Skeleton stays light in dark mode | Place dark overrides after the base rule in App.css (already the pattern) |
| `:active` cursor not triggering during `setPointerCapture` in all WebView versions | Low | Cursor stays `grab` during drag (cosmetic only) | Tauri 2 uses WebView2 (Windows) / WKWebView (macOS) — both support `:active` during pointer capture |

---

## 13. Future Extensibility

- **Pinch-to-zoom (trackpad/touch)**: The zoom state (`zoomLevel`) and pan state (`panOffset`) are already decoupled from input method. Adding `onWheel` handling for trackpad pinch zoom requires only a new event handler on `album-viewer-image-frame` — no architecture changes.
- **Zoom level persistence**: If zoom should be remembered per-album, `zoomLevel` can be moved from store ephemeral state to catalog metadata. Not required now.
- **Animated zoom transitions**: `transform` on the `<img>` can be augmented with `transition: transform 0.1s ease` in CSS without any logic change.
- **Thumbnail strip on left/right side**: The `.viewer-thumbnail-area` can be repositioned using CSS flex direction changes. The component is already layout-agnostic.
- **Keyboard zoom shortcuts**: `+`/`-` keys can be wired to `handleZoomIn`/`handleZoomOut` in the existing keyboard shortcut effect with no new infrastructure.

