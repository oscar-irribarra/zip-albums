# Quickstart: Validate Image Cache

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

### Scenario A: Adjacent image prefetch

1. Open an album with at least 10 images.
2. Open viewer at any image N in middle range.
3. Navigate to N+1 and then back to N.

Expected:

- Current navigation remains responsive.
- Previous and next images are available with no perceptible wait in most transitions.

### Scenario B: Distant image eviction

1. Open a large album.
2. Navigate sequentially across many images.
3. Observe cache diagnostics/state during navigation.

Expected:

- Images outside active window are evicted.
- Cache size does not grow without bound.

### Scenario C: Jump navigation rebalance

1. Jump from an early image to a distant index.
2. Continue navigation from new position.

Expected:

- Cache re-centers around new current index.
- Old distant entries are released within next updates.

### Scenario D: Boundary safety

1. Navigate to first image.
2. Navigate to last image.

Expected:

- No invalid previous/next index requests are issued.
- Cache keeps only valid neighbors at boundaries.

### Scenario E: Memory budget enforcement

1. Open an album with high-resolution images.
2. Navigate continuously for several minutes.

Expected:

- Cache remains within configured budget policy.
- Viewer remains functional; eviction does not break navigation.

## Contract References

- Cache command usage: [contracts/image-cache-commands.md](contracts/image-cache-commands.md)
- Data model details: [data-model.md](data-model.md)

## Validation Notes (2026-06-30)

- Scenario A: PASS via automated store and component coverage.
	- `src/features/library/store/libraryStore.test.ts` validates adjacent prefetch and cache seeding.
	- `src/features/library/components/LibraryView.test.tsx` validates responsive navigation behavior and boundaries.

- Scenario B: PASS via automated eviction coverage.
	- Store tests validate stale-entry eviction after distant navigation.

- Scenario C: PASS via automated jump-navigation recentering coverage.
	- Store tests validate jump navigation removes stale far entries and recenters cache.

- Scenario D: PASS via automated boundary safety coverage.
	- Store and component tests validate first/last behavior and no invalid navigation from boundary controls.

- Scenario E: PASS for bounded policy enforcement in automated tests.
	- Store tests validate deterministic eviction ordering and no duplicate cache entries during rapid navigation.

- Command validation results:
	- `pnpm exec tsc --noEmit`: PASS
	- `pnpm test -- --run src/features/library/store/libraryStore.test.ts src/features/library/components/LibraryView.test.tsx`: PASS
	- `cargo test` (`src-tauri`): PASS
