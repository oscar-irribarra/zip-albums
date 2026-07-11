# Quickstart: Validating the Codebase Cleanup

**Feature**: 012-codebase-cleanup
**Date**: 2026-07-11

---

## Prerequisites

- Node.js and pnpm installed
- Rust toolchain installed (`rustup`)
- Repository checked out on branch `012-codebase-cleanup`
- Dependencies installed: `pnpm install`

---

## Validation Steps

### Step 1 — TypeScript build passes

```powershell
pnpm build
```

**Expected**: Build completes with exit code 0.
Any removed symbol that is still referenced elsewhere will produce a compile error here.

---

### Step 2 — Frontend tests pass

```powershell
pnpm test
```

**Expected**:
- All tests pass.
- The following test files are **not present** (they were deleted as part of cleanup):
  - `src/test/ImageViewer.test.tsx`
  - `src/test/libraryStore.test.ts`
- The following test files remain and pass:
  - `src/features/library/components/LibraryView.test.tsx`
  - `src/features/library/store/libraryStore.test.ts`
  - `src/features/settings/components/SettingsPanel.test.tsx`
  - `src/features/settings/store/settingsStore.test.ts`
  - `src/test/SettingsFAB.test.tsx`
  - `src/test/SettingsSidePanel.test.tsx`

---

### Step 3 — Rust build passes with no dead-code warnings

```powershell
cd src-tauri
cargo build 2>&1 | Select-String -Pattern "warning|error" | Select-Object -First 30
```

**Expected**: No `dead_code` warnings. No errors.
The `greet` function removal and its deregistration from `invoke_handler!` must not
introduce any compilation error.

---

### Step 4 — Rust tests pass

```powershell
cd src-tauri
cargo test
```

**Expected**: All Rust unit tests pass. The `greet` command has no Rust unit tests;
its removal does not reduce test count.

---

### Step 5 — Static analysis: no unused TypeScript exports

```powershell
pnpm build 2>&1
```

TypeScript strict mode will surface any imported symbols that no longer exist.
Confirm the build output contains no `TS2305`, `TS2307`, or `TS2345` errors related to
removed types (`ImportAlbumRequest`, `ShortcutGesture`, `ShortcutGuardContext`).

---

### Step 6 — Application smoke test

```powershell
pnpm tauri dev
```

**Expected**: The application starts. Verify:
1. Library view loads and albums are displayed.
2. Clicking an album opens `ViewerScreen` (not `ImageViewer` — that component no longer exists).
3. Image navigation (arrow keys, buttons) works.
4. Settings panel opens and saves correctly.
5. Importing a ZIP works.

---

## Deleted File Checklist

Confirm these files no longer exist:

- [ ] `src/features/library/components/ImageViewer.tsx`
- [ ] `src/features/library/components/ThumbnailStrip.tsx`
- [ ] `src/test/ImageViewer.test.tsx`
- [ ] `src/test/libraryStore.test.ts`

---

## Modified File Checklist

Confirm these files no longer contain the removed symbols:

- [ ] `src/infrastructure/tauri.ts` — no `loadAlbumImageForCache` function
- [ ] `src/features/library/store/libraryStore.ts` — imports `loadAlbumImage`, not `loadAlbumImageForCache`
- [ ] `src/features/library/store/libraryStore.test.ts` — mock does not include `loadAlbumImageForCache`
- [ ] `src/shared/types/library.ts` — no `ImportAlbumRequest`, `ShortcutGesture`, `ShortcutGuardContext`
- [ ] `src-tauri/src/lib.rs` — no `greet` function, `greet` not in `invoke_handler!`
