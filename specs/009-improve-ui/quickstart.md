# Quickstart Validation Guide: Improve UI Navigation Experience

**Feature**: 009-improve-ui  
**Date**: 2026-07-10

---

## Prerequisites

- Application built and running: `pnpm tauri dev`
- At least 2 albums imported (with different cover image proportions for US-005)
- At least 1 album with 5+ images (for thumbnail strip validation)

---

## US-001 — Settings FAB

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open the application | FAB with gear icon is visible in the bottom-right corner |
| 2 | Scroll through the album list | FAB remains visible, does not move |
| 3 | Open the image viewer | FAB remains visible and does not overlap the image area |
| 4 | Switch theme to Dark | FAB is still visible and readable |
| 5 | Switch theme to Light | FAB is still visible and readable |
| 6 | Confirm old settings section | The inline settings section at the top of the layout is gone |

---

## US-002 — Settings Side Panel

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click the FAB | Side panel slides in from the right |
| 2 | Verify panel contents | Theme, albums directory, initial zoom, fullscreen, remember last album are all present |
| 3 | Click the X button | Panel slides out and closes |
| 4 | Open panel again | Panel is open |
| 5 | Click outside the panel (on the backdrop) | Panel closes |
| 6 | Open panel again | Panel is open |
| 7 | Press ESC key | Panel closes |
| 8 | Change a setting (e.g., theme) | Setting takes effect; panel remains open until dismissed |

---

## US-003 — Thumbnail Strip

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open an album with 5+ images | Thumbnail strip is NOT visible by default |
| 2 | Move mouse over the thumbnail area at the bottom of the viewer | Strip appears with transition |
| 3 | Move mouse away from the strip area | Strip hides with transition |
| 4 | Click the pin/toggle button in the viewer toolbar | Strip locks to visible regardless of hover |
| 5 | Move mouse away from the strip | Strip stays visible (pinned) |
| 6 | Click the toggle button again | Strip unpins and hides when not hovering |
| 7 | Compare strip height to previous design | Strip card height is visibly smaller (~64px) |

---

## US-004 — Image Viewer

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open an album | Image displays; image occupies more vertical space than before |
| 2 | Navigate to the next image | No layout shift; viewer frame size is stable |
| 3 | Observe during navigation | Skeleton placeholder (same proportions as previous image) shown while next image loads |
| 4 | Locate zoom controls | Three buttons (zoom-in, zoom-out, reset) visible in the top-right of the image frame |
| 5 | Click zoom-in | Image zooms in; clicking again zooms more |
| 6 | Click zoom-out | Image zooms out |
| 7 | Click reset zoom | Image returns to 1.0× zoom |
| 8 | Navigate to a different image while zoomed | Zoom resets to 1.0× |
| 9 | Open a different album | Zoom resets to 1.0× |

---

## US-005 — Album Card Uniformity

| Step | Action | Expected |
|------|--------|----------|
| 1 | View the library with multiple albums | All cards are the same width and height |
| 2 | Inspect cover images of different albums | All covers have the same aspect ratio (3:4), cropped/fitted uniformly |
| 3 | Compare albums with portrait vs landscape cover images | Both render at the same 3:4 crop — no card is taller/shorter |
| 4 | Add a new album with a different-ratio first image | New card appears at the same size as all others |
