# Implementation Plan: Fix Viewer Zoom Controls

**Branch**: `014-fix-viewer-zoom-buttons` | **Date**: 2026-07-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [specs/014-fix-viewer-zoom-buttons/spec.md](spec.md)

---

## Summary

The Zoom In (+), Zoom Out (−), and Reset Zoom (○) buttons in the image viewer were non-functional. The root cause was unconditional use of `setPointerCapture()` on the image frame container on every `pointerdown` event. This redirected `pointerup` away from the zoom buttons, preventing the browser from synthesizing a `click` event. The fix is a targeted guard in `ViewerScreen` that skips pointer capture when `pointerdown` originates from an interactive descendant (button, link, input). No Rust code, no new dependencies, no new abstractions.

---

## 1. Feature Overview

| Attribute | Value |
|-----------|-------|
| Type | Bug fix |
| Scope | Frontend only — single component (`ViewerScreen`) |
| Backend impact | None |
| New dependencies | None |
| New files | None — existing file modified |
| Breaking changes | None |

---

## 2. Functional Requirements

| ID | Requirement | Implemented by |
|----|-------------|---------------|
| FR-001 | Zoom In, Zoom Out, and Reset Zoom buttons respond to clicks | `handlePointerDown` guard |
| FR-002 | Clicking a zoom control MUST NOT initiate a drag | `isInteractiveTarget` early-return |
| FR-003 | Dragging the image frame (non-interactive target) initiates panning only | unchanged `handlePointerMove` |
| FR-004 | Zoom level clamped to 0.25–4.0 | `clampZoomLevel` in store (unchanged) |
| FR-005 | Reset button restores zoom to 100% and pan to center | `handleZoomReset` (unchanged logic) |
| FR-006 | Zoom controls work while an image is loading | buttons are never disabled during loading |
| FR-007 | Keyboard navigation, fullscreen, and thumbnails unaffected | no change to those event paths |
| FR-008 | Thumbnail strip pin/unpin unaffected | no change to those handlers |

---

## 3. Technical Architecture

This is a pure React/TypeScript frontend fix. No layers need to be added or removed.

```
┌─────────────────────────────────────────────────┐
│  ViewerScreen (React component)                  │
│                                                  │
│  .album-viewer-image-frame   ← onPointerDown     │
│  │                             (guarded)         │
│  └─ .viewer-zoom-controls                        │
│       ├─ button "+"  → handleZoomIn              │
│       ├─ button "−"  → handleZoomOut             │
│       └─ button "○"  → handleZoomReset           │
│                                                  │
│  State: zoomLevel (Zustand), panOffset (local)   │
└─────────────────────────────────────────────────┘
         │
         │  setZoomLevel(n)
         ▼
┌─────────────────────────────────────────────────┐
│  libraryStore (Zustand)                          │
│  clampZoomLevel(0.25 – 4.0) → set zoomLevel      │
└─────────────────────────────────────────────────┘
```

### Responsibility split

| Layer | Responsibility |
|-------|---------------|
| **Frontend** (`ViewerScreen.tsx`) | Detect whether `pointerdown` targets an interactive element; conditionally set/release pointer capture; compute and apply zoom and pan transforms to the `<img>` element |
| **Frontend** (`libraryStore.ts`) | Persist `zoomLevel` in Zustand state; enforce min/max clamp via `clampZoomLevel`; reset `zoomLevel` to `1` on image navigation |
| **Backend (Rust)** | Not involved |
| **Infrastructure services** | Not involved |
| **Shared models** | `LibraryState.zoomLevel: number` — already defined; unchanged |

---

## 4. Components to Implement

### Modified — `ViewerScreen.tsx`

**Location**: `src/features/viewer/components/ViewerScreen.tsx`

Two additions to the existing component:

#### 4.1 `isInteractiveTarget(target)` helper

A pure function that returns `true` when the pointer event target is inside an interactive element that
should handle its own click event (button, anchor, input, textarea, select, or any element inside
`.viewer-zoom-controls`).

```
function isInteractiveTarget(target: EventTarget | null): boolean
```

- Uses `el.closest(selector)` to walk the DOM upward from the event target.
- Does NOT use `stopPropagation` — only prevents pointer capture from being acquired.

#### 4.2 Guard in `handlePointerDown`

```
if (isInteractiveTarget(e.target)) return;
// …existing capture logic…
```

#### 4.3 Safety guard in `handlePointerUp`

```
if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
  e.currentTarget.releasePointerCapture(e.pointerId);
}
```

Wrapped in `try/catch` as fallback for WebView environments (including jsdom in tests) that do not
implement the full Pointer Events API.

### Unchanged — `libraryStore.ts`

`setZoomLevel`, `clampZoomLevel`, and the `zoomLevel` state field are correct and require no modification.

### Unchanged — Rust backend

No Tauri commands, Rust structs, or filesystem operations are involved.

---

## 5. Data Model

See [data-model.md](data-model.md) for full detail.

**Summary**: No new fields, no new entities. The existing `zoomLevel: number` (Zustand) and
`panOffset: { x: number, y: number }` (local `useState`) are the complete state surface.

---

## 6. State Management

| State | Location | Lifetime | Reset trigger |
|-------|----------|----------|---------------|
| `zoomLevel` | Zustand `LibraryState` | Viewer session | Image navigation, viewer close |
| `panOffset` | `ViewerScreen` `useState` | Viewer session | Image navigation, zoom reset, viewer close |
| `isDragging` | `ViewerScreen` `useRef` | Ephemeral (drag gesture) | `pointerup` |
| `dragStart` | `ViewerScreen` `useRef` | Ephemeral (drag gesture) | `pointerdown` |

**Flow — zoom button click (after fix)**:

```
user clicks "+"
  → pointerdown fires on frame div
  → isInteractiveTarget(e.target) = true   ← NEW guard
  → handlePointerDown returns early          ← NO pointer capture set
  → button receives pointerup natively
  → browser fires click
  → handleZoomIn() runs
  → setZoomLevel(Math.min(4.0, current + 0.10))
  → Zustand updates zoomLevel
  → ViewerScreen re-renders with new transform
```

**Flow — drag (unchanged)**:

```
user presses on image (non-button area)
  → pointerdown fires on frame div
  → isInteractiveTarget(e.target) = false
  → setPointerCapture called (pointer events captured)
  → pointermove → panOffset updated
  → pointerup → isDragging = false, releasePointerCapture (guarded)
```

---

## 7. Rust Services

**None required.** This fix is entirely in the React/TypeScript frontend. The Rust backend has no
involvement in zoom level, pan offset, or pointer event handling.

---

## 8. React Components

### `ViewerScreen` — delta from current implementation

| Element | Change |
|---------|--------|
| `isInteractiveTarget()` helper | Added above component body |
| `handlePointerDown` | Early-return guard added at the top |
| `handlePointerUp` | `hasPointerCapture` guard added before `releasePointerCapture` |
| Zoom button markup | No change — `onClick` handlers are already wired correctly |
| `handleZoomIn/Out/Reset` | No change — logic was always correct |
| Everything else | No change |

No new components. No extracted sub-components. No new hooks.

---

## 9. File System Interactions

**None.** Zoom level is transient presentation state. It is not persisted to disk, not loaded from disk,
and does not interact with ZIP files or the Tauri filesystem plugin.

---

## 10. Error Handling

| Scenario | Handling |
|----------|----------|
| `setPointerCapture` throws (unsupported WebView) | `try/catch` silently ignores; drag may not work in that environment but buttons are unaffected |
| `releasePointerCapture` throws (no capture was set) | `hasPointerCapture` guard prevents the call; `try/catch` fallback for jsdom |
| Zoom level already at max/min | `Math.min`/`Math.max` clamp in handlers; `clampZoomLevel` in store — no error possible |
| Button clicked while loading | `setZoomLevel` updates state; no guard on loading state for zoom (spec FR-006) |

No user-facing error messages are needed. Zoom errors are silent by design — the worst outcome is that
a zoom click has no visible effect in a degraded WebView, which is not a crash.

---

## 11. Testing Strategy

### Existing tests (already passing)

| File | Groups | What they cover |
|------|--------|----------------|
| `src/test/ViewerScreen.test.tsx` | Zoom In/Out (US1) | `setZoomLevel` called with correct clamped values |
| | Pan (US2) | drag updates `translate` transform |
| | Reset (US3) | `setZoomLevel(1)` + pan resets to origin |

These tests already exercise the fixed behavior using `fireEvent.click` on the buttons, which bypasses
pointer capture and works in jsdom. They serve as the regression safety net.

### Tests to add

| Scenario | Test | Type |
|----------|------|------|
| Zoom button click does not acquire pointer capture | `fireEvent.pointerDown` on a zoom button → `setPointerCapture` mock MUST NOT be called | Unit |
| Drag on image frame still acquires pointer capture | `fireEvent.pointerDown` on frame (not button) → `setPointerCapture` mock MUST be called | Unit |
| `releasePointerCapture` not called when capture was never set | `pointerDown` on button + `pointerUp` on frame → `releasePointerCapture` NOT called | Unit |

### Not required

- Integration tests against Tauri (pointer capture behavior is correctly handled by jsdom stubs)
- Visual regression tests (scope is a one-line guard change, not a style change)

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `el.closest` not available in older WebView | Low — Tauri uses a modern WebView | Medium | `?.` optional chaining already used in `isInteractiveTarget` |
| `hasPointerCapture` not available in jsdom / WebView | Low | Low | `try/catch` wraps `releasePointerCapture`; tests stub the method |
| New `isInteractiveTarget` logic too broad (catches non-button elements) | Low — selector is narrow | Low | Selector limited to `button, a, input, textarea, select` + explicit `.viewer-zoom-controls` class |
| New guard breaks future drag targets inside the frame | Low | Low | Guard is based on `closest` walk from event target; custom drag elements that are not buttons/inputs are unaffected |

---

## 13. Future Extensibility

- **Pinch-to-zoom**: If touch/pinch support is added, pointer events would be the correct API. The guard must remain based on `isInteractiveTarget` rather than pointer type to avoid breaking any added touch controls.
- **Configurable zoom step / limits**: `ZOOM_STEP`, `ZOOM_MIN`, `ZOOM_MAX` are inline constants in `ViewerScreen`. They can be promoted to settings without touching the pointer-capture logic.
- **Zoom persistence**: If reading progress is extended to include zoom level (e.g., per-album), the Zustand `zoomLevel` field can be persisted via a Tauri command with no changes to the pointer event logic.
- **Additional interactive overlays**: Any future buttons, toolbars, or annotations rendered inside `.album-viewer-image-frame` will automatically benefit from the `isInteractiveTarget` guard without modification, as long as they use standard interactive HTML elements.

---

## Project Structure

### Documentation (this feature)

```text
specs/014-fix-viewer-zoom-buttons/
├── plan.md          ← this file
├── research.md      ← Phase 0: root cause analysis and decisions
├── data-model.md    ← Phase 1: state/entity overview
├── quickstart.md    ← Phase 1: manual and automated validation guide
├── checklists/
│   └── requirements.md
└── tasks.md         ← generated by /speckit.tasks
```

### Source Code (affected files only)

```text
src/
└── features/
    └── viewer/
        └── components/
            └── ViewerScreen.tsx   ← modified (isInteractiveTarget, pointer guards)

src/
└── test/
    └── ViewerScreen.test.tsx      ← extended (pointer capture assertions)
```

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline First | ✅ Pass | No network calls |
| II. ZIP is Source of Truth | ✅ Pass | Not involved |
| III. Read-Only Albums | ✅ Pass | Not involved |
| IV. Simple Architecture | ✅ Pass | One function + two guard lines; no new abstractions |
| V. Separation of Responsibilities | ✅ Pass | Presentation logic stays in React; no business logic moved |
| VI. Local Persistence | ✅ Pass | Zoom is not persisted |
| VII. Lazy Loading | ✅ Pass | Not involved |
| VIII. Performance | ✅ Pass | Guard is a synchronous DOM check; no async blocking |
| IX. Error Handling | ✅ Pass | `try/catch` on pointer API calls; no user-facing errors needed |
| X. Cross Platform | ✅ Pass | Standard DOM Pointer Events API; Tauri supports all three platforms |

**No violations. No complexity tracking table required.**
