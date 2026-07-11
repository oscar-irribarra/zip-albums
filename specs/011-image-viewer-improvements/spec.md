# Feature Specification: Image Viewer Improvements

**Feature Branch**: `011-image-viewer-improvements`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "Se debe mejorar la interaccion de usuario, correccion de bugs — US-001 Zoom, US-002 Cambio de imagen, US-003 Franja de miniaturas, US-004 Botones Navegacion"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Image Zoom Controls (Priority: P1)

A user viewing an image in the viewer wants to zoom in to see detail, zoom out to see the full picture, and reset zoom to its default state. All zoom operations keep the image centered in the viewport. When zoomed in, the user can pan the visible area by dragging with the mouse.

**Why this priority**: Zoom is a core interaction for an image viewer. Without it the viewer cannot adequately serve users who need to inspect image detail.

**Independent Test**: Can be fully tested by opening an album, clicking the "+" zoom button multiple times to confirm zoom increases, clicking "−" to confirm zoom decreases, clicking reset to confirm zoom returns to default, then dragging while zoomed in to confirm panning works.

**Acceptance Scenarios**:

1. **Given** an image is displayed in the viewer, **When** the user clicks the "+" zoom button, **Then** the image zoom level increases by one step and the image remains centered in the viewport.
2. **Given** an image is displayed in the viewer at a zoomed-in state, **When** the user clicks the "−" zoom button, **Then** the image zoom level decreases by one step and the image remains centered.
3. **Given** an image is displayed at a non-default zoom level, **When** the user clicks the reset zoom button, **Then** the image zoom resets to its default level and the image is centered.
4. **Given** the image is zoomed in beyond the viewport boundaries, **When** the user drags the image with the mouse, **Then** the image pans smoothly and only within the bounds of the zoomed image area.
5. **Given** the image zoom is at the default level, **When** the image fits entirely within the viewport, **Then** the image is centered both horizontally and vertically.

---

### User Story 2 - Image Change State Reset (Priority: P1)

A user navigating between images in an album expects each image to appear fresh — at default zoom, centered, and with a loading skeleton that matches the active application theme — when they switch from one image to the next.

**Why this priority**: State leaking between images (carried-over zoom, off-center position, or mis-themed skeleton) creates a confusing and broken experience. This is a correctness requirement.

**Independent Test**: Can be fully tested by zooming into and panning image N, then navigating to image N+1, and verifying it appears at default zoom, centered, with the correct skeleton color before loading.

**Acceptance Scenarios**:

1. **Given** the user has zoomed into the current image, **When** the user navigates to the next or previous image, **Then** the new image is displayed at the default zoom level (zoom reset).
2. **Given** the user has panned the current image away from center, **When** the user navigates to the next or previous image, **Then** the new image appears centered in the viewport (position reset).
3. **Given** the application is using the dark theme, **When** the next image is loading and the skeleton is visible, **Then** the skeleton uses dark theme colors consistent with the rest of the application.
4. **Given** the application is using the light theme, **When** the next image is loading and the skeleton is visible, **Then** the skeleton uses light theme colors consistent with the rest of the application.

---

### User Story 3 - Thumbnail Strip (Priority: P2)

A user wants to quickly browse or jump to any image in the album using a thumbnail strip. The strip is hidden by default so it does not reduce the viewing area for the main image. It appears on hover over a dedicated zone at the bottom of the viewer and disappears when the hover ends. Its visibility toggle never changes the size or aspect ratio of the main image.

**Why this priority**: The thumbnail strip is a navigation aid that improves UX without being essential to core viewing. Its redesign ensures it matches the album's portrait aspect ratio and doesn't disrupt the layout.

**Independent Test**: Can be fully tested by opening an album, confirming the thumbnail strip is not visible by default, hovering over the bottom bar to reveal it, clicking a thumbnail to jump to that image, and moving the mouse away to confirm it hides again.

**Acceptance Scenarios**:

1. **Given** the image viewer is open, **When** the user has not hovered over the thumbnail zone, **Then** the thumbnail strip is not visible.
2. **Given** the image viewer is open, **When** the user moves the mouse over the thumbnail bar zone at the bottom of the viewer, **Then** the thumbnail strip expands and becomes visible without resizing the main image.
3. **Given** the thumbnail strip is visible, **When** the user moves the mouse away from the thumbnail bar, **Then** the thumbnail strip collapses and hides without resizing the main image.
4. **Given** the thumbnail strip is visible, **When** the user clicks a thumbnail, **Then** the viewer navigates to that image.
5. **Given** the thumbnail strip is displayed, **When** the thumbnails render, **Then** each thumbnail uses a rectangular vertical shape (portrait orientation) to match the natural aspect ratio of the images.
6. **Given** the thumbnail strip is toggled visible or hidden, **When** the transition occurs, **Then** the main image display area maintains its original size and aspect ratio throughout.

---

### User Story 4 - Navigation Button Layout (Priority: P2)

A user navigating the viewer expects clearly positioned, accessible navigation controls. The Back button is outside the viewer image area and styled to match the active theme. The Previous, Next, and Thumbnails buttons are centered and positioned outside the image display section.

**Why this priority**: Proper button placement prevents visual clutter on the image and ensures consistent, accessible navigation regardless of the displayed image content.

**Independent Test**: Can be fully tested by opening an album, verifying the Back button is positioned outside the viewer image area, switching themes to confirm Back adapts, and verifying Previous/Next/Thumbnails are centered and outside the viewer section.

**Acceptance Scenarios**:

1. **Given** the image viewer is open, **When** the user inspects the layout, **Then** the Back button is positioned outside the image display area and does not overlap the image.
2. **Given** the active theme changes (light ↔ dark), **When** the viewer is open, **Then** the Back button appearance adapts to match the new theme.
3. **Given** the image viewer is open, **When** the user inspects the layout, **Then** the Previous, Next, and Thumbnails buttons are centered horizontally in the application.
4. **Given** the image viewer is open, **When** the user inspects the layout, **Then** the Previous, Next, and Thumbnails buttons are positioned outside the image display section (not overlapping the image).

---

### Edge Cases

- What happens when the user clicks "−" zoom at the minimum zoom level? The zoom level must not decrease below its minimum bound.
- What happens when the user clicks "+" zoom at the maximum zoom level? The zoom level must not exceed its maximum bound.
- What happens when the image is smaller than the viewport at default zoom? The image must still be centered without distortion or stretching.
- What happens when the album has only one image? The Previous and Next buttons must be disabled or hidden to prevent invalid navigation.
- What happens when panning a zoomed image toward its edges? The image must not be dragged so far that the viewport shows empty space beyond the image boundary.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The viewer MUST provide a "+" button that increases the image zoom level by a fixed step per click.
- **FR-002**: The viewer MUST provide a "−" button that decreases the image zoom level by a fixed step per click, with a minimum zoom bound.
- **FR-003**: The viewer MUST provide a reset zoom button that returns the image to its default zoom level and centers it.
- **FR-004**: When the image is zoomed beyond the viewport, the user MUST be able to pan the image by dragging with the mouse.
- **FR-005**: The image MUST always be centered in the viewport whenever it fits within the viewport area at the current zoom level.
- **FR-006**: When the user navigates to a different image, the zoom level MUST reset to the default value.
- **FR-007**: When the user navigates to a different image, the image position MUST reset to centered.
- **FR-008**: The loading skeleton displayed while an image loads MUST use colors that match the active application theme (light or dark).
- **FR-009**: The thumbnail strip MUST be hidden by default when the viewer is open.
- **FR-010**: The thumbnail strip MUST become visible when the user hovers over the thumbnail bar zone at the bottom of the viewer.
- **FR-011**: The thumbnail strip MUST hide when the user moves the mouse away from the thumbnail bar zone.
- **FR-012**: Thumbnails in the strip MUST use a rectangular vertical (portrait) shape to reflect the natural image aspect ratio.
- **FR-013**: Toggling the thumbnail strip visibility MUST NOT change the size or aspect ratio of the main image display area.
- **FR-014**: The Back button MUST be positioned outside the image display area so it does not overlap the image.
- **FR-015**: The Back button MUST adapt its appearance (colors, styling) according to the active application theme.
- **FR-016**: The Previous, Next, and Thumbnails toggle buttons MUST be horizontally centered in the application.
- **FR-017**: The Previous, Next, and Thumbnails toggle buttons MUST be positioned outside the image display section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can increase, decrease, and reset zoom without the image jumping or losing center alignment in any case.
- **SC-002**: Navigating between images always presents the next image at the default zoom and centered position with no visible state carry-over from the previous image.
- **SC-003**: The loading skeleton is visually indistinguishable from other skeleton elements in the active theme (light or dark) on every image change.
- **SC-004**: The thumbnail strip appears and disappears exclusively on hover interaction and never causes the main image to resize or shift.
- **SC-005**: All navigation buttons (Back, Previous, Next, Thumbnails) are consistently positioned outside the image area and remain legible across both application themes.

## Assumptions

- The application already has an image viewer feature with a thumbnail strip, navigation buttons, and a loading skeleton; this feature refines and corrects those existing components.
- Zoom steps (increment/decrement amount) and the minimum/maximum zoom bounds are determined by the implementor based on what feels natural for typical album images.
- "Outside the image display section" for navigation buttons means they are rendered in a toolbar or control bar area that is visually and structurally separate from the image canvas.
- Mouse drag panning applies only to pointer (mouse) interaction; touch/trackpad pan gestures are out of scope for this iteration.
- The thumbnail bar hover zone is always present at the bottom of the viewer (even when the strip is hidden) so users can discover it; its height is sufficient to be easily targeted by a mouse.
- Theme adaptation for the Back button means it uses the same design token set (colors, backgrounds, borders) as other themed UI controls in the application.
