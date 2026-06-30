# Quickstart: Validate Import ZIP Albums

## Goal

Validate the ZIP import feature end-to-end in local desktop development.

## Prerequisites

- Node and pnpm installed.
- Rust toolchain installed for Tauri.
- Project dependencies installed.
- Test ZIP fixtures available:
  - valid ZIP with images
  - corrupted ZIP
  - empty ZIP
  - ZIP with no supported images
  - duplicate ZIP (already imported)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start the app:

```bash
pnpm run tauri dev
```

## Validation Scenarios

1. Successful import:
   - Select a valid ZIP with at least one supported image.
   - Expected: album appears immediately in library list.
   - Expected: cover corresponds to first valid image in ZIP order.

2. Mixed entries import:
   - Select ZIP containing images and unsupported files.
   - Expected: import succeeds, unsupported files ignored.
   - Expected: image order in album matches ZIP internal order.

3. Non-ZIP rejection:
   - Select a non-ZIP file.
   - Expected: `UNSUPPORTED_FORMAT` message shown.

4. Corrupted ZIP rejection:
   - Select corrupted ZIP.
   - Expected: `ZIP_CORRUPTED` message shown.

5. Empty ZIP rejection:
   - Select empty ZIP.
   - Expected: `ZIP_EMPTY` message shown.

6. No-image ZIP rejection:
   - Select ZIP with only unsupported files.
   - Expected: `NO_SUPPORTED_IMAGES` message shown.

7. Duplicate ZIP rejection:
   - Import a valid ZIP twice.
   - Expected: second import shows `DUPLICATE_ALBUM` and does not alter library.

## Checks Against Design Artifacts

- Data model alignment: [specs/002-import-zip/data-model.md](specs/002-import-zip/data-model.md)
- Command contract alignment: [specs/002-import-zip/contracts/import-zip-commands.md](specs/002-import-zip/contracts/import-zip-commands.md)
- Plan alignment: [specs/002-import-zip/plan.md](specs/002-import-zip/plan.md)

## Pass Criteria

- Every required error case produces the expected message.
- Successful import updates library immediately.
- Failed imports do not modify existing library entries.
- ZIP order and cover selection behavior match specification.