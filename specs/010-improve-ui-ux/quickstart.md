# Quickstart Validation Guide: Improve UI/UX (010)

**Date**: 2026-07-10
**Feature**: [spec.md](./spec.md)
**Contracts**: [contracts/ui-ux-commands.md](./contracts/ui-ux-commands.md)

---

## Prerequisites

- Rust toolchain and Tauri CLI installed
- `pnpm install` completed
- At least one ZIP file containing numbered images (e.g. `00.jpg`, `01.jpg`) available on disk
- Application built or running in dev mode: `pnpm tauri dev`

---

## Scenario 1: Library screen is independent

**Steps**

1. Launch the application.
2. Observe the initial screen.

**Expected**

- Only the album grid and toolbar (Sort by, Import ZIP) are visible.
- No image viewer controls (Previous, Next, Back, zoom buttons) are visible.
- The Import ZIP button is present in the toolbar.

---

## Scenario 2: Album covers load from ZIP

**Steps**

1. Import a ZIP album that starts with files named `00.jpg`, `01.jpg`, etc.
2. Observe the album card that appears in the grid.

**Expected**

- The cover displayed on the card matches the image named `00.jpg` (or the alphabetically-first image) inside the ZIP.
- The cover respects its original aspect ratio (no squishing or stretching).
- No external image or placeholder is used (vite.svg must not appear unless the ZIP has no valid images).

---

## Scenario 3: Delete does not remove the ZIP file

**Steps**

1. Note the file path of an imported album's ZIP on disk.
2. Click the **Delete** button on its album card.
3. Confirm the deletion in the dialog.
4. Check the filesystem at the ZIP's original path.

**Expected**

- The album card disappears from the library immediately.
- The original ZIP file is still present at its path on disk.
- The dialog text does NOT say "Delete album and its ZIP file" — it must only reference removing from the library.

---

## Scenario 4: Viewer is independent and has Back button

**Steps**

1. Click **Open** on any album card.
2. Observe the viewer screen.
3. Click the **Back** (or "Back to Library") button.

**Expected**

- The viewer occupies the full app area; the album grid is not visible behind or alongside it.
- The viewer shows only controls relevant to the open album (no other album's info).
- Clicking Back returns to the library grid.
- The Import ZIP button is NOT visible on the viewer screen.

---

## Scenario 5: Zoom and pan within viewer

**Steps**

1. Open any album.
2. Click the **+** zoom button several times until `zoom > 1`.
3. Click and drag the image inside the viewer frame.

**Expected**

- The image pans in the direction of drag.
- The image edge cannot be dragged past the viewer boundary (image stays within the frame).
- Releasing the mouse stops panning.
- Navigating to the next image resets both zoom and pan to defaults.

---

## Scenario 6: Viewer background matches theme

**Steps**

1. Set theme to **Dark** in Settings.
2. Open any album in the viewer.

**Expected**

- The viewer background matches the dark theme surface color.
- There is no visible "white box" or light-colored region behind the image.

**Repeat with Light theme:**

- Viewer background is light/white — consistent with light theme.

---

## Scenario 7: Thumbnail strip behaviour

**Steps**

1. Open any album. Verify the thumbnail strip is **not visible**.
2. Move the cursor to the narrow bar at the very bottom of the viewer.
3. Observe the strip appearing.
4. Move the cursor away from the strip and the hover zone.
5. Observe the strip hiding.
6. Click the **Thumbnails** toggle button.
7. Observe the strip appearing and remaining visible even without hovering.
8. Move cursor away — strip stays visible.
9. Click the Thumbnails toggle button again.
10. Observe the strip hiding.

**Expected at each step**

1. Strip is hidden; only a narrow hover-trigger bar is visible at the bottom.
2. Strip expands and shows thumbnails at a comfortably large size.
3. (strip visible)
4. Strip hides.
5. (strip hidden)
6. Strip appears and is pinned.
7. (strip visible without hover)
8. Strip stays visible (pinned).
9. Strip hides.
10. Back to hidden state.

---

## Scenario 8: Thumbnail strip is visually separated

**Steps**

1. Toggle the thumbnail strip visible.
2. Observe the layout.

**Expected**

- There is a visible gap or border between the main image area and the thumbnail strip.
- The strip does not overlap or occlude the image.
- Thumbnails are larger than before (previous size was 96×64 px; new size should be noticeably bigger).

---

## Failure indicators (things that must NOT happen)

| Action | Must NOT happen |
|---|---|
| Delete album | ZIP file removed from disk |
| Library screen | Image viewer controls visible |
| Viewer screen | Library grid visible |
| Viewer screen | Import ZIP button visible |
| Hover away from strip | Strip stays visible (without pin) |
| Zoom level = 1 | Drag moves image out of frame |
| Dark theme | White/light background visible in viewer frame |
