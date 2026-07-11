# Research: Image Viewer Improvements

**Phase**: 0 — Research & Decision Log
**Feature**: 011-image-viewer-improvements
**Date**: 2026-07-10

All decisions below resolve items that were NEEDS CLARIFICATION or required best-practice evaluation before design.

---

## Decision 1 — Zoom Bounds & Step Size

**Decision**: Minimum zoom = 0.5×, maximum zoom = 4.0×, step = 0.25× per click.

**Rationale**:
- 0.5× shows the image at half its natural fit size, which is still usable.
- 4.0× is sufficient to inspect fine detail in typical manga/comic scans without extreme memory pressure.
- 0.25× step matches the existing implementation and feels natural for precise control.
- Clamping in the React handler (not the store) keeps the store action generic.

**Alternatives considered**:
- 0.1× step — too granular; 20 clicks to go from 1× to 3×.
- Dynamic step (10% of current) — inconsistent feel.
- Bounds enforced in store — possible but adds policy to infrastructure; component ownership is cleaner.

---

## Decision 2 — Zoom & Pan Reset on Image Navigation

**Decision**: Reset both `zoomLevel` (to 1.0) and `panOffset` (to `{x:0, y:0}`) in every navigation handler: `handlePrev`, `handleNext`, and the keyboard shortcut `useEffect`.

**Rationale**:
- Zoom is stored in the Zustand store (`zoomLevel`). Pan is local component state (`panOffset`).
- Both must be reset before `goToImage` is called so the new image renders fresh.
- Resetting in the component handlers (not inside `goToImage`) avoids coupling store logic to UI presentation state.
- The keyboard shortcut handler already has access to `setZoomLevel` and `setPanOffset` via closure; adding reset calls there is surgical and low-risk.

**Alternatives considered**:
- Reset inside `goToImage` store action — would require storing panOffset in the store, introducing unnecessary shared state for purely UI-local concerns.
- Reset on image `onLoad` event — would cause a visible jump as the image loads with stale transform before snapping to center.

---

## Decision 3 — Skeleton Theme Adaptation

**Decision**: Add `data-theme="dark"` override rules for `.image-skeleton` and `.album-cover-skeleton` in `App.css`, replacing hardcoded light-gray gradient stops with dark-theme equivalents. No new CSS custom properties introduced.

**Rationale**:
- Existing dark theme overrides follow the `[data-theme="dark"] .class-name { ... }` pattern already established throughout `App.css`. Consistency trumps elegance here.
- The skeleton gradient stops (`#e2e8f0`, `#cbd5e1`) are standard light-blue-gray Tailwind palette colors. Dark equivalents are `#1e293b` (slate-800) and `#334155` (slate-700), which match `.color-surface` and `.color-border` values already in the CSS.
- Adding CSS custom properties (`--skeleton-bg-1`, etc.) would be cleaner long-term but violates the constitution's principle of avoiding unnecessary abstractions (Principle IV).

**Alternatives considered**:
- CSS custom properties for skeleton stops — over-engineered for two selectors.
- CSS `color-mix()` — not supported in all Tauri WebView targets without testing.

---

## Decision 4 — Thumbnail Portrait Shape

**Decision**: Change thumbnail cards to a vertical (portrait) orientation using `aspect-ratio: 3 / 4` on the card element. Fixed width of 64px per card. Remove the fixed `aspect-ratio: 1 / 1` from `.thumbnail-preview` and let it fill the card.

**Rationale**:
- Album images in this application are manga/comic pages, which are predominantly portrait-oriented (3:4 or similar).
- A thumbnail that matches the image's natural orientation gives users a better spatial preview of the full image.
- Fixed `width: 64px` with `aspect-ratio: 3/4` yields `height: 85px` — visible without dominating.
- This is purely a CSS change with no React component logic changes.

**Alternatives considered**:
- Explicit `width: 64px; height: 85px` — equivalent but less flexible if width changes.
- Dynamic aspect ratio read from image metadata — requires extra Rust/store work; over-engineered for thumbnails.
- Wider portrait (e.g., 80×120) — viable but consumes more horizontal scroll space.

---

## Decision 5 — Drag Cursor Implementation

**Decision**: Use CSS `:active` pseudo-class to show `cursor: grabbing` during drag. No additional React state needed.

**Rationale**:
- `setPointerCapture` keeps the element in `:active` state throughout the drag gesture even when the pointer leaves the element bounds. This is the exact scenario we exploit.
- Avoids a `useState<boolean>` for `isDragging` that would trigger re-renders on every pointer event — a performance concern in a high-frequency pointer move handler.
- The cursor style is entirely presentational; it belongs in CSS.

**Alternatives considered**:
- `useState<boolean>` for isDragging — triggers re-render on pointerDown/Up, causing 60fps motion to stall on state updates.
- `useRef` + manual DOM class toggle — works but bypasses React's rendering model inconsistently.

---

## Decision 6 — Layout Restructure for Button Placement

**Decision**: Extract the `Back` button (and album title/counter) into a `viewer-top-bar` div that lives **above** the `.album-viewer` section. The `.album-viewer` section becomes exclusively the image display area (image frame + zoom controls). Move `album-viewer-actions` (Prev / Thumbnails / Next) **below** `.album-viewer` with `justify-content: center`.

**Rationale**:
- Spec requires Back to be "outside the viewer" and Prev/Next/Thumbnails to be "outside the viewer section" and centered.
- The cleanest structural solution is to make `.album-viewer` contain only the image-frame, not the header or action bar.
- No logic changes — only the JSX tree structure and CSS are affected.
- The `album-viewer-actions` needs `justify-content: center` (currently `flex-end`).

**Alternatives considered**:
- Keep header inside `.album-viewer` but position the Back button with `position: absolute` outside the section — creates z-index complexity and fragile positioning.
- Remove the header entirely and put Back at the top of the full viewport — loses the album title and counter context.

---

## Decision 7 — Thumbnail Strip Visibility Mechanism

**Decision**: Keep the existing two-trigger model: hover on the hover zone sets `hoverVisible`, and the Thumbnails action button toggles `thumbnailStripPinned`. Strip is visible when `hoverVisible || thumbnailStripPinned`. No changes to store fields.

**Rationale**:
- The spec's hover-only criterion (US-003) is satisfied: hovering the hover zone shows the strip.
- The Thumbnails button (US-004) provides an explicit toggle for users who cannot hover (keyboard, trackpad). Removing it would be a regression.
- No new state is required; current `hoverVisible` + `thumbnailStripPinned` model is preserved.

**Alternatives considered**:
- Remove pin toggle, button only triggers hover state programmatically — breaks accessibility for non-mouse users.
- Store-level pin state removed in favor of pure local hover — loses persistence across image navigation within an album session.

---

## Decision 8 — No Rust Changes

**Decision**: Zero Rust changes required for this feature.

**Rationale**:
- All four user stories involve exclusively UI behavior: zoom controls, state reset on navigation, skeleton theming, thumbnail layout, and button positioning.
- No new Tauri commands, no new filesystem operations, no ZIP manipulation.
- The existing `load_album_image` and `load_thumbnail_image` commands are sufficient.

**Alternatives considered**:
- Server-side thumbnail resizing for portrait shape — unnecessary; thumbnail shape is controlled by CSS.
