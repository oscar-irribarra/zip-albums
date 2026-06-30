# Phase 0 Research: Import ZIP Albums

## Decision 1: Keep import logic in existing Rust services

- Decision: Implement import behavior by extending `ZipService`, `FileSystemService`, `MetadataService`, and adding one Tauri command `import_album`.
- Rationale: Matches constitution separation of responsibilities and avoids creating new abstraction layers.
- Alternatives considered: Creating a new orchestration service layer in Rust. Rejected because current scope is small and existing services already cover required responsibilities.

## Decision 2: Duplicate detection by canonical ZIP path

- Decision: Detect duplicates using canonicalized ZIP file path persisted in existing album metadata.
- Rationale: Uses existing metadata model and provides deterministic duplicate checks with minimal complexity.
- Alternatives considered: Hashing ZIP bytes for identity. Rejected because it adds cost and complexity not required by current spec.

## Decision 3: Supported image formats

- Decision: Reuse current supported image extensions in `ZipService` (`.png`, `.jpg`, `.jpeg`, `.webp`) and ignore all others.
- Rationale: Aligns with existing implementation and satisfies "ignore unsupported files" requirement.
- Alternatives considered: Expanding to additional formats now. Rejected to avoid scope growth without explicit requirement.

## Decision 4: Error contract with stable codes

- Decision: Return typed error codes from Rust and map them to clear UI messages in frontend state.
- Rationale: Produces consistent user feedback across all required failure scenarios.
- Alternatives considered: Returning raw backend strings only. Rejected because raw text is unstable and harder to test.

## Decision 5: Immediate UI update strategy

- Decision: Append successfully imported album directly to Zustand state rather than reloading full library.
- Rationale: Simplest way to satisfy immediate update requirement and reduce unnecessary IO.
- Alternatives considered: Trigger full `get_library` reload after import. Rejected because it adds redundant work and can be slower for large libraries.

## Decision 6: No extraction and no content duplication

- Decision: Inspect ZIP entries in place and persist metadata only.
- Rationale: Required by constitution (ZIP source of truth, local metadata only) and user constraints.
- Alternatives considered: Extracting images into cache during import. Rejected because this duplicates album contents and increases complexity.

## Clarification Resolution Summary

All technical context unknowns are resolved with in-repo decisions. No `NEEDS CLARIFICATION` markers remain for planning.