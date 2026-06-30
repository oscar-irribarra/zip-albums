# Feature Specification: Album Viewer

**Feature Branch**: `003-album-viewer`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Visualizar un álbum. Abrir desde la portada, mostrar contador y nombre, cargar únicamente la imagen visible, y recordar progreso al reabrir." 

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open and Read an Album (Priority: P1)

As a user, I can open an album and immediately start reading from its cover with clear context of where I am.

**Why this priority**: Opening and reading an album is the core value of the viewer. Without this flow, the feature provides no user value.

**Independent Test**: Can be fully tested by opening any existing album and verifying it starts at the cover, shows the album name and image position counter, and allows progressing image by image.

**Acceptance Scenarios**:

1. **Given** an album exists in the library, **When** the user opens it for the first time, **Then** the viewer starts on the cover image (first image).
2. **Given** an album is open, **When** the viewer is displayed, **Then** the album name is visible in the viewer header.
3. **Given** an album is open, **When** the current image is shown, **Then** the viewer shows a position counter in the format current image over total images.
4. **Given** an album with multiple images is open, **When** the user changes from one image to another, **Then** only the currently visible image is loaded for display.

---

### User Story 2 - Resume Reading Progress (Priority: P2)

As a user, I can reopen an album and continue from the last image I viewed.

**Why this priority**: Progress persistence improves reading continuity and reduces friction for recurring use.

**Independent Test**: Can be fully tested by opening an album, navigating to a non-initial image, closing the viewer, reopening the same album, and verifying it starts from the last viewed image.

**Acceptance Scenarios**:

1. **Given** an album is open, **When** the user navigates to another image, **Then** the latest viewed image position is stored as reading progress for that album.
2. **Given** reading progress exists for an album, **When** the user opens that same album again, **Then** the viewer restores the saved image position instead of starting from the cover.
3. **Given** no reading progress exists for an album, **When** the user opens it, **Then** the viewer starts from the cover image.

### Edge Cases

- Album contains exactly one image; the counter still shows a valid single-position state.
- Saved progress points to an image position that no longer exists in the album; the viewer falls back safely to the cover.
- User exits immediately after opening an album without manual navigation; progress remains consistent with the image actually displayed.
- User opens another album; each album keeps independent progress.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the user to open an album from the library and enter the album viewer.
- **FR-002**: System MUST start from the cover image when an album is opened without saved progress.
- **FR-003**: System MUST display the album name while the album is being viewed.
- **FR-004**: System MUST display an image position counter showing current position and total image count.
- **FR-005**: System MUST load only the image currently visible to the user in the viewer.
- **FR-006**: System MUST update reading progress to the latest viewed image position for the currently open album.
- **FR-007**: System MUST restore the last saved image position when the same album is opened again.
- **FR-008**: System MUST keep reading progress isolated per album so progress in one album does not overwrite another.
- **FR-009**: System MUST safely recover to the cover image when stored progress is invalid or unavailable.

### Key Entities *(include if feature involves data)*

- **Album View Session**: The active reading context for a selected album, including album identity, current image position, and total image count.
- **Reading Progress**: Persisted per-album record containing the last viewed image position and most recent update time.
- **Viewer Header Context**: User-visible metadata for the current session, including album name and position counter state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of first-time album openings start at the cover image in acceptance testing.
- **SC-002**: 100% of album viewer sessions display both album name and image position counter.
- **SC-003**: In test sessions, reopening an album resumes at the previously viewed image position in at least 95% of attempts.
- **SC-004**: During validation with large albums, users can navigate between images without perceivable loading of non-visible images.

## Assumptions

- Albums are already imported and available in the library before this feature is used.
- Image navigation controls already exist or are handled by adjacent viewer scope; this feature defines viewing and progress behavior.
- Reading progress is persisted locally and associated with a unique album identity.
- If persisted progress becomes inconsistent, returning to the cover is an acceptable recovery behavior for v1.
