# Research: Image Navigation

## Decision 1: Keep navigation client-driven

- **Decision**: Handle next, previous, and direct thumbnail selection in the frontend store/component, not with new Rust navigation commands.
- **Rationale**: The backend already exposes the two primitives the feature needs: open the album, and load one image by index. Navigation is simple index arithmetic and does not justify a new backend command surface.
- **Alternatives considered**: Add `next_image` and `previous_image` Rust commands. Rejected because they duplicate trivial logic and widen the command surface without reducing complexity.

## Decision 2: Reuse existing image-loading command for visible thumbnails

- **Decision**: Use the existing image-by-index loading path for visible thumbnails, with a small frontend cache for images already on screen or about to enter the viewport.
- **Rationale**: This satisfies lazy loading without introducing a new persistence layer, database, or thumbnail-generation pipeline. It keeps ZIP access in `ZipService` and avoids duplicating album contents.
- **Alternatives considered**: Pre-generate thumbnails at import time or add a new cache database. Rejected because the constitution forbids unnecessary duplication and new storage layers.

## Decision 3: Keep reading progress as the only persisted viewer state

- **Decision**: Persist only the last viewed image index per album through `MetadataService`.
- **Rationale**: The project already stores reading progress, and the feature only needs that state to restore the viewer correctly.
- **Alternatives considered**: Persist thumbnail scroll position or the full viewer session. Rejected because those are UI concerns and should not be durable metadata.

## Decision 4: Use one scrollable thumbnail rail

- **Decision**: Implement the thumbnail list as one horizontally scrollable strip that keeps the active thumbnail visible.
- **Rationale**: This directly matches the specification, is easy to reason about, and can be tested with user interaction and scroll assertions.
- **Alternatives considered**: Grid layouts, pagination, or a dedicated virtualization dependency. Rejected because they add UI complexity without immediate value.

## Decision 5: Keep the store as the orchestration point

- **Decision**: Use the existing Zustand store to orchestrate image navigation and progress persistence.
- **Rationale**: The current app already centralizes viewer state there, so extending that store keeps the implementation simple and maintainable.
- **Alternatives considered**: Add a second viewer store or introduce a service layer between React and the store. Rejected because they would create avoidable indirection.
