# Research: Improve UI/UX (010)

**Date**: 2026-07-10
**Feature**: [spec.md](./spec.md)

---

## Decision 1: Screen navigation strategy

**Decision**: Simple conditional render in `App.tsx` — derive active view from existing `viewerSession` in `libraryStore` (`viewerSession !== null` → show viewer screen; otherwise → show library screen).

**Rationale**: The app has exactly two screens (library and viewer). React Router adds URL management, browser history, and route parameter overhead that provides no value in a desktop application with no deep-linking requirement. The constitution mandates avoiding unnecessary abstractions. Deriving the active view from existing Zustand state is zero-cost and instantly reversible.

**Alternatives considered**:
- React Router v6 — rejected; no routing URLs needed in a local desktop app; adds dependency without benefit.
- Separate `navigationStore` — rejected; over-engineering for two states. App.tsx can read `viewerSession` directly from `libraryStore`.

---

## Decision 2: Album cover loading strategy

**Decision**: Add a new Tauri command `get_album_cover(album_id)` that returns the first image (index 0, sorted ascending) from the album's ZIP as a base64 data URL. `AlbumCard` calls this command lazily on mount via a `useEffect`. Result is held in local component state (not the global store).

**Rationale**: Constitution principle VII (Lazy Loading) requires that images are loaded only when needed. Loading all covers during `get_library` would block the library from rendering until every ZIP is read. A dedicated cover command lets each card load independently, non-blocking, and in parallel. Local state per-card is sufficient — there is no cross-card cover sharing requirement. This avoids polluting the global `libraryStore` with cover cache state.

**Alternatives considered**:
- Embed `cover_data` in `get_library` response — rejected; forces synchronous ZIP reads for all albums before any card renders; violates Lazy Loading principle.
- Global cover cache in `libraryStore` — rejected; unnecessarily complicates the library store for data that is card-local; premature optimization.
- `IntersectionObserver`-gated loading — considered as enhancement; not required by spec; deferred as future extensibility.

---

## Decision 3: Image filename sorting for cover and navigation

**Decision**: Sort image entries by filename (lowercased, path-stripped) in **ascending lexicographic order** inside `ZipService::inspect_album_checked` and `ZipService::load_image_by_index`. Apply `sort_unstable_by` on the collected `supported_entries` vector before indexing.

**Rationale**: The spec states that album filenames follow the convention `00`, `01`, `001`, etc. — zero-padded names of consistent width within any given album. For zero-padded filenames of equal length, lexicographic order is identical to numeric order, so lex sort is correct and simple. `sort_unstable_by` is O(n log n), allocates no extra memory, and runs only during ZIP inspection — not on the hot image load path.

**Alternatives considered**:
- Natural/numeric sort (parse digits) — over-engineering for the stated convention; can be added later if needed.
- Rely on archive entry order — rejected; ZIP archives make no ordering guarantee; would give non-deterministic covers.

---

## Decision 4: Zoom and pan interaction model

**Decision**: Implement pan using `pointer capture` API on the image frame container. Store `panOffset: { x: number; y: number }` in component-local state (not Zustand). Clamp pan so the image edge never scrolls past the viewport edge. Reset pan to `{x:0, y:0}` on image navigation (same as zoom reset). Combine scale and translate in a single CSS transform: `translate(${panX}px, ${panY}px) scale(${zoom})`.

**Rationale**: Pointer capture (`element.setPointerCapture`) handles mouse leaving the element during drag cleanly, without global `mousemove` listeners. Pan offset is view-local ephemeral state — not relevant to other components and not persisted. Resetting on navigation prevents a panned state carrying over to the next image unexpectedly.

**Pan constraint formula**:
```
maxPanX = (imageNaturalWidth * zoom - frameWidth) / 2   (if > 0 else 0)
clampedPanX = clamp(panX, -maxPanX, maxPanX)
```
Applied symmetrically for Y.

**Alternatives considered**:
- Global `mousemove` listener — rejected; requires manual cleanup and breaks when cursor leaves window.
- Overflow scroll on container — rejected; scroll interaction conflicts with page scroll; harder to control bounds programmatically.
- Storing pan in Zustand — rejected; pan is ephemeral per-image view state, not shared; local state is simpler.

---

## Decision 5: Thumbnail strip visibility model

**Decision**: Two independent boolean flags: `pinned` (controlled by toggle button, stored in `libraryStore.thumbnailStripPinned`) and `hoverVisible` (controlled by component-local state, `useState`). Strip renders if `pinned || hoverVisible`. When hidden, a 16px-tall "hover zone" bar remains at the bottom of the viewer, listening to `onMouseEnter`/`onMouseLeave` events to set `hoverVisible`. The strip renders above (or replacing) the hover zone via absolute positioning.

**Rationale**: Separating `pinned` from `hoverVisible` gives exact spec compliance: hovering shows the strip transiently; the button pins it persistently. Using a dedicated hover zone element (not the whole viewer) prevents the strip from appearing whenever the user moves over the image. The 16px bar is always visible (not zero-size) so users can discover it.

**Alternatives considered**:
- Single `visible` flag managed by timeout — rejects because toggling conflicts with hover; complex timing logic.
- CSS `:hover` on the strip container — rejects because CSS hover doesn't expose a "hover zone separate from strip" split.

---

## Decision 6: Viewer feature directory

**Decision**: Create `src/features/viewer/` with `ViewerScreen.tsx` and `ThumbnailStrip.tsx`. Move keyboard navigation shortcuts from `LibraryView.tsx` to `ViewerScreen.tsx`. `LibraryView.tsx` becomes library-only (grid + toolbar + import).

**Rationale**: The constitution prescribes the folder structure `src/features/viewer/`. This enforces the spec requirement that library and viewer are independent screens. Moving keyboard shortcuts to the viewer is correct because arrow navigation, `f` (fullscreen), and `Escape` are viewer-specific concerns.

**Alternatives considered**:
- Keep everything in `library/` — violates constitution folder mandate.
- Separate `viewerStore` — not needed; `libraryStore` already owns all viewer state and its actions are well-encapsulated. Splitting requires cross-store coordination. Deferred to future refactor.

---

## Decision 7: Delete behavior fix

**Decision**: Remove the `FileSystemService::delete_file(&album_path)` call from the `delete_album` Rust command. The command will only call `MetadataService::remove_album`. Update the frontend confirmation dialog text to remove any mention of file deletion.

**Rationale**: FR-007 and FR-008 explicitly require that delete removes the album from the application catalog only, leaving the original ZIP untouched. The current implementation violates this. The fix is a one-line removal in `lib.rs`.

**Alternatives considered**:
- Add an `also_delete_file: bool` flag — over-engineering; the spec is unambiguous that ZIP deletion is never allowed from within the app.

---

## Unresolved items

None. All NEEDS CLARIFICATION markers resolved.
