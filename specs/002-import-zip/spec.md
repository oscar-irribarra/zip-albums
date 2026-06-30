# Feature Specification: Import ZIP Albums

**Feature Branch**: `002-import-zip`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Permitir importar nuevos albumes desde archivos ZIP, con validaciones de contenido y mensajes claros de error."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import a New Album from ZIP (Priority: P1)

As a user, I can select a ZIP file and import it as a new album in my library.

**Why this priority**: Importing is the core action that enables users to add new content and is the main value of this feature.

**Independent Test**: Can be fully tested by importing a valid ZIP with images and verifying a new album appears in the library immediately with ordered images and a cover.

**Acceptance Scenarios**:

1. **Given** the user has the library open and selects a valid ZIP containing supported images, **When** import is confirmed, **Then** a new album is added immediately to the library list.
2. **Given** the ZIP contains images and non-image files mixed together, **When** the album is imported, **Then** only supported images are included in the album and non-compatible files are ignored.
3. **Given** the ZIP has multiple supported images in a defined internal sequence, **When** import completes, **Then** images appear in the same sequence as inside the ZIP and the first image is used as the cover.

---

### User Story 2 - Receive Clear Error Feedback for Invalid ZIPs (Priority: P2)

As a user, I receive clear and actionable error messages whenever an import cannot be completed.

**Why this priority**: Users must understand why import fails and what to do next, reducing confusion and repeated failed attempts.

**Independent Test**: Can be fully tested by attempting imports with each invalid input type and verifying the expected, specific error message is shown.

**Acceptance Scenarios**:

1. **Given** the selected file is not a ZIP, **When** the user attempts import, **Then** import is rejected and a message indicates only ZIP files are supported.
2. **Given** the selected ZIP is corrupted, **When** the user attempts import, **Then** import is rejected and a message indicates the ZIP is invalid or damaged.
3. **Given** the selected ZIP is empty or contains no supported images, **When** the user attempts import, **Then** import is rejected and a message explains no importable images were found.
4. **Given** the selected ZIP is already imported as an existing album, **When** the user attempts import, **Then** import is rejected and a message indicates the album is duplicated.

### Edge Cases

- ZIP contains nested folders with supported images and unsupported files.
- ZIP contains only unsupported file types (for example, text files or documents).
- ZIP contains exactly one supported image (it must still be importable and used as cover).
- ZIP contains very large numbers of entries; import must complete without freezing the user flow.
- User cancels file selection before confirming import.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to choose a local file to import as an album.
- **FR-002**: System MUST accept only files in ZIP format for album import.
- **FR-003**: System MUST validate that the selected ZIP can be opened and read before creating an album.
- **FR-004**: System MUST detect and include only supported image files from the ZIP content.
- **FR-005**: System MUST ignore non-compatible files found inside the ZIP without failing the full import.
- **FR-006**: System MUST reject the import when the ZIP contains zero supported images.
- **FR-007**: System MUST preserve the internal ZIP image order for the imported album.
- **FR-008**: System MUST set the first valid image in ZIP order as the album cover.
- **FR-009**: System MUST add a successfully imported album to the library immediately after import completes.
- **FR-010**: System MUST detect duplicate imports and prevent creating a duplicate album entry.
- **FR-011**: System MUST present clear, user-facing error messages for at least these cases: non-ZIP file, corrupted ZIP, empty ZIP, ZIP with no supported images, and duplicate album.
- **FR-012**: System MUST keep the existing library unchanged when an import fails.

### Key Entities *(include if feature involves data)*

- **Import Candidate**: The user-selected local file intended for album creation, including user-visible file name and file location.
- **Imported Album**: A new library item created from a valid ZIP, containing title, ordered images, cover image, and import timestamp.
- **Import Result**: The outcome of an import attempt, including success state or a categorized user-facing error reason.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful imports appear in the library list without requiring a manual refresh or restart.
- **SC-002**: 100% of invalid import attempts produce a specific error message that matches the failure type.
- **SC-003**: In validation testing, image ordering in imported albums matches ZIP internal ordering in at least 99% of tested ZIP fixtures.
- **SC-004**: At least 90% of test users can complete a valid ZIP import on the first attempt without external guidance.

## Assumptions

- Supported image formats are defined by existing project rules and remain unchanged for this feature.
- Duplicate detection is based on album identity rules already used by the library domain.
- Import is triggered through an explicit user action in the library experience.
- This feature covers single ZIP import per action; bulk multi-file import is out of scope.