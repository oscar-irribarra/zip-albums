# Research: Codebase Cleanup and Technical Debt Reduction

**Feature**: 012-codebase-cleanup
**Phase**: 0 — Pre-design research
**Date**: 2026-07-11

---

## Scope of Investigation

All TypeScript/TSX source files in `src/`, all Rust source files in `src-tauri/src/`,
`package.json`, and `src-tauri/Cargo.toml` were examined.

---

## Finding 1: `ImageViewer.tsx` is an obsolete component

**Decision**: Delete `src/features/library/components/ImageViewer.tsx`.

**Rationale**: `ImageViewer` is a complete viewer panel (image display, zoom controls,
navigation buttons, thumbnail strip) that was superseded by `ViewerScreen.tsx` during
spec 009/010/011. `App.tsx` conditionally renders `ViewerScreen` — not `ImageViewer`.
`LibraryView.tsx` does not import `ImageViewer`. The only import of `ImageViewer` in the
entire codebase is `src/test/ImageViewer.test.tsx`.

**Alternatives considered**: Keeping as a backup component. Rejected: it is not
imported by any live code path, has no callers, and maintaining a shadow implementation
of the viewer introduces confusion about which component is canonical.

---

## Finding 2: `library/components/ThumbnailStrip.tsx` is an orphaned duplicate

**Decision**: Delete `src/features/library/components/ThumbnailStrip.tsx`.

**Rationale**: This file is imported only by `ImageViewer.tsx`. When `ImageViewer.tsx`
is removed (Finding 1), `library/ThumbnailStrip` becomes unreachable. Additionally, the
file is byte-for-byte identical to `src/features/viewer/components/ThumbnailStrip.tsx`,
which is the active implementation used by `ViewerScreen.tsx`.

**Alternatives considered**: Promote `library/ThumbnailStrip` as the canonical version
and delete `viewer/ThumbnailStrip`. Rejected: `ViewerScreen.tsx` imports from
`./ThumbnailStrip` (relative, within `viewer/`). Moving the canonical file would require
changing the import path in `ViewerScreen.tsx`, adding unnecessary churn.

---

## Finding 3: `src/test/ImageViewer.test.tsx` tests a removed component

**Decision**: Delete `src/test/ImageViewer.test.tsx`.

**Rationale**: The test file imports and exercises `ImageViewer`, which is being removed
(Finding 1). Once `ImageViewer.tsx` is deleted, the test file will fail to compile.
`ViewerScreen` behavior is covered by `libraryStore.test.ts` (store integration) and
the UI interactions are exercised through the store tests.

**Alternatives considered**: Rewrite to test `ViewerScreen`. Rejected: `ViewerScreen` is
a connected component that reads from `libraryStore` directly; it is not prop-driven and
cannot be tested in isolation without mocking the entire store. The existing store tests
already cover viewer navigation. A separate `ViewerScreen` component test would duplicate
coverage unnecessarily.

---

## Finding 4: `loadAlbumImageForCache` is a dead proxy function

**Decision**: Remove `loadAlbumImageForCache` from `src/infrastructure/tauri.ts` and
update callers to use `loadAlbumImage` directly.

**Rationale**: `loadAlbumImageForCache` is a one-line function that calls `loadAlbumImage`
with the same arguments and returns the same result:
```ts
export function loadAlbumImageForCache(payload: LoadAlbumImageRequest) {
  return loadAlbumImage(payload);
}
```
It was introduced during cache implementation work as a named indirection, likely intending
to allow the cache path to differ from the direct load path, but that divergence never
materialized. The `libraryStore.ts` imports `loadAlbumImageForCache` at line 6.

**Affected files**:
- `src/infrastructure/tauri.ts` — remove the proxy function
- `src/features/library/store/libraryStore.ts` — replace import with `loadAlbumImage`
- `src/features/library/store/libraryStore.test.ts` — mock already provides both names;
  `loadAlbumImageForCache` mock entry should be removed
- `src/test/libraryStore.test.ts` — same mock cleanup applies

**Alternatives considered**: Rename `loadAlbumImage` to `loadAlbumImageForCache` to
invert which name is canonical. Rejected: `loadAlbumImage` is the accurate name and is
already used in the feature-local test; renaming adds friction.

---

## Finding 5: `src/test/libraryStore.test.ts` is a duplicate of the feature-local test

**Decision**: Delete `src/test/libraryStore.test.ts`.

**Rationale**: Both files contain identical test descriptions, test bodies, and mock
structures. The canonical version is `src/features/library/store/libraryStore.test.ts`,
which lives adjacent to its subject (`libraryStore.ts`). The `src/test/` version is a
stale copy from before tests were migrated to feature-collocated locations (spec 001/009).

**Alternatives considered**: Keep both. Rejected: Duplicate tests double maintenance
burden, produce confusing duplicate pass/fail output, and provide no additional coverage.

---

## Finding 6: `greet` is a Tauri template command never removed

**Decision**: Remove the `greet` function from `src-tauri/src/lib.rs` and remove it
from the `invoke_handler!` registration.

**Rationale**: Tauri's project scaffold generates a `greet` command as a hello-world
example. No function `greet` exists in `src/infrastructure/tauri.ts` (the TypeScript
entry point for all Tauri invocations), confirming it has no frontend caller.

**Alternatives considered**: Keep it as a healthcheck endpoint. Rejected: It accepts
arbitrary string input and produces a formatted string response. It serves no diagnostic
purpose not already served by the application itself.

---

## Finding 7: Three TypeScript types are defined but never imported

**Decision**: Remove `ImportAlbumRequest`, `ShortcutGesture`, and `ShortcutGuardContext`
from `src/shared/types/library.ts`.

**Rationale**:
- `ImportAlbumRequest` — The `importAlbum()` function in `tauri.ts` uses an inline type
  `{ zip_path: string }`. `ImportAlbumRequest` was defined in the types file but is not
  imported by any TypeScript source file. (Note: `ImportAlbumRequest` also exists as a
  Rust struct in `lib.rs` — that is a separate, actively-used struct and is unaffected.)
- `ShortcutGesture` — Defined with 8 literal members. A codebase-wide search confirms
  zero imports of this type anywhere outside `library.ts` itself.
- `ShortcutGuardContext` — Same finding: defined with 4 properties, zero external imports.
  Both were added during spec 007 (keyboard shortcuts) but the implementation used inline
  checks rather than these types.

**Alternatives considered**: Keep as documentation types. Rejected: Undocumented,
unexported-effectively dead types in a shared file mislead future developers into thinking
they are authoritative contracts. If they are needed, they should be introduced at the
point of use with a clear purpose.

---

## Finding 8: `@tauri-apps/plugin-opener` has no frontend call site

**Decision**: Leave `@tauri-apps/plugin-opener` in `package.json` and
`tauri-plugin-opener` in `Cargo.toml`. Do not remove.

**Rationale**: The plugin is initialized in `src-tauri/src/lib.rs` via
`.plugin(tauri_plugin_opener::init())`. Tauri plugins can be invoked from the frontend
through the plugin protocol without a typed wrapper in `infrastructure/tauri.ts`. Removing
the plugin and its npm peer package could break runtime behavior that is not visible in
source analysis (e.g., shell-open behavior for external links in dialogs). Without
concrete evidence of non-use at the plugin protocol level, removal is out of scope for
this enabler.

**Alternatives considered**: Remove if confirmed unused. Deferred: Out of scope for
this cleanup pass without a deliberate audit of Tauri plugin protocol invocations.

---

## Summary Table

| # | Subject | Action | Location |
|---|---------|--------|----------|
| 1 | `ImageViewer.tsx` | DELETE | `src/features/library/components/` |
| 2 | `library/ThumbnailStrip.tsx` | DELETE | `src/features/library/components/` |
| 3 | `ImageViewer.test.tsx` | DELETE | `src/test/` |
| 4 | `loadAlbumImageForCache` proxy | REMOVE + UPDATE callers | `src/infrastructure/tauri.ts`, `libraryStore.ts`, both `libraryStore.test.ts` |
| 5 | `src/test/libraryStore.test.ts` | DELETE (duplicate) | `src/test/` |
| 6 | `greet` Tauri command | REMOVE + unregister | `src-tauri/src/lib.rs` |
| 7 | `ImportAlbumRequest`, `ShortcutGesture`, `ShortcutGuardContext` | DELETE | `src/shared/types/library.ts` |
| 8 | `@tauri-apps/plugin-opener` | KEEP (deferred audit) | `package.json`, `Cargo.toml` |
