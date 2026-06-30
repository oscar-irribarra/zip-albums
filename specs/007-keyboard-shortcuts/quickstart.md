# Quickstart: Validate Keyboard Shortcuts

## Prerequisites

- Node and pnpm installed
- Rust toolchain installed
- Tauri dependencies available for your OS

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Run frontend tests:

```bash
pnpm test
```

3. Run Rust tests:

```bash
cd src-tauri
cargo test
```

4. Run app in dev mode:

```bash
pnpm run tauri dev
```

## Validation Scenarios

## Shortcut Scope Matrix

| Shortcut | Scope | Context Guard | Expected Command Path |
|----------|-------|---------------|------------------------|
| ArrowLeft | Viewer | `viewerSession.current_index > 0` | `goToImage(current-1)` -> `load_album_image` |
| ArrowRight | Viewer | `viewerSession.current_index < total-1` | `goToImage(current+1)` -> `load_album_image` |
| Home | Viewer | `viewerSession.total_images > 0` | `goToImage(0)` -> `load_album_image` |
| End | Viewer | `viewerSession.total_images > 0` | `goToImage(total-1)` -> `load_album_image` |
| F | Viewer | viewer active and not fullscreen | frontend fullscreen API only |
| Escape | Viewer/Window | fullscreen active | frontend fullscreen API only |
| Ctrl+O | Global | not editable target | dialog `open` -> `import_album` |
| Delete | Library/Viewer | selected album exists and confirmed | `deleteAlbum` -> `delete_album` |

### Scenario A: Previous/next navigation shortcuts

1. Open any album with at least 3 images.
2. Open viewer on a middle image.
3. Press Left and Right arrow keys.

Expected:

- Left shows previous image.
- Right shows next image.
- No crash or out-of-range errors.

### Scenario B: First/last navigation shortcuts

1. Open viewer for an album with multiple images.
2. Press Home.
3. Press End.

Expected:

- Home jumps to first image.
- End jumps to last image.

### Scenario C: Fullscreen shortcuts

1. Open viewer.
2. Press F.
3. Press Escape.

Expected:

- F enters fullscreen.
- Escape exits fullscreen.

### Scenario D: Import shortcut

1. Focus the app window.
2. Press Ctrl+O.
3. Pick a valid ZIP file.

Expected:

- ZIP import flow opens and completes through existing command path.
- Imported album appears in library list.

### Scenario E: Delete shortcut

1. Ensure an album is selected/active for deletion flow.
2. Press Delete.
3. Confirm dialog.

Expected:

- Album is removed from library.
- If confirmation is canceled, no deletion occurs.

### Scenario F: Editable focus guard

1. Focus a text input or select in settings/library UI.
2. Press shortcut keys (arrows, delete, Ctrl+O).

Expected:

- Text editing behavior is preserved.
- No global shortcut action is executed while editing.

## Contract References

- Shortcut command contract: [contracts/keyboard-shortcuts-commands.md](contracts/keyboard-shortcuts-commands.md)
- Data model details: [data-model.md](data-model.md)

## Validation Notes (2026-06-30)

- Foundational validation:
	- `pnpm exec tsc --noEmit`: PASS
	- `pnpm test -- --run src/features/library/components/LibraryView.test.tsx src/features/library/store/libraryStore.test.ts`: PASS
	- `cargo test`: PASS
- Story validation:
	- Scenarios A-B (US1): PASS via `LibraryView.test.tsx` keyboard navigation tests
	- Scenario C (US2): PASS via fullscreen shortcut tests for `F` and `Escape`
	- Scenarios D-E (US3): PASS via import/delete keyboard flow tests and store command-path regressions
	- Scenario F (focus guard): PASS via editable-target keyboard guard tests
