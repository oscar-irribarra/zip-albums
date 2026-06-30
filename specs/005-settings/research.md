# Research: Settings Persistence

## Decision 1: Persist settings inside existing local metadata file

- Decision: Extend `albums_catalog.json` with a `settings` object and `last_opened_album_id`.
- Rationale: Reuses existing metadata lifecycle, avoids adding a new persistence system, and keeps all metadata local/offline.
- Alternatives considered:
  - Separate `settings.json` file: rejected to avoid duplicate persistence paths and migration overhead.
  - SQLite or embedded database: rejected because requirements only need simple metadata persistence.

## Decision 2: Keep filesystem validation in Rust infrastructure

- Decision: Validate and canonicalize `albums_directory` only through `FileSystemService`.
- Rationale: Constitution requires filesystem access to stay in infrastructure services; React should not touch local filesystem APIs.
- Alternatives considered:
  - Frontend-only path checks: rejected due to separation-of-responsibilities violation.
  - Validation in command handlers directly: rejected to keep filesystem concerns centralized.

## Decision 3: Add dedicated settings commands instead of overloading viewer commands

- Decision: Introduce explicit commands for startup settings context and settings updates.
- Rationale: Keeps API explicit, testable, and maintainable; avoids hidden side effects in unrelated commands.
- Alternatives considered:
  - Piggyback on `get_library`: rejected because it conflates library data and settings lifecycle.
  - Mutate settings only from `open_album_viewer`: rejected because not all preferences are viewer-related.

## Decision 4: Use small dedicated frontend settings module

- Decision: Add `src/features/settings` with one panel component and one small store.
- Rationale: Keeps `libraryStore` focused, avoids overloading existing viewer state, and remains minimal.
- Alternatives considered:
  - Add all settings logic to `libraryStore`: rejected due to growing mixed responsibilities.
  - Introduce large domain architecture layer: rejected as overengineering.

## Decision 5: Startup restoration as single Rust-driven context response

- Decision: Return effective settings + optional `restore_album_id` in one startup command.
- Rationale: Prevents split-brain startup logic and simplifies frontend initialization order.
- Alternatives considered:
  - Multiple frontend calls and manual merge: rejected due to race risk and duplicated logic.

## Decision 6: Preserve lazy loading constraints

- Decision: Do not change image loading behavior; keep loading on demand through existing image commands.
- Rationale: Constitution requires lazy loading for images and forbids preloading full albums.
- Alternatives considered:
  - Eager preload to improve reopen speed: rejected due to memory/performance constraints.
