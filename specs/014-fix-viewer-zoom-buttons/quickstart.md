# Quickstart: Validate Fix — Viewer Zoom Controls

**Feature**: 014-fix-viewer-zoom-buttons  
**Date**: 2026-07-11

---

## Prerequisites

- Node.js ≥ 20, pnpm ≥ 9, Rust stable toolchain, Tauri CLI v2 installed.
- A valid ZIP album file with at least one image available locally.

---

## 1. Run the Unit Test Suite

```powershell
cd C:\Users\Osc-r\source\library
pnpm test
```

**Expected output**: All test files pass with 0 failures. The following test groups are relevant to this fix:

| Group | Key assertions |
|-------|---------------|
| `ViewerScreen — Zoom In/Out (US1)` | `setZoomLevel` called with `1.1` on zoom-in, `0.25` clamped on zoom-out at min |
| `ViewerScreen — Pan (US2)` | Drag still updates `translate` transform correctly |
| `ViewerScreen — Reset (US3)` | `setZoomLevel(1)` called, image transform returns to `translate(0px, 0px) scale(1)` |

---

## 2. Start the Development Build

```powershell
pnpm tauri dev
```

Wait for the Tauri window to open.

---

## 3. Manual Validation Scenarios

### SC-001 — Zoom In

1. Import or open an existing album.
2. Click any image to open the viewer.
3. Click the **"+"** zoom button.
4. **Verify**: image visibly enlarges. Click multiple times — image continues to grow up to the maximum size. The button does not become unresponsive after a single click.

### SC-002 — Zoom Out

1. Zoom in at least two steps with **"+"**.
2. Click the **"−"** zoom button.
3. **Verify**: image shrinks by one step per click. Continue until minimum — the image stops at the minimum size and does not shrink further.

### SC-003 — Reset Zoom

1. Zoom in and drag the image off-center.
2. Click the **"○"** reset button.
3. **Verify**: image returns to 100% scale and re-centers in the viewport in a single click.

### SC-004 — Zoom and Pan Do Not Interfere

1. Zoom in with **"+"**.
2. Click and drag the image to pan it.
3. Release the mouse.
4. Click **"+"** or **"−"** again.
5. **Verify**: the click fires immediately with no delay or stuck state. Pan transform is independent of zoom level changes.

### SC-005 — Zoom While Loading

1. Navigate rapidly between images (arrow keys or Previous/Next buttons).
2. While the loading indicator is visible, click **"+"**.
3. **Verify**: no console errors; when the image finishes loading, the zoom level applied is the one set during loading (not reverted to 1).

---

## 4. Regression Checks

| Scenario | Expected result |
|----------|----------------|
| Arrow key navigation resets zoom | Zoom returns to 100% on each navigation |
| Home / End keys navigate | Correct image loads, zoom reset |
| Thumbnail strip hover / pin | Thumbnail strip shows and hides normally |
| Back to library | Viewer closes, library screen renders |
| Fullscreen toggle (F key) | Enters/exits fullscreen correctly |

---

## 5. Verify No Console Errors

Open DevTools (F12 in the Tauri WebView, or via `pnpm tauri dev` with `--verbose`). Perform the manual
scenarios above. **Expected**: no `DOMException`, no `TypeError`, no `Warning` related to pointer capture
or zoom controls.

---

## References

- Data model: [data-model.md](../data-model.md)
- Spec: [spec.md](../spec.md)
- Implementation: [src/features/viewer/components/ViewerScreen.tsx](../../../src/features/viewer/components/ViewerScreen.tsx)
- Tests: [src/test/ViewerScreen.test.tsx](../../../src/test/ViewerScreen.test.tsx)
