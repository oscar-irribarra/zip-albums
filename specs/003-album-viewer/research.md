# Research: Album Viewer

## Decision 1: Keep viewer architecture command-based with Tauri invoke

- Decision: React UI calls Rust commands via the existing Tauri invoke bridge for album open, image load, and progress persistence.
- Rationale: Matches current app architecture, keeps business logic in Rust, and avoids adding new communication layers.
- Alternatives considered: Direct filesystem reads in React (rejected: violates constitution separation and filesystem constraints); introducing IPC wrapper framework (rejected: unnecessary abstraction).

## Decision 2: Persist reading progress as metadata only

- Decision: Store per-album last viewed image index in local metadata managed by Rust `MetadataService`.
- Rationale: Constitution allows metadata persistence and forbids duplicating album content; no database is required.
- Alternatives considered: Client-only in-memory progress (rejected: does not survive reopen); SQLite database (rejected: overengineering and not required by spec).

## Decision 3: Use lazy image loading by index

- Decision: Load only the currently visible image from ZIP by image index on navigation.
- Rationale: Explicit requirement and constitution principle on lazy loading/performance.
- Alternatives considered: Preloading whole album (rejected: memory-heavy and prohibited); preloading adjacent pages in v1 (rejected: not required for MVP).

## Decision 4: Route ZIP operations through `ZipService`

- Decision: All ZIP inspection and image extraction operations stay in `ZipService`.
- Rationale: Centralizes ZIP safety rules, ordering behavior, and supported format checks.
- Alternatives considered: Duplicating ZIP parsing in multiple services (rejected: complexity and inconsistency risk).

## Decision 5: Route filesystem access through infrastructure services

- Decision: All path validation and file reads are performed through Rust infrastructure services (`FileSystemService`, `ZipService`).
- Rationale: Constitution requires filesystem access to be isolated from UI and feature components.
- Alternatives considered: Accessing local files from frontend APIs directly (rejected: violates architecture boundaries).

## Decision 6: Error model with stable categories

- Decision: Define typed error categories for album open/image load/progress restore failures and map them to actionable user messages.
- Rationale: Improves recoverability while keeping internal details logged in Rust.
- Alternatives considered: Generic error string only (rejected: poor UX and weak diagnostics).

## Decision 7: Scope

- Decision: Implement album open from cover, header context (name + counter), current-image-only loading, and progress save/restore only.
- Rationale: Delivers required user value with smallest maintainable change set.
- Alternatives considered: Zoom, slideshow, thumbnails, and background prefetch (rejected: out of scope).
