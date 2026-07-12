# Research: Fix Viewer Zoom Controls

**Feature**: 014-fix-viewer-zoom-buttons  
**Date**: 2026-07-11

---

## Root Cause

### Decision: Pointer capture was the exclusive cause of non-functional zoom buttons

**Rationale**:  
The `.album-viewer-image-frame` `<div>` registered an `onPointerDown` handler that unconditionally called
`element.setPointerCapture(pointerId)`. This causes the browser to route all subsequent pointer events
(`pointermove`, `pointerup`) to the capturing element — bypassing normal DOM hit-testing. As a result,
when the user clicked a zoom button (`<button>` inside `.viewer-zoom-controls`), the sequence was:

1. `pointerdown` bubbled up to the frame div.
2. The frame called `setPointerCapture()`.
3. `pointerup` was redirected to the frame div, never reaching the button.
4. Without a `pointerup` on the button, the browser did not synthesize a `click` event.
5. The zoom handler was never invoked.

The store (`libraryStore.ts`) and the handlers (`handleZoomIn`, `handleZoomOut`, `handleZoomReset`) were
correct. The `setZoomLevel` action itself was correct. The failure was 100% in pointer event routing.

**Alternatives considered**:  
- Using `stopPropagation()` on zoom button events — rejected because it would break other event listeners
  higher in the tree and is fragile as the DOM evolves.
- Moving zoom controls outside the image frame — rejected because it would require CSS/layout changes with
  no behavioral benefit and would break the existing visual design.
- Using `onMouseDown`/`onMouseUp` instead of pointer events — rejected because pointer events are more
  capable (stylus, touch) and the constitution requires cross-platform support.

---

## Browser Pointer Capture Behavior

### Decision: Guard `setPointerCapture` with an interactive-target check

**Rationale**:  
The W3C Pointer Events specification states that `setPointerCapture` applies to the element, not the
event target. Once capture is set, all subsequent `pointermove` and `pointerup` events are delivered to
the capturing element regardless of where the pointer physically is. The correct pattern for a
drag-enabled container that also hosts interactive children is to check whether `pointerdown` originated
from an interactive descendant, and skip capture in that case.

**Decision**: Introduce a narrow `isInteractiveTarget(target)` guard that checks whether `e.target`
(the innermost element hit) is inside `.viewer-zoom-controls` or any `button | a | input | textarea |
select` element. If it is, `handlePointerDown` returns early without setting pointer capture.

**Alternatives considered**:  
- `pointer-events: none` on the controls via CSS — rejected because it disables the visual hover/active
  states and accessibility focus on the buttons.
- Checking `e.target === e.currentTarget` — rejected because it would also block drags initiated when the
  user's pointer happens to land exactly on the image's `<img>` tag.

---

## `releasePointerCapture` Safety

### Decision: Guard release with `hasPointerCapture` before calling `releasePointerCapture`

**Rationale**:  
When capture was not set (because `handlePointerDown` returned early), calling `releasePointerCapture` in
`handlePointerUp` would throw `DOMException: The element is not capturing this pointer`. Guarding the
call with `element.hasPointerCapture(pointerId)` prevents the error without adding any behavioral change
in the normal drag path.

**Alternatives considered**:  
- `try/catch` around the release call — acceptable, but idiomatic DOM usage prefers the `has*` guard.
  Both were wrapped in `try/catch` as a belt-and-suspenders safety measure; `hasPointerCapture` is the
  primary guard, `try/catch` is the fallback for unusual WebView environments.

---

## Testing Approach

### Decision: Use `fireEvent` (not `userEvent`) for pointer-level interaction simulation

**Rationale**:  
`userEvent.click` simulates a full synthetic sequence but does not exercise the `pointerdown → setPointerCapture → pointerup` path that was the actual failure mechanism. Using `fireEvent.click` on the
button directly (which fires `click` without going through pointer events) is sufficient to verify that
the button's `onClick` handler reaches `setZoomLevel`. The drag tests use `fireEvent.pointerDown/
pointerMove/pointerUp` to exercise the full capture path independently.

**jsdom limitation**:  
jsdom does not implement `setPointerCapture`/`releasePointerCapture`/`hasPointerCapture`. These must be
stubbed in the test setup with `vi.fn()`. The `try/catch` guards in production code ensure no runtime
errors in jsdom-based tests.

---

## No Rust Changes Required

**Decision**: This fix is entirely in the React frontend.

**Rationale**:  
The zoom level and pan offset are client-side presentation state. No Tauri command, no filesystem access,
no ZIP manipulation, and no metadata persistence is involved. The Rust backend is not touched.

---

## No New Dependencies Required

**Decision**: No new npm packages needed.

**Rationale**:  
The fix uses only existing React pointer event APIs, DOM APIs (`closest`, `hasPointerCapture`), and the
existing Zustand store. No additional libraries are warranted.
