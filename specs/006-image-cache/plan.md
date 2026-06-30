# Implementation Plan: Image Cache

**Branch**: `006-image-cache` | **Date**: 2026-06-30 | **Spec**: [specs/006-image-cache/spec.md](specs/006-image-cache/spec.md)

**Input**: Feature specification from `/specs/006-image-cache/spec.md`

## Summary

Implement an in-memory adjacent-image cache policy for the album viewer to reduce navigation latency while keeping memory bounded. The solution extends the existing viewer flow in `libraryStore` without adding a new architecture layer, database, or persisted cache. Images remain lazily loaded through existing Tauri commands, with ZIP reads handled only by Rust `ZipService`.

## Technical Context

**Language/Version**: TypeScript 5.8 + React 19 (frontend), Rust 1.75+ (Tauri backend)

**Primary Dependencies**: Zustand, Tauri `invoke`, React Testing Library + Vitest, Rust `serde` and existing `FileSystemService`/`MetadataService`/`ZipService`

**Storage**: No new persistent storage; cache is memory-only per viewer session

**Testing**: Vitest + React Testing Library (frontend), `cargo test` (Rust), manual Tauri validation

**Target Platform**: Windows, Linux, macOS desktop through Tauri

**Project Type**: Offline desktop app

**Performance Goals**: Keep next/previous transitions responsive and maintain bounded cache memory usage during long sessions

**Constraints**: Offline-only, ZIP as source of truth, read-only albums, filesystem via infrastructure services only, ZIP access via `ZipService` only, lazy loading required, avoid overengineering

**Scale/Scope**: Single active viewer session cache with adjacent prefetch and deterministic eviction

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0

- Pass: Feature is offline-only and introduces no network dependency.
- Pass: No album-content duplication or mutation is introduced.
- Pass: Architecture remains simple; existing store and commands are extended in place.
- Pass: Frontend remains responsible for UI state/cache policy only.
- Pass: Backend remains responsible for ZIP and filesystem access.
- Pass: Filesystem interactions stay routed via `FileSystemService`.
- Pass: ZIP manipulation remains routed via `ZipService`.
- Pass: No database is introduced.

### Post-Phase 1 Re-check

- Pass: Data model is runtime-only for cache; no persisted image cache.
- Pass: Contracts reuse existing commands, avoiding unnecessary API expansion.
- Pass: Component/service changes remain minimal and implementation-focused.

## Project Structure

### Documentation (this feature)

```text
specs/006-image-cache/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── image-cache-commands.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── features/
│   └── library/
│       ├── store/
│       │   └── libraryStore.ts
│       └── components/
│           ├── LibraryView.tsx
│           └── ThumbnailStrip.tsx
├── infrastructure/
│   └── tauri.ts
└── shared/
    └── types/
        └── library.ts

src-tauri/
└── src/
    ├── lib.rs
    └── services/
        ├── file_system_service.rs
        ├── metadata_service.rs
        └── zip_service.rs
```

**Structure Decision**: Implement cache behavior in the existing library feature store and keep Rust commands/services as-is unless a minimal DTO addition is strictly needed.

## 1. Feature Overview

This enabler improves viewer navigation speed by keeping previous and next images ready in memory around the current image. It enforces deterministic eviction of distant images and a bounded cache budget, ensuring the app stays responsive without excessive memory growth.

## 2. Functional Requirements

- Maintain an active cache window centered on current image.
- Keep previous image in memory when index is valid.
- Keep next image in memory when index is valid.
- Release distant images outside active window.
- Enforce bounded memory budget to avoid unbounded growth.
- Prioritize retaining current and adjacent images.
- Handle first/last image boundaries safely.
- Recompute cache on sequential and jump navigation.
- Avoid duplicate cache entries per album/image index.

## 3. Technical Architecture

Use existing command-driven architecture:

React UI -> Zustand `libraryStore` navigation/cache policy -> Tauri invoke (`load_album_image`) -> Rust command handlers -> `ZipService`/`FileSystemService`.

### Frontend responsibilities

- Maintain viewer session state and runtime in-memory cache policy.
- Trigger lazy load for current image and adjacent prefetch targets.
- Evict out-of-window and over-budget entries deterministically.
- Keep UI rendering, keyboard/mouse navigation, and thumbnail synchronization.
- Prevent stale async navigation updates from overriding latest state.

### Backend (Rust) responsibilities

- Validate album existence and image index bounds.
- Load image bytes from ZIP archives through `ZipService` only.
- Route filesystem resolution and safety checks through `FileSystemService` only.
- Persist reading progress as currently implemented through `MetadataService`.
- Remain cache-storage agnostic for this feature version.

### Shared models

- Reuse `AlbumViewSession`, `LoadAlbumImageResponse`, `ViewerCommandError`.
- Add lightweight frontend-local cache shape in store (not persisted).
- Keep shared DTO changes minimal and only if compile-time typing requires it.

### Infrastructure services

- `src/infrastructure/tauri.ts`: invoke existing commands for image loading and progress save.
- `src-tauri/src/services/zip_service.rs`: remains sole ZIP image source.
- `src-tauri/src/services/file_system_service.rs`: remains sole filesystem access layer.
- `src-tauri/src/services/metadata_service.rs`: unchanged for cache persistence (none required).

## 4. Components to Implement

1. Extend `src/features/library/store/libraryStore.ts`:
   - Add viewer image cache map for full-size entries by `albumId:imageIndex`.
   - Add cache policy helpers: compute window, prefetch adjacent, estimate bytes, evict distant, enforce budget.
   - Integrate cache updates in `openAlbumViewer`, `goToImage`, and `closeViewer`.
2. Update `src/features/library/components/LibraryView.tsx`:
   - Keep existing navigation wiring.
   - Optionally surface non-blocking cache warning if prefetch fails.
3. Update `src/features/library/components/ThumbnailStrip.tsx` only if needed to reuse cache entries for thumbnails without extra fetches.
4. Keep `src/infrastructure/tauri.ts`, `src/shared/types/library.ts`, and Rust code unchanged unless a minimal type/helper adjustment is required during implementation.

## 5. Data Model

Detailed model is in [specs/006-image-cache/data-model.md](specs/006-image-cache/data-model.md). Core runtime entities:

- `ViewerImageCacheEntry`: in-memory image payload + metadata + estimated bytes.
- `CacheWindowState`: derived window and budget state.
- Existing `ViewerSession`: source of truth for current index.

No new persistent entities are introduced.

## 6. State Management

Use single existing Zustand store (`libraryStore`) and avoid creating a new store.

- Keep `viewerSession`, `viewerImage`, `viewerLoading`, `viewerError` as core state.
- Replace unbounded cache behavior with bounded cache policy.
- On navigation success:
  - set current image
  - ensure adjacent entries are available/prefetched
  - evict distant and over-budget entries
- On viewer close or album switch:
  - clear cache for prior session.

No global cache manager abstraction is added.

## 7. Rust Services

- `ZipService`: continues to serve each requested image lazily and by index.
- `FileSystemService`: continues to handle all file path resolution/access checks.
- `MetadataService`: continues reading progress persistence; no image cache persistence.

Expected code impact in Rust is none or minimal, since this feature is primarily an in-memory frontend enabler.

## 8. React Components

- `LibraryView`:
  - Keep controls and keyboard navigation unchanged.
  - Continue rendering from `viewerImage`.
- `ThumbnailStrip`:
  - Continue lazy thumbnail requests.
  - Optionally consume cache hits for already loaded indices to avoid duplicate loads.
- `AlbumCard`:
  - No direct cache changes required.

## 9. File System Interactions

- Frontend must not access local filesystem directly.
- Any path resolution remains in Rust `FileSystemService`.
- Any ZIP image read remains in Rust `ZipService`.
- No file copy/extract/duplication is introduced.
- No database file or schema is introduced.

## 10. Error Handling

- Prefetch failures are non-blocking: current image navigation remains primary.
- Primary image load failures keep recoverable behavior through existing viewer error handling.
- Out-of-range boundary navigation is clamped or ignored without crash.
- Stale async results are discarded using request id guard pattern.
- Internal logging remains technical and avoids logging image payload contents.

## 11. Testing Strategy

- Frontend store tests:
  - cache seeds on viewer open
  - adjacent prefetch after navigation
  - distant eviction behavior
  - budget enforcement behavior
  - duplicate-entry prevention
  - jump-navigation cache rebalance
- Frontend component tests:
  - next/previous interactions remain responsive
  - boundary behavior at first/last image
  - thumbnail selection remains synchronized
- Rust tests:
  - existing command behavior remains green (`load_album_image`, bounds, progress save)
- Manual validation:
  - long navigation session confirms bounded cache growth and smooth navigation.

## 12. Risks

- Estimated byte-size heuristic may not perfectly match actual process memory.
- Aggressive eviction could reduce cache hit rate if budget is set too low.
- Concurrent prefetch and direct navigation could race if request ordering is mishandled.
- Reusing full-size data URIs for thumbnails may still be heavy for very large images.

Mitigation: start with conservative defaults, keep deterministic eviction, and tune with measured tests.

## 13. Future Extensibility

- Optional configurable cache budget in settings (without changing current architecture).
- Optional Rust-side decoded image cache only if profiling proves frontend cache insufficient.
- Optional background prefetch policy tuning (e.g., adaptive window) based on real telemetry.

All future extensions must preserve lazy loading, ZIP source-of-truth, and no album-content duplication.

## Complexity Tracking

No constitution violations. No unjustified abstractions introduced.
