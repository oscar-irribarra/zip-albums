# Quickstart: Validate Settings Persistence

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

### Scenario A: Configure and persist all settings

1. Open settings UI.
2. Change theme.
3. Set albums folder.
4. Toggle fullscreen preference.
5. Toggle remember-last-album.
6. Set initial zoom.
7. Save.
8. Close app fully and reopen.

Expected:

- All values match saved values after relaunch.
- No crash or reset to defaults unless values were invalid.

### Scenario B: Remember last album enabled

1. Enable remember-last-album in settings.
2. Open an album and move to any image.
3. Close app and relaunch.

Expected:

- App restores that album context on startup.
- Theme/fullscreen/zoom are already applied.

### Scenario C: Remember last album disabled

1. Disable remember-last-album.
2. Open an album.
3. Relaunch app.

Expected:

- App does not auto-open the last album.
- Other settings still persist.

### Scenario D: Inaccessible folder recovery

1. Save a folder path as albums directory.
2. Make folder inaccessible (rename/remove/permission change).
3. Relaunch app.

Expected:

- App starts normally.
- Warning message explains folder is unavailable and how to recover.
- User can choose a new folder.

## Contract References

- Settings commands contract: [contracts/settings-commands.md](contracts/settings-commands.md)
- Data model details: [data-model.md](data-model.md)
