# Research: Image Cache

## Decision 1: Implement cache window in frontend store

- Decision: Implement the in-memory image cache window in `libraryStore` as session-local state.
- Rationale: The cache is purely runtime UI performance behavior, does not require persistence, and can be managed simply where navigation state already exists.
- Alternatives considered:
  - Rust-side cache manager: rejected for v1 because it adds cross-boundary cache lifecycle complexity without a confirmed need.
  - Separate frontend cache service module: rejected as unnecessary abstraction; store-level functions are sufficient.

## Decision 2: Use explicit adjacent prefetch policy (N-1, N, N+1)

- Decision: On each successful navigation, keep previous/current/next image candidates in memory and prefetch missing adjacent entries.
- Rationale: Directly satisfies feature criteria and keeps memory bounded and predictable.
- Alternatives considered:
  - Wider prefetch windows (e.g. +/-2 or more): rejected due to increased memory usage and weaker simplicity.
  - No prefetch: rejected because it fails the latency objective for immediate next/previous navigation.

## Decision 3: Enforce bounded cache by entry count and approximate bytes

- Decision: Enforce a small max-entry window and an approximate memory budget using image-source length as a practical estimate.
- Rationale: Browser memory APIs are not consistently available in Tauri WebView; a conservative app-level estimate is simple and testable.
- Alternatives considered:
  - Precise process memory tracking: rejected because it is platform-specific and overengineered for this scope.
  - Unlimited cache with periodic clear-all: rejected because it causes churn and can spike memory.

## Decision 4: Keep image loading lazy and command-driven

- Decision: Continue loading images only on demand through existing `load_album_image` command and only prefetch immediate neighbors.
- Rationale: Preserves constitution lazy-loading principle and avoids eager loading entire albums.
- Alternatives considered:
  - Preload full album after open: rejected because it violates lazy loading and memory constraints.

## Decision 5: Keep Rust responsibilities unchanged and explicit

- Decision: Keep Rust responsible for ZIP reads and filesystem interactions through existing services; no new cache persistence in Rust.
- Rationale: Maintains clear separation of concerns and avoids unnecessary backend complexity.
- Alternatives considered:
  - Persisting cache metadata or image blobs: rejected because specification does not require persistence and forbids content duplication.

## Decision 6: Add deterministic eviction policy for distant images

- Decision: Evict entries outside the active window first; if budget is still exceeded, evict farthest-from-current entries next.
- Rationale: Aligns with user-visible smoothness goals while keeping behavior deterministic and testable.
- Alternatives considered:
  - Pure LRU eviction: rejected for v1 because distance-to-current is a better fit for viewer navigation semantics.
