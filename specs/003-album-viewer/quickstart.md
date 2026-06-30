# Quickstart: Validate Album Viewer

## Prerequisites

- Dependencies installed (`pnpm install`)
- Tauri build dependencies available
- At least one imported album with supported images in the library catalog

## Run

```bash
pnpm run tauri dev
```

## Validation Scenarios

## 1) Open album from cover when no progress exists

1. Ensure selected album has no saved progress.
2. Open the album from library.
3. Verify first visible image is cover (index `0`).
4. Verify header shows album name and counter `1 / total`.

Expected:

- Viewer starts from cover.
- Name and counter are visible.

## 2) Save and restore progress

1. Open album and navigate to a later image (for example index `5`).
2. Close viewer.
3. Reopen same album.

Expected:

- Viewer starts at saved index.
- Counter matches restored position.

## 3) Invalid stored progress fallback

1. Prepare progress with index outside current bounds.
2. Open album.

Expected:

- Viewer safely falls back to cover index `0`.

## 4) Lazy loading behavior

1. Open a large album.
2. Navigate image by image.
3. Observe runtime logs/behavior.

Expected:

- Only current image is requested/loaded per navigation step.
- No full-album preload behavior.

## 5) Per-album progress isolation

1. Open Album A and save progress at index `n`.
2. Open Album B and save progress at index `m`.
3. Reopen both albums.

Expected:

- Album A restores `n`.
- Album B restores `m`.
- No cross-overwrites.

## References

- Command contract: [contracts/album-viewer-commands.md](contracts/album-viewer-commands.md)
- Data model: [data-model.md](data-model.md)
- Feature requirements: [spec.md](spec.md)
