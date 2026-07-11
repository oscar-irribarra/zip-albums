# Research: Improve UI Navigation Experience

**Feature**: 009-improve-ui  
**Date**: 2026-07-10

---

## RES-001: Settings FAB & Side Panel

**Decision**: Implement a fixed-position Floating Action Button (FAB) and a right-side overlay panel using plain CSS (`position: fixed`) and React state. No third-party library needed.

**Rationale**: The existing `SettingsPanel` component already renders all settings form elements. The FAB and side panel are structural wrappers — the panel re-uses the existing component. A simple `isOpen: boolean` in local state (or the settings store) drives the open/close transition via a CSS class.

**Closing gestures**:
- X button → `setOpen(false)`
- Click outside (backdrop div) → `setOpen(false)`  
- ESC key → `useEffect` with `keydown` listener, cleaned up on unmount

**Alternatives considered**:
- Dialog/modal element (HTML `<dialog>`) — rejected; limited browser animation control and less portable across Tauri's WebView versions.
- New Zustand slice for `settingsPanelOpen` — rejected; this is purely UI state with no cross-component dependency, local component state suffices.

---

## RES-002: Thumbnail Strip Redesign

**Decision**: Control visibility through a CSS class toggled by React state. `isHovered` is local component state driven by `onMouseEnter`/`onMouseLeave` on the viewer container. `isPinned` is stored in `libraryStore` so it survives album navigation (but resets on app restart — no persistence needed).

**Rationale**: Pure CSS `opacity`+`max-height` transition is GPU-accelerated and requires no layout reflow. The strip remains in the DOM at all times (no conditional render) to avoid scroll-position loss.

**Size reduction**: Change thumbnail card height from 96px (current square) to 64px tall with `aspect-ratio: 1/1` maintained, reducing strip height by ~33%.

**Toggle button**: A small icon button (`☰` or equivalent) added to the viewer toolbar. It flips `isPinned` in the store. When `isPinned` is true the strip is always visible regardless of hover.

**Alternatives considered**:
- `display: none` toggle — rejected; loses scroll position and causes layout shift.
- Separate hover zone below the image — accepted variant; the hover area will cover the strip's natural position so it feels natural.

---

## RES-003: Image Viewer — Aspect Ratio & Skeleton

**Decision**: Track `prevImageNaturalSize: {width: number, height: number} | null` in local component state of the new `ImageViewer` component. On `img onLoad`, record the dimensions. When navigation triggers (`viewerLoading = true`), render a skeleton `<div>` with `aspect-ratio: ${w}/${h}` instead of the `<img>`. When the new image loads, swap back to `<img>`.

**Rationale**: The skeleton sized to the previous image's aspect ratio prevents layout shift. The viewer container uses a fixed `max-height` on the image frame, so the skeleton fills the same visual space. Storing dimensions locally (not in the Zustand store) avoids polluting shared state with UI-only concerns.

**Aspect ratio preservation**: The viewer frame currently uses `max-height: 65vh`. Increasing this to `max-height: 80vh` and setting `min-height: 60vh` gives the image more space. The `<img>` already uses `object-fit: contain`, which preserves the native aspect ratio.

**Alternatives considered**:
- Store image dimensions in `libraryStore` — rejected; dimensions are UI-only, not business data.
- Fixed-size skeleton — rejected; causes visual jump when image dimensions differ from the skeleton size.

---

## RES-004: Image Viewer — Zoom Controls

**Decision**: Add `zoomLevel: number` (default `1.0`) to `libraryStore` viewer state. Three buttons (zoom-in `+`, zoom-out `−`, reset `↺`) positioned absolutely in the top-right corner of the image frame. Apply `transform: scale(zoomLevel)` with `transform-origin: center` to the `<img>` element. Reset zoom to 1.0 in `goToImage()` and `openAlbumViewer()`.

**Zoom steps**: `+0.25` per click, range `0.25–4.0`. Reset → `1.0`.

**Rationale**: CSS `transform: scale()` is the simplest, GPU-accelerated zoom with no additional libraries. The overflow on the image frame is `hidden` when zoomed below 1 and `auto` (scrollable) when above 1.

**Alternatives considered**:
- Canvas-based zoom — rejected; overkill for the current requirements.
- CSS `zoom` property — rejected; non-standard behavior across WebViews.
- Storing zoom in local state — rejected; zoom should survive thumbnail navigation within the same album, making store state appropriate. It still resets on album change.

---

## RES-005: Album Card Uniformity

**Decision**: Change the album grid from `auto-fit` to `auto-fill` with a fixed column size (`minmax(180px, 180px)`), making all cards identical widths. Fix the cover image with `aspect-ratio: 3/4` and `object-fit: cover` to force uniform cover display regardless of native image dimensions.

**Cover image source**: `AlbumSummary.cover_data` already contains a base64 data URL for the first image (index 0). The Rust side already returns this. No new Tauri commands needed.

**Alternatives considered**:
- Fixed pixel grid (`grid-template-columns: repeat(4, 1fr)`) — rejected; does not adapt to window width.
- Fixed aspect ratio `1/1` (square) — alternative accepted; `3/4` is more natural for manga/comic album covers (portrait format matches the content).

---

## Summary: No New Rust Commands Required

All 5 user stories are achievable with frontend-only changes:
- CSS layout changes for FAB, side panel, thumbnail strip, image frame
- Component extraction: `ImageViewer.tsx`, `SettingsFAB.tsx`, `SettingsSidePanel.tsx`
- Two small Zustand store additions: `zoomLevel` and `thumbnailStripPinned`
- No new Tauri commands, no new Rust services, no schema changes
