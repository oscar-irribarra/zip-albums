# Feature Specification: Improve UI Navigation Experience

**Feature Branch**: `009-improve-ui`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "Mejorar la experiencia de navegacion del usuario – floating action button for settings, settings side panel, redesigned thumbnail strip, improved image viewer, and improved album UI."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Settings Floating Action Button (Priority: P1)

The user needs quick and constant access to the application settings without the settings UI occupying permanent space in the layout. A floating action button (FAB) positioned at the bottom-right corner of the screen provides always-visible access to settings while keeping the rest of the interface unobstructed.

**Why this priority**: Settings access is a fundamental navigation need. Replacing the current settings section with a FAB is a prerequisite for the side panel (US-002) and directly improves layout space for content.

**Independent Test**: Can be fully tested by verifying the FAB appears in the bottom-right corner at all times, across both light and dark themes, and does not overlap the main image viewer area.

**Acceptance Scenarios**:

1. **Given** the application is open on any screen, **When** the user looks at the interface, **Then** a settings icon button is always visible in the bottom-right corner of the screen.
2. **Given** the user is viewing the image viewer, **When** the main image is displayed, **Then** the FAB does not cover or obscure the main image area.
3. **Given** the application switches between light and dark theme, **When** the theme changes, **Then** the FAB remains visible and properly styled in both themes.
4. **Given** the current settings section exists in the layout, **When** the FAB feature is active, **Then** the old settings section is hidden and replaced by the FAB.

---

### User Story 2 - Settings Side Panel (Priority: P2)

The user opens and interacts with all application settings through a slide-in side panel. The panel appears when the FAB is clicked and closes through multiple dismiss gestures, keeping all settings accessible without permanently occupying layout space.

**Why this priority**: Directly depends on the FAB (US-001). Once the FAB exists, the side panel is the destination for settings interaction.

**Independent Test**: Can be fully tested by opening the panel via the FAB, interacting with all existing settings options inside the panel, and confirming all close gestures (X button, click outside, ESC key) work correctly.

**Acceptance Scenarios**:

1. **Given** the FAB is visible, **When** the user clicks it, **Then** the settings side panel slides open displaying all application settings.
2. **Given** the side panel is open, **When** the user clicks the X button inside the panel, **Then** the panel closes.
3. **Given** the side panel is open, **When** the user clicks anywhere outside the panel, **Then** the panel closes.
4. **Given** the side panel is open, **When** the user presses the ESC key, **Then** the panel closes.
5. **Given** the side panel is open, **When** the user interacts with any setting, **Then** all existing settings are present and functional within the panel.

---

### User Story 3 - Thumbnail Strip Redesign (Priority: P3)

The thumbnail strip at the bottom of the image viewer is redesigned to take up less space by default. It auto-hides when the user is not hovering over the viewer area and can also be toggled manually via a dedicated button.

**Why this priority**: Reduces visual noise and maximises the image display area, improving the core viewing experience.

**Independent Test**: Can be fully tested in the image viewer by confirming the strip is hidden by default, appears on hover, disappears on mouse leave, and can be toggled with the button.

**Acceptance Scenarios**:

1. **Given** the user is viewing an image, **When** the mouse is not hovering over the thumbnail strip area, **Then** the thumbnail strip is hidden.
2. **Given** the thumbnail strip is hidden, **When** the user moves the mouse over the strip area, **Then** the thumbnail strip appears.
3. **Given** the thumbnail strip is visible, **When** the user moves the mouse away from the strip area, **Then** the thumbnail strip hides again.
4. **Given** the user wants persistent access to the thumbnails, **When** the user clicks the toggle button, **Then** the thumbnail strip locks to visible; clicking again hides it.
5. **Given** the redesign is applied, **When** the thumbnail strip is rendered, **Then** it occupies less vertical space than the previous design.

---

### User Story 4 - Improved Image Viewer (Priority: P2)

The image viewer preserves aspect ratio when switching images, displays a skeleton placeholder matching the previous image size during loading, allocates more vertical space to the image, and provides zoom controls in the top-right corner of the viewer.

**Why this priority**: The image viewer is the core experience of the application. Improving it directly affects user satisfaction and usability.

**Independent Test**: Can be fully tested by navigating between images of different sizes, verifying skeleton display during load, and using zoom in / zoom out / reset controls.

**Acceptance Scenarios**:

1. **Given** the user navigates to a different image, **When** the new image loads, **Then** the viewer maintains its current aspect ratio without layout shifts.
2. **Given** the user navigates to a different image, **When** the image is loading, **Then** a skeleton placeholder the size of the previously viewed image is displayed.
3. **Given** the viewer layout is active, **When** the user views any image, **Then** the image occupies a larger proportion of the application window than in the current design.
4. **Given** the user is viewing an image, **When** the user clicks the zoom-in button in the top-right corner of the viewer, **Then** the image zooms in.
5. **Given** the user has zoomed in, **When** the user clicks the zoom-out button in the top-right corner of the viewer, **Then** the image zooms out.
6. **Given** the user has zoomed in or out, **When** the user clicks the reset-zoom button in the top-right corner of the viewer, **Then** the image returns to its default zoom level.

---

### User Story 5 - Album UI Improvements (Priority: P3)

The album grid is redesigned so that all album cards have a uniform size and layout. Each album cover displays the first image of the album and all covers share the same aspect ratio.

**Why this priority**: Visual consistency in the album grid improves scanability and perceived quality of the application.

**Independent Test**: Can be fully tested by viewing the album grid with multiple albums of varying cover image sizes and verifying all cards are the same size and all covers have the same aspect ratio.

**Acceptance Scenarios**:

1. **Given** the library contains multiple albums, **When** the album grid is displayed, **Then** all album cards have the same dimensions and grid layout.
2. **Given** an album exists in the library, **When** the album card is displayed, **Then** the cover image shown is the first image inside that album.
3. **Given** albums have cover images of different native sizes, **When** the album grid is displayed, **Then** all cover images are rendered at the same aspect ratio.

---

### Edge Cases

- What happens when the image viewer is open and the user resizes the window — does the FAB remain in the bottom-right corner?
- What happens if an album contains no images — what is shown as the cover?
- What happens when the user zooms in fully and then navigates to a new image — is zoom reset or preserved?
- What happens when the side panel is open and the user resizes the window to a very narrow width?
- What happens when the thumbnail strip toggle button is pressed while the strip is animating in or out?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display a floating action button (FAB) with a settings icon always visible in the bottom-right corner of the screen.
- **FR-002**: The FAB MUST remain visible and correctly styled in both light and dark themes.
- **FR-003**: The FAB MUST NOT overlap the main image display area of the image viewer.
- **FR-004**: The existing inline settings section MUST be hidden and replaced by the FAB entry point.
- **FR-005**: The application MUST display a settings side panel that opens when the user activates the FAB.
- **FR-006**: The side panel MUST contain all existing application settings.
- **FR-007**: The side panel MUST close when the user clicks the X button inside the panel.
- **FR-008**: The side panel MUST close when the user clicks outside the panel.
- **FR-009**: The side panel MUST close when the user presses the ESC key.
- **FR-010**: The thumbnail strip MUST be reduced in height compared to the current design.
- **FR-011**: The thumbnail strip MUST be hidden by default and appear when the user hovers over its area.
- **FR-012**: The thumbnail strip MUST hide again when the user moves the mouse away from its area.
- **FR-013**: The application MUST provide a toggle button to lock the thumbnail strip as visible or hidden.
- **FR-014**: The image viewer MUST preserve aspect ratio when switching between images.
- **FR-015**: The image viewer MUST display a skeleton placeholder (sized to match the previous image) while a new image loads.
- **FR-016**: The image viewer MUST allocate more vertical screen space to the image than the current design.
- **FR-017**: The image viewer MUST display zoom-in, zoom-out, and zoom-reset buttons in the top-right corner of the viewer.
- **FR-018**: All album cards in the library grid MUST have the same dimensions and uniform layout.
- **FR-019**: Each album card MUST display the first image of the album as its cover.
- **FR-020**: All album covers MUST be rendered at the same aspect ratio.

### Key Entities

- **FloatingActionButton**: Always-visible control anchored to the bottom-right of the viewport; renders a settings icon; triggers the settings side panel.
- **SettingsSidePanel**: Overlay panel containing all application settings; opened via the FAB; dismissed via X button, outside click, or ESC key.
- **ThumbnailStrip**: Horizontal strip of image thumbnails at the bottom of the image viewer; toggled by hover and a manual button.
- **ImageViewer**: The main image display area; supports aspect-ratio-preserving switching, skeleton loading, and zoom controls.
- **AlbumCard**: Card UI component in the library grid; uniform size; displays the first image as the cover at a fixed aspect ratio.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the settings panel in one click from any screen in the application.
- **SC-002**: The settings FAB is visible and reachable 100% of the time across all screens and both themes without overlapping content.
- **SC-003**: The image viewer occupies at least 20% more vertical space than the current design when the thumbnail strip is hidden.
- **SC-004**: Navigating between images produces no visible layout shift in the viewer area.
- **SC-005**: Users can zoom in, zoom out, and reset zoom without leaving the image viewer using controls reachable in a single click.
- **SC-006**: All album cards in the grid appear visually uniform; no card is larger or smaller than another regardless of cover image dimensions.
- **SC-007**: The thumbnail strip is hidden by default, reducing visual noise; it appears within 200 ms of the user hovering over its trigger area.

---

## Assumptions

- The current codebase already has a settings component and a ThumbnailStrip component that will be refactored, not rebuilt from scratch.
- The side panel opens from the right edge of the screen with a slide-in animation.
- The FAB is positioned above any other bottom-anchored UI elements (e.g., the thumbnail strip) to avoid overlap.
- Zoom controls operate on the currently displayed image only; zoom state resets when navigating to a different image.
- Album cover images already exist inside the ZIP files; the first image in the ZIP is used as the cover per the constitution (Principle II).
- The thumbnail strip toggle button is separate from the thumbnails themselves and always visible when the viewer is active.
- Desktop (Windows, Linux, macOS) is the only target platform per the project constitution; mobile hover/touch interactions are out of scope.
