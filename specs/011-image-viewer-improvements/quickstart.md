# Quickstart Validation Guide: Image Viewer Improvements

**Feature**: 011-image-viewer-improvements
**Date**: 2026-07-10

---

## Prerequisites

- Application built and running: `pnpm tauri dev` from project root.
- At least one album imported (ZIP file with multiple images).
- A second theme available to switch to (Settings → Theme: Dark / Light).

---

## Scenario 1 — Zoom Controls (US-001)

**Purpose**: Validate zoom in, zoom out, reset, pan, and centering.

**Steps**:
1. Open the application and click on any album to enter the viewer.
2. Observe the image at default zoom — it should be centered in the frame.
3. Click the `+` zoom button.
   - **Expected**: Image grows. Zoom step is `+0.25×`. Image stays centered after zoom.
4. Click `+` repeatedly until it stops increasing.
   - **Expected**: Maximum zoom is `4.0×`. No further increase beyond that.
5. Click the `−` zoom button.
   - **Expected**: Image shrinks by `0.25×` per click. Image stays centered.
6. Click `−` repeatedly until it stops.
   - **Expected**: Minimum zoom is `0.5×`. No further decrease below that.
7. With the image zoomed in (e.g., `2.0×`), drag the image with the mouse.
   - **Expected**: Image pans. Cursor changes from `grab` to `grabbing` while dragging.
   - **Expected**: Image cannot be dragged so far that empty space appears inside the frame boundary.
8. Click the reset zoom (`○`) button.
   - **Expected**: Zoom returns to `1.0×`. `panOffset` resets to center. Image is centered.

---

## Scenario 2 — Image Change State Reset (US-002)

**Purpose**: Validate that zoom and position reset on every navigation.

**Steps**:
1. Open any album in the viewer.
2. Zoom in to `2.0×` and drag the image to a corner.
3. Press `ArrowRight` (or click `Next`).
   - **Expected**: New image appears at `1.0×` zoom, centered. No pan offset from previous image.
4. Zoom in again, then press `ArrowLeft` (or click `Previous`).
   - **Expected**: Same reset behavior — image appears at default zoom and centered.
5. Press `Home` to jump to the first image.
   - **Expected**: Zoom = `1.0×`, image centered.
6. Press `End` to jump to the last image.
   - **Expected**: Zoom = `1.0×`, image centered.
7. Switch the application theme (Settings → Dark).
8. Navigate to a new image and observe the loading skeleton.
   - **Expected**: Skeleton shimmer colors match the dark theme (dark gray tones, not the light-gray seen in light mode).
9. Switch back to Light theme.
   - **Expected**: Skeleton shimmer colors match the light theme.

---

## Scenario 3 — Thumbnail Strip (US-003)

**Purpose**: Validate strip is hidden by default, reveals on hover, and does not affect image size.

**Steps**:
1. Open any album in the viewer.
   - **Expected**: The thumbnail strip is not visible. Only a narrow hover bar (16px) is visible at the bottom.
2. Move the mouse over the narrow hover bar at the bottom of the viewer.
   - **Expected**: The thumbnail strip slides into view with portrait (vertical) thumbnail cards.
   - **Expected**: The main image in the viewer does **not** resize or shift — its display area is unchanged.
3. Move the mouse away from the thumbnail strip area.
   - **Expected**: The thumbnail strip hides. The image remains at the same size and position.
4. Inspect a thumbnail card in the strip.
   - **Expected**: Thumbnail card shape is taller than it is wide (portrait/vertical orientation, approximately 3:4 ratio).
5. Click a thumbnail while the strip is visible.
   - **Expected**: The viewer navigates to that image. Zoom resets to `1.0×`, position resets to center.
6. Click the `Thumbnails` action button (below the image).
   - **Expected**: Thumbnail strip becomes pinned (visible without hover). Clicking again unpins it.
7. While the strip is visible (pinned), measure the image frame height visually.
   - **Expected**: The image frame height is identical whether the strip is visible or hidden.

---

## Scenario 4 — Navigation Button Layout (US-004)

**Purpose**: Validate Back button position/theming and centered Prev/Next/Thumbnails layout.

**Steps**:
1. Open any album in the viewer.
2. Inspect the layout:
   - **Expected**: The `← Back` button appears **above** the image display area, not overlapping the image.
   - **Expected**: `Previous`, `Thumbnails`, and `Next` buttons appear **below** the image display area, centered horizontally.
3. Switch to **Dark theme** (Settings → Dark).
   - **Expected**: The `← Back` button adapts its colors (border, text) to the dark theme — no hardcoded light-gray border visible.
   - **Expected**: The `Previous`, `Next`, `Thumbnails` buttons also adapt to the dark theme.
4. Switch back to **Light theme**.
   - **Expected**: All buttons return to light theme styling.
5. Click `← Back`.
   - **Expected**: Application navigates back to the library screen.
6. Re-open an album.
7. Click `Previous` (if not on the first image) — **Expected**: navigates to previous image.
8. Click `Next` (if not on the last image) — **Expected**: navigates to next image.
9. On the **first** image, verify `Previous` is disabled.
10. On the **last** image, verify `Next` is disabled.

---

## Notes

- All scenarios can be run without a network connection (offline-first validation).
- No ZIP files are modified at any point — verify by checking the source ZIP file's `last modified` timestamp after all operations.
- If the Tauri dev server is running, use the browser devtools (F12 → Elements) to inspect computed CSS and confirm class names match the plan.
