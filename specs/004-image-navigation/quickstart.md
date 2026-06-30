# Quickstart: Validate Image Navigation

## Prerequisites

- Install dependencies with `pnpm install`
- Have Tauri build prerequisites available for your platform
- Import at least one album containing multiple supported images

## Run the app

```bash
pnpm run tauri dev
```

## Validation Scenarios

### 1) Next and previous buttons

1. Open an album in the viewer.
2. Click `Next` until the last image.
3. Click `Previous` until the first image.

Expected:

- The image advances and retreats one step at a time.
- The buttons disable or stop at the album boundaries.

### 2) Keyboard navigation

1. Focus the viewer.
2. Press the left arrow key.
3. Press the right arrow key.

Expected:

- Left arrow moves to the previous image.
- Right arrow moves to the next image.

### 3) Thumbnail selection

1. Open the thumbnail strip.
2. Click a thumbnail far from the current selection.

Expected:

- The main viewer shows the selected image.
- The clicked thumbnail becomes highlighted.

### 4) Auto-scroll and visibility

1. Select a thumbnail near the edge of the thumbnail strip.
2. Observe the strip after the image changes.

Expected:

- The strip scrolls so the selected thumbnail remains visible.
- The active thumbnail stays in view after each navigation change.

### 5) Progress restore

1. Open an album.
2. Move to a later image.
3. Close and reopen the same album.

Expected:

- The viewer restores the last viewed image index.
- The selected thumbnail matches the restored image.

## Automated checks

```bash
pnpm test
cargo test
```

Expected:

- Frontend tests pass for navigation, keyboard, and thumbnail behavior.
- Rust tests pass for album open, image load, and progress persistence.
