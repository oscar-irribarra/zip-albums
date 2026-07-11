<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.1.0
Bump Type: MINOR — new section added (Definition of Done)

Sections Added:
  - Definition of Done (technical debt reduction gate for all specs)

Sections Modified:
  - Governance: version line and Last Amended date updated

Principles Modified: None

Templates Reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check gate is generic; no changes needed
  ✅ .specify/templates/spec-template.md — No constitution-specific references; no changes needed
  ✅ .specify/templates/tasks-template.md — Task phases align with principles; no changes needed

Deferred TODOs: None
-->

# Album Viewer Constitution

## Purpose

This project is a local desktop application for browsing image albums stored as ZIP files.

The application prioritizes simplicity, responsiveness, maintainability, and offline operation.

Every implementation MUST comply with this constitution unless an Architecture Decision Record (ADR)
explicitly supersedes it.

## Core Principles

### I. Offline First

The application MUST function entirely offline.

No network connectivity shall be required for any feature.

### II. ZIP is the Source of Truth

Imported ZIP files represent the original album.

The application MUST NOT modify their contents.

Images MUST preserve their original ordering.

The first image inside the ZIP is always considered the album cover.

### III. Read-Only Albums

Albums are immutable.

The application MUST NEVER edit, rename, or reorganize images inside a ZIP.

Any modification requires importing a new album.

### IV. Simple Architecture

Favor simple solutions over generic abstractions.

Avoid unnecessary layers.

Avoid premature optimization.

Every abstraction must solve an existing problem, not an anticipated future one.

### V. Separation of Responsibilities

The frontend is responsible only for presentation and user interaction.

Business logic MUST belong to Rust services.

Filesystem access MUST belong exclusively to infrastructure services.

No UI component may directly access the filesystem.

### VI. Local Persistence

Only application metadata may be persisted locally.

Examples include: settings, recently opened albums, reading progress, and cached thumbnails.

Original album data MUST NOT be duplicated unless explicitly approved through an ADR.

### VII. Lazy Loading

Images MUST be loaded only when needed.

Never preload an entire album into memory.

Large albums should consume memory proportional to the currently viewed images.

### VIII. Performance

UI interactions MUST remain responsive.

Long-running operations MUST execute asynchronously.

Blocking the UI thread is prohibited.

### IX. Error Handling

Errors MUST be recoverable whenever possible.

User-facing messages MUST explain: what happened, why it happened, and how to recover.

Internal errors MUST be logged.

### X. Cross Platform

Every implementation MUST support Windows, Linux, and macOS.

Platform-specific code MUST be isolated.

## Architecture

**Frontend**: React, TypeScript, Vite

**Desktop Runtime**: Tauri

**Backend**: Rust

**State Management**: Zustand

**Styling**: TailwindCSS

**Routing**: React Router

Any change to the runtime or a primary dependency requires an ADR.

## Folder Organization

Frontend code MUST follow feature-based organization:

```
src/
  features/
    library/
    import/
    viewer/
    settings/
  shared/
  infrastructure/
```

Shared utilities belong in `shared/`. Infrastructure (filesystem, Tauri bridges) belongs in
`infrastructure/`. Features MUST NOT import directly from sibling feature directories.

## Rust Responsibilities

Rust owns exclusively:

- ZIP reading
- Filesystem access
- Metadata persistence
- Thumbnail generation (future)
- Cache management
- Settings persistence

React MUST NOT duplicate this logic.

## Metadata

Only metadata may be stored. Examples:

**Album**: id, title, path, image count, cover index, created date, last opened

**Settings**: theme, albums directory, fullscreen, zoom

**Reading Progress**: album id, last image index

## Dependencies

Every dependency MUST satisfy at least one of the following:

- improves developer productivity
- significantly reduces implementation complexity
- is actively maintained

Avoid dependencies that solve trivial problems.

## Testing

Business logic MUST be independently testable.

Every feature MUST include tests covering: happy path, invalid input, and edge cases.

## Accessibility

Keyboard navigation MUST always be available.

Visible focus indicators MUST NOT be removed.

Interactive elements MUST be reachable without a mouse.

## Security

Never execute files contained inside imported ZIPs.

Every imported file MUST be validated; unsupported formats MUST be rejected.

Implementations MUST protect against path traversal.

ZIP entry names MUST NEVER be trusted.

## Logging

Log only useful technical information.

Avoid excessive logging.

Never log image contents.

## Architecture Decisions

Any change affecting persistence, project structure, runtime, caching strategy, or filesystem layout
requires an ADR before implementation.

ADRs are stored in `docs/adr/` following the format `NNN-short-title.md`.

## Future Features

Possible future features include: favorites, tags, thumbnail cache, drag and drop, slideshow,
image filters, search, and cloud synchronization.

Current implementations SHOULD NOT make these features harder to add but MUST NOT implement
them preemptively.

## Definition of Done

A feature is considered complete only if ALL of the following conditions are met:

- Acceptance criteria defined in the spec are satisfied.
- Automated tests pass (unit and integration where applicable).
- Documentation is updated when behavior or interfaces change.
- Obsolete code introduced by the change has been removed.
- Unused dependencies have been removed.
- No new dead code remains in the codebase.
- Static analysis reports no new critical issues.

No task may be marked done unless the full Definition of Done is met.
This gate applies to every feature spec and MUST be verified during the Constitution Check
step in plan.md.

## Governance

This constitution supersedes all other practices and informal conventions.

Amendments require: a written rationale, a version bump following semantic versioning
(MAJOR: principle removal or redefinition; MINOR: new principle or section added;
PATCH: wording clarification or non-semantic refinement), and a review of impacted
templates and ADRs.

Changes governed by the Architecture Decisions section require an ADR before any code is written.

Compliance is verified at each feature implementation via the Constitution Check gate in plan.md.

**Version**: 1.1.0 | **Ratified**: 2026-06-30 | **Last Amended**: 2026-07-11
