# Feature Specification: Improve UI/UX

**Feature Branch**: `010-improve-ui-ux`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "Se debe mejorar la experiencia de usuario — US-001 Biblioteca de albums, US-002 Boton delete, US-003 Visor de imagenes, US-004 Franja de miniaturas"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Independent Album Library Screen (Priority: P1)

A user opens the application and sees a dedicated library screen where all imported albums are displayed in a grid. Each album shows its cover image (extracted directly from the ZIP), its title, and metadata. The library is completely separate from the image viewer. Only the library screen exposes the Import button.

**Why this priority**: The library is the entry point of the application. Without a clean, independent library view the rest of the UX improvements have no foundation.

**Independent Test**: Can be fully tested by launching the application, verifying the library screen renders all albums in a grid with correct cover images, and confirming no viewer controls appear on this screen.

**Acceptance Scenarios**:

1. **Given** the application is launched, **When** the library screen loads, **Then** all imported albums are displayed as cards arranged in a responsive grid.
2. **Given** an album was imported from a ZIP file, **When** the library screen renders that album's card, **Then** the cover image displayed is the first image inside the ZIP (sorted by filename ascending, e.g. 00, 01, 001).
3. **Given** the library screen is open, **When** the window is resized, **Then** the album card grid and cover images maintain their original aspect ratio proportionally.
4. **Given** the library screen is open, **When** the user looks for the Import button, **Then** the Import button is visible only on the library screen and not on any other screen.
5. **Given** the library screen is open, **When** album cards are rendered, **Then** each card displays album details (title, image count) in a row/column layout below or beside the cover.

---

### User Story 2 - Safe Album Deletion (Priority: P2)

A user clicks the Delete button on an album card. The album is removed from the application's library list, but the original ZIP file on disk is never touched.

**Why this priority**: Data safety is critical. Users must trust that deleting an album from the application does not destroy their files.

**Independent Test**: Can be fully tested by importing an album, clicking Delete, verifying the album disappears from the library, and confirming the original ZIP file still exists on the filesystem.

**Acceptance Scenarios**:

1. **Given** an album exists in the library, **When** the user clicks the Delete button on that album, **Then** the album is removed from the application library view.
2. **Given** an album is deleted from the library, **When** the user checks the filesystem location of the original ZIP, **Then** the ZIP file is still present and unmodified.
3. **Given** a user clicks Delete, **When** the action completes, **Then** the application shows updated library without the deleted album and no error is displayed.

---

### User Story 3 - Independent Image Viewer with Navigation Controls (Priority: P2)

A user selects an album from the library and enters a dedicated full-screen image viewer. The viewer shows only the current album's content, provides a Back button to return to the library, supports zoomed-in image panning, and its background matches the active application theme.

**Why this priority**: The viewer is the core consumption experience. It must be fully decoupled from the library so both screens can evolve independently.

**Independent Test**: Can be fully tested by opening any album, interacting with all viewer controls (Back, zoom, pan), and confirming no library UI elements are visible.

**Acceptance Scenarios**:

1. **Given** the image viewer is open for an album, **When** the user clicks the Back button, **Then** the application navigates back to the library screen.
2. **Given** the image viewer is open and the user has zoomed in, **When** the user drags the image, **Then** the image pans within the visible viewport bounds without leaving the viewer area.
3. **Given** the application theme is set (light or dark), **When** the image viewer is open, **Then** the viewer background matches the active theme color.
4. **Given** the image viewer is open for album A, **When** the user inspects visible metadata or controls, **Then** only information about album A is shown — no other albums are referenced.
5. **Given** the image viewer is open, **When** the user has not zoomed in, **Then** dragging does not scroll outside the natural image boundaries.

---

### User Story 4 - Redesigned Thumbnail Strip (Priority: P3)

The thumbnail strip inside the image viewer is hidden by default. It appears only when the user deliberately triggers it (hover over a dedicated hover zone at the bottom, or clicking a toggle button) and hides when the user moves away or clicks the toggle again. The strip is visually separated from the image area.

**Why this priority**: The thumbnail strip is a secondary navigation aid. Keeping it hidden by default reduces visual clutter and gives the image maximum screen space.

**Independent Test**: Can be fully tested within the image viewer by verifying the strip is hidden on open, then appearing/disappearing correctly via hover and button toggle.

**Acceptance Scenarios**:

1. **Given** the image viewer is opened, **When** the page loads, **Then** the thumbnail strip is not visible.
2. **Given** the thumbnail strip is hidden, **When** the user hovers over the dedicated hover zone at the bottom of the viewer, **Then** the thumbnail strip becomes visible.
3. **Given** the thumbnail strip is visible via hover, **When** the user moves the cursor away from the strip and hover zone, **Then** the thumbnail strip hides again.
4. **Given** the thumbnail strip is hidden, **When** the user clicks the toggle button, **Then** the thumbnail strip becomes visible and remains visible even without hover.
5. **Given** the thumbnail strip is visible via the toggle button, **When** the user clicks the toggle button again, **Then** the thumbnail strip hides.
6. **Given** the thumbnail strip is visible, **When** the user observes the layout, **Then** the strip is visually separated from the main image (e.g., by a gap or border) and does not overlap it.
7. **Given** the thumbnail strip is hidden, **When** the user observes the bottom of the viewer, **Then** a narrow hover-sensitive bar is visible at the bottom that serves as the hover trigger zone.
8. **Given** the thumbnail strip is visible, **When** the user observes the strip, **Then** the strip is larger than in previous designs, showing thumbnails at a comfortable size.

---

### Edge Cases

- What happens when a ZIP contains no recognizable image files? The album card should show a placeholder cover and the viewer should handle zero images gracefully.
- What happens when the first image in the ZIP cannot be decoded? The next valid image should be used as the cover, or a placeholder is shown.
- What happens when the user zooms in on a very large image and pans? Pan must be bounded so the image cannot be dragged completely off-screen.
- What happens when the library is empty after all albums are deleted? The library screen shows an empty state with guidance to import an album.
- What happens when the user rapidly toggles the thumbnail strip? The strip state must remain consistent with the last action.

## Requirements *(mandatory)*

### Functional Requirements

**Library Screen**

- **FR-001**: The library screen MUST be a standalone, dedicated route or view, independent from the image viewer.
- **FR-002**: The library screen MUST display all imported albums as cards in a responsive grid layout.
- **FR-003**: Each album card MUST display the cover image extracted directly from the album's ZIP file (first image by ascending filename sort order).
- **FR-004**: Album card cover images MUST preserve the original aspect ratio of the source image regardless of window size.
- **FR-005**: Each album card MUST display album details (title, image count) in a row/column arrangement below or alongside the cover.
- **FR-006**: The Import button MUST appear only on the library screen and MUST NOT appear in the image viewer.

**Album Deletion**

- **FR-007**: When the user deletes an album from the library, the application MUST remove the album from its internal metadata/catalog only.
- **FR-008**: The original ZIP file on the filesystem MUST NEVER be deleted or modified by any delete action within the application.

**Image Viewer**

- **FR-009**: The image viewer MUST be a standalone view, independent from the library screen.
- **FR-010**: The image viewer MUST provide a Back button that navigates the user to the library screen.
- **FR-011**: When the user is zoomed in, the image viewer MUST allow dragging/panning the image; panning MUST be constrained within the viewer viewport.
- **FR-012**: The image viewer background MUST match the active application theme (light/dark).
- **FR-013**: The image viewer MUST display metadata and controls for the currently open album only.

**Thumbnail Strip**

- **FR-014**: The thumbnail strip MUST be hidden by default when the image viewer opens.
- **FR-015**: The thumbnail strip MUST become visible when the user hovers over the dedicated hover zone at the bottom of the viewer.
- **FR-016**: The thumbnail strip MUST hide when the cursor leaves the strip and the hover zone.
- **FR-017**: A toggle button MUST be present in the viewer that shows or hides the thumbnail strip independently of hover.
- **FR-018**: The thumbnail strip toggled visible via button MUST remain visible until the toggle button is clicked again (not hidden on hover-out when pinned).
- **FR-019**: The thumbnail strip MUST be visually separated from the main image content (gap or border).
- **FR-020**: When the thumbnail strip is hidden, a narrow hover-sensitive bar MUST be visible at the bottom of the viewer to serve as the hover trigger zone.
- **FR-021**: The thumbnail strip MUST be larger than previous iterations, showing thumbnails at a comfortable, clearly visible size.

### Key Entities

- **Album**: Represents an imported ZIP file. Attributes: id, title, path, image count, cover image index, created date.
- **Album Cover**: The first image (by ascending filename order) extracted from the ZIP. Used solely for display; the ZIP is never modified.
- **Image Viewer State**: Tracks current album, current image index, zoom level, pan offset, thumbnail strip visibility (hidden / hover-visible / pinned).
- **Thumbnail Strip**: A horizontal scrollable strip of image thumbnails shown inside the viewer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the library, browse all albums, and navigate to any album viewer in under 5 seconds on a library of 50 albums.
- **SC-002**: Album cover images load from the ZIP and render on the library screen within 2 seconds per album card on first display.
- **SC-003**: Deleting an album removes it from the library instantly (under 500 ms) and the original ZIP file remains intact 100% of the time.
- **SC-004**: After zooming in, users can pan the image to any visible region without the image escaping the viewer boundary.
- **SC-005**: The thumbnail strip responds to hover and toggle interactions within 150 ms of the triggering action.
- **SC-006**: 100% of album cover images displayed in the library are sourced from inside the ZIP file — no external images or placeholders are used unless the ZIP contains no valid images.
- **SC-007**: The viewer background matches the active theme in 100% of cases with no visible color mismatch.

## Assumptions

- The application already has an existing routing mechanism (React Router) that can be extended to separate library and viewer routes.
- Albums are already stored in an internal catalog (JSON or equivalent) that tracks metadata; deletion modifies only this catalog.
- ZIP cover extraction will be performed by the Rust backend service; the frontend receives the cover as binary data or a data URL.
- "First image" is determined by sorting filenames inside the ZIP in ascending alphanumeric order; filenames such as 00, 01, 001, 002 sort correctly under this rule.
- The thumbnail strip toggle button state (pinned/unpinned) is ephemeral and does not persist across sessions.
- Light and dark theme tokens are already defined; the viewer background will use the existing theme surface/background token.
- Mobile support is out of scope; the application targets desktop (Windows, macOS, Linux) only.
