# Research: Keyboard Shortcuts

## Decision 1: Implement shortcut handling in existing `LibraryView` keyboard listener

- Decision: Extend the current `window` `keydown` handler in `LibraryView` instead of introducing a hotkey library.
- Rationale: The feature scope is limited, existing handling for Arrow keys already exists, and adding another dependency/layer would be unnecessary.
- Alternatives considered:
  - External hotkey library: rejected due to overengineering for a small, explicit shortcut set.
  - Global app-wide shortcut manager module: rejected for v1 because shortcuts are centered in existing library/viewer context.

## Decision 2: Keep shortcut actions mapped to existing store commands

- Decision: Reuse `goToImage`, `importAlbum`, `deleteAlbum`, and existing viewer control flow rather than adding parallel action paths.
- Rationale: Reduces duplication and keeps behavior identical between button and keyboard interactions.
- Alternatives considered:
  - New keyboard-only command methods in store: rejected as redundant and harder to maintain.

## Decision 3: Apply strict context/focus guards

- Decision: Ignore shortcuts when focus is inside editable controls (`input`, `textarea`, `select`, `contentEditable`) and when context is invalid.
- Rationale: Prevents accidental destructive/irrelevant actions and aligns with accessibility expectations.
- Alternatives considered:
  - Always-on global shortcuts: rejected because it risks unintended actions while typing.

## Decision 4: Use existing Tauri command boundaries for import/delete/image operations

- Decision: Keep frontend invoking existing infrastructure functions in `src/infrastructure/tauri.ts`; no direct filesystem code in React.
- Rationale: Preserves constitutional separation of responsibilities and avoids security regressions.
- Alternatives considered:
  - Frontend-side file operations: rejected because filesystem access must remain in infrastructure services.

## Decision 5: Keep Rust services unchanged unless behavior gap is found

- Decision: Do not add new Rust services or commands for this feature; rely on existing command contracts.
- Rationale: Keyboard shortcuts are an interaction layer enhancement, not a backend domain change.
- Alternatives considered:
  - New Rust keyboard command API: rejected as unnecessary coupling.

## Decision 6: Preserve lazy loading behavior

- Decision: Navigation shortcuts continue to trigger per-image lazy loading through existing viewer flow.
- Rationale: Maintains memory efficiency and constitutional lazy loading requirement.
- Alternatives considered:
  - Preloading additional ranges on key events: rejected because not required by this feature and may increase memory use.
