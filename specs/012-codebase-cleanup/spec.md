# Feature Specification: Codebase Cleanup and Technical Debt Reduction

**Feature Branch**: `012-codebase-cleanup`

**Created**: 2026-07-11

**Status**: Draft

**Type**: Enabler (no user-facing functionality)

## Overview

This enabler improves the long-term maintainability of the codebase by systematically removing
obsolete code, unused dependencies, legacy compatibility layers, and accumulated technical debt
introduced during previous feature implementations.

No new functionality is introduced. Application behavior must remain identical before and after.

---

## User Scenarios & Testing

> **Note**: This is an internal engineering enabler. Actors are developers and maintainers,
> not end users. Scenarios are framed as maintainability outcomes.

### Story 1 — Source Code Cleanup (Priority: P1)

A developer navigating the codebase finds no orphaned classes, functions, interfaces, models,
or utilities that are no longer referenced anywhere in the project.

**Why this priority**: Dead source code is the most direct cause of confusion, incorrect
assumptions, and wasted onboarding time. It is the highest-impact cleanup target.

**Independent Test**: Can be verified by running static analysis and confirming zero
"unused export" or "unreachable code" warnings in the frontend and zero dead-code warnings
in the Rust backend.

**Acceptance Scenarios**:

1. **Given** the full source tree, **When** static analysis runs, **Then** no unused exported
   symbols, functions, interfaces, or models are reported.
2. **Given** a removed symbol, **When** its call sites are searched, **Then** no references
   remain in non-test code.
3. **Given** the Rust codebase, **When** the compiler runs with warnings enabled,
   **Then** no `dead_code` warnings are emitted.

---

### Story 2 — UI Components and Asset Cleanup (Priority: P2)

A developer browsing the `features/` and `shared/` directories finds no unused React components,
layouts, stylesheets, or static assets.

**Why this priority**: Unused UI artifacts inflate build output and create maintenance confusion
about which components are active in production.

**Independent Test**: Can be verified by confirming that every component file in `src/features/`
and `src/shared/` is imported by at least one other module in the dependency graph.

**Acceptance Scenarios**:

1. **Given** all React component files, **When** the import graph is traced,
   **Then** every component is reachable from the application entry point.
2. **Given** all CSS/stylesheet files, **When** checked for usage,
   **Then** no stylesheet is imported by zero modules.
3. **Given** all files in `public/` and `src/assets/`, **When** checked for references,
   **Then** no static asset is unreferenced.

---

### Story 3 — Dependency Cleanup (Priority: P3)

A developer inspecting `package.json` and `Cargo.toml` finds no packages that are listed as
dependencies but unused anywhere in the project.

**Why this priority**: Unused dependencies increase install time, attack surface, and version
management overhead.

**Independent Test**: Can be verified by auditing dependency usage reports and confirming
`package.json` and `Cargo.toml` declare only packages that are actively imported or required
at build time.

**Acceptance Scenarios**:

1. **Given** all declared npm dependencies, **When** import usage is scanned,
   **Then** every package is referenced in at least one source file.
2. **Given** all declared Cargo dependencies, **When** usage is scanned,
   **Then** every crate is used in at least one Rust source file.
3. **Given** source files, **When** import statements are checked,
   **Then** no file contains an import that is declared but never used.

---

### Story 4 — Legacy and Compatibility Layer Removal (Priority: P4)

A developer reviewing the architecture finds no temporary shim code, deprecated adapters,
or compatibility wrappers that were introduced for past transitions and are now redundant.

**Why this priority**: Compatibility layers are low risk to remove but, if left in place,
mislead future developers into believing they are active architectural components.

**Independent Test**: Can be verified by confirming that no file is annotated as temporary
or deprecated and that no module exists solely to proxy calls to a replacement implementation.

**Acceptance Scenarios**:

1. **Given** all source files, **When** searched for "TODO", "FIXME", "deprecated", or
   "temporary" annotations, **Then** all such markers are either resolved and removed or
   converted to tracked issues with a rationale.
2. **Given** any module introduced as a shim, **When** the replacement is confirmed stable,
   **Then** the shim is removed and call sites updated directly.

---

### Edge Cases

- A symbol appears unused but is referenced dynamically (e.g., via string-based lookup or
  Tauri command registration). It MUST NOT be removed.
- A dependency appears unused in source but is required at build time (e.g., a Vite plugin
  or Tauri peer dep). It MUST NOT be removed.
- A test file imports a symbol that is removed from production code. The test MUST be
  deleted or updated; it MUST NOT be left referencing a removed export.

---

## Requirements

### Functional Requirements

- **FR-001**: All unused TypeScript/TSX exports (functions, classes, interfaces, types, enums)
  MUST be removed.
- **FR-002**: All unused React components MUST be removed from `src/`.
- **FR-003**: All unused CSS stylesheets and style rules MUST be removed.
- **FR-004**: All unreferenced files in `public/` and `src/assets/` MUST be removed.
- **FR-005**: All packages in `package.json` that are not imported in any source file and
  not required at build time MUST be removed.
- **FR-006**: All crates in `Cargo.toml` that are not used in any Rust source file MUST
  be removed.
- **FR-007**: All unused import statements across TypeScript and Rust source files MUST
  be removed.
- **FR-008**: All Rust dead code (functions, structs, enums, impl blocks) MUST be removed
  unless explicitly suppressed with a documented reason.
- **FR-009**: Legacy compatibility adapters that have been superseded by current
  implementations MUST be removed.
- **FR-010**: Duplicate logic that was not consolidated during prior feature work MUST be
  merged into a single canonical implementation.
- **FR-011**: All test files referencing removed symbols MUST be updated or deleted.
- **FR-012**: Documentation referencing removed functionality MUST be updated to reflect
  the current state.

### Constraints

- **CN-001**: No observable application behavior may change.
- **CN-002**: No public Tauri commands may be removed or renamed without explicit approval.
- **CN-003**: No data migrations are performed.
- **CN-004**: No new features are introduced.
- **CN-005**: Dependency versions MUST remain consistent; no upgrades are in scope.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Static analysis (TypeScript and Rust) reports zero new critical issues after
  cleanup compared to before.
- **SC-002**: All existing automated tests pass without modification to test logic
  (only removal of tests targeting deleted code is permitted).
- **SC-003**: No unused import warnings remain in the TypeScript build output.
- **SC-004**: The Rust compiler emits zero `dead_code` warnings after cleanup.
- **SC-005**: The number of declared npm dependencies does not increase; unused ones
  are removed.
- **SC-006**: The number of declared Cargo dependencies does not increase; unused ones
  are removed.
- **SC-007**: No file in `src/` remains that is unreachable from the application entry point
  (excluding test files and type declaration files).

---

## Assumptions

- The current test suite accurately reflects expected application behavior and can serve
  as the regression baseline.
- Any symbol marked with `@internal` or prefixed with `_` but still exported is treated
  as intentionally public unless usage analysis confirms otherwise.
- Rust symbols suppressed with `#[allow(dead_code)]` require a documented rationale;
  suppressions without rationale are treated as candidates for removal.
- Tauri command registrations in `lib.rs` / `main.rs` are authoritative; a Rust function
  registered as a Tauri command is considered "used" regardless of direct call sites.
- Build-time-only npm packages (devDependencies that appear unused in source) are
  assessed separately from runtime dependencies.
