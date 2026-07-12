# Feature Specification: Image Zoom

**Feature Branch**: `013-image-zoom-fix`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Allow image zoom. Zoom In increases scale by 10%. Zoom Out decreases scale by 10%. Reset restores scale to 100%. Scale is clamped between 25% and 400%. Buttons remain enabled within valid range. The zoom allows you to drag the image within the zoomed-in section. Reset restore initial image position."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Zoom In and Out (Priority: P1)

A user viewing an image wants to examine it more closely or see a wider portion. They activate Zoom In to enlarge the image in increments, or Zoom Out to reduce it, staying within defined scale limits.

**Why this priority**: Zoom In/Out is the core capability of this feature. Without it, no other zoom behavior is meaningful.

**Independent Test**: Can be fully tested by opening an image and pressing Zoom In/Out controls repeatedly, verifying that scale changes by 10% each step, stops at limits, and controls remain active throughout.

**Acceptance Scenarios**:

1. **Given** an image is displayed at 100% scale, **When** the user activates Zoom In, **Then** the image scale increases to 110%.
2. **Given** an image is displayed at 100% scale, **When** the user activates Zoom Out, **Then** the image scale decreases to 90%.
3. **Given** the image is at 400% scale, **When** the user activates Zoom In, **Then** the scale remains at 400% and the Zoom In control remains enabled.
4. **Given** the image is at 25% scale, **When** the user activates Zoom Out, **Then** the scale remains at 25% and the Zoom Out control remains enabled.
5. **Given** the image is at any scale between 25% and 400%, **When** the user activates Zoom In or Zoom Out, **Then** the scale changes by exactly 10% and both controls remain enabled.

---

### User Story 2 - Pan Image While Zoomed (Priority: P2)

A user who has zoomed in wants to inspect a specific part of the image that is no longer visible. They click and drag the image to pan to the area of interest.

**Why this priority**: Without panning, zooming in beyond the viewport renders much of the image unreachable and makes the feature incomplete.

**Independent Test**: Can be fully tested by zooming in until the image exceeds the viewport, then clicking and dragging to confirm that different portions of the image become visible.

**Acceptance Scenarios**:

1. **Given** an image is zoomed in beyond the viewport boundaries, **When** the user clicks and drags within the image area, **Then** the image pans smoothly in the direction of the drag.
2. **Given** the user is dragging the image, **When** they release the pointer, **Then** the image remains at the dragged position.
3. **Given** an image is at 100% scale and fits entirely within the viewport, **When** the user attempts to drag, **Then** the image may move but the zoom level is unchanged.

---

### User Story 3 - Reset Zoom and Position (Priority: P3)

A user who has zoomed and panned wants to return to the default view. They activate Reset to restore both the scale and the image position to their initial state in a single action.

**Why this priority**: Reset is a convenience action that makes the feature more usable but is not required for basic zoom functionality.

**Independent Test**: Can be fully tested by zooming in, dragging the image, then activating Reset and confirming that scale returns to 100% and the image is back at its original position.

**Acceptance Scenarios**:

1. **Given** an image is at a non-default scale and panned position, **When** the user activates Reset, **Then** the image scale returns to 100% and the position returns to its initial centered/default state.
2. **Given** an image is already at 100% scale and the default position, **When** the user activates Reset, **Then** the view is unchanged.

---

### Edge Cases

- What happens when the image is very small and 400% scale still fits within the viewport — panning should still work without constraining the image artificially.
- What happens when the viewport is resized while the image is zoomed — the zoom level should be preserved and panning origin should remain consistent.
- How does the system handle rapid repeated Zoom In/Out activations — scale should clamp correctly and never exceed bounds.
- What happens when the user switches to a different image while zoomed — scale and position should reset to defaults for the new image.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The viewer MUST increase the displayed image scale by 10% each time Zoom In is activated.
- **FR-002**: The viewer MUST decrease the displayed image scale by 10% each time Zoom Out is activated.
- **FR-003**: The image scale MUST be clamped to a minimum of 25% and a maximum of 400% at all times.
- **FR-004**: Zoom In and Zoom Out controls MUST remain enabled when the current scale is within the valid range (25%–400%).
- **FR-005**: Users MUST be able to click and drag the image to pan when it is zoomed in.
- **FR-006**: The viewer MUST restore the image scale to 100% when Reset is activated.
- **FR-007**: The viewer MUST restore the image to its initial position (centered/default) when Reset is activated.
- **FR-008**: When the user navigates to a new image, scale and position MUST reset to their default values.

### Key Entities

- **Zoom State**: Tracks the current scale factor (25%–400%) and the current pan offset (x, y) for the displayed image.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can zoom in or out to any step between 25% and 400% without the scale ever exceeding those bounds across 100% of zoom activations.
- **SC-002**: The image responds to zoom and pan interactions with no perceptible lag during normal use.
- **SC-003**: Users can reach any part of a zoomed image by dragging, covering the full image surface.
- **SC-004**: Activating Reset returns the image to 100% scale and default position in a single action, 100% of the time.
- **SC-005**: Navigating between images always starts each image at 100% scale and the default position.

## Assumptions

- The image viewer already displays images and supports navigation between them; this feature adds zoom and pan controls to the existing viewer.
- Zoom In/Out controls are discrete button-based actions (not pinch/scroll gestures), consistent with the existing desktop keyboard-and-mouse interaction model.
- The initial/default image position is centered within the viewer viewport.
- Panning is unconstrained — the user can drag the image freely, including beyond the viewport edge, to allow inspection of any part of the image.
- Scale steps of 10% are always relative to a base of 10% increments from 100% (i.e., 100%, 110%, 120%, etc.), not multiplicative compounding per step.
- This feature applies only to the image viewer; it does not affect album thumbnails or any other view.
- Keyboard shortcut bindings for zoom are out of scope for this spec (handled separately if needed).
