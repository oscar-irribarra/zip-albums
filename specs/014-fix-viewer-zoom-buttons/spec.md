# Feature Specification: Fix Viewer Zoom Controls

**Feature Branch**: `014-fix-viewer-zoom-buttons`

**Created**: 2026-07-11

**Status**: Draft

**Input**: Bug — Zoom In, Zoom Out, and Reset Zoom buttons in the image viewer do not respond to clicks.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Zoom In on Current Image (Priority: P1)

A user is viewing an image in the album viewer and wants to zoom in to examine details more closely. They click the "+" zoom button. The image should enlarge in-place.

**Why this priority**: This is the primary reported bug. The control is visible and intended to be interactive, but produces no effect.

**Independent Test**: Can be fully tested by opening any album, navigating to the viewer, and clicking the "+" button — the image must visibly scale up.

**Acceptance Scenarios**:

1. **Given** an image is displayed at normal scale (100%), **When** the user clicks the "+" zoom button, **Then** the image enlarges by one zoom step (10%) up to the defined maximum (400%).
2. **Given** the image is already at the maximum zoom level, **When** the user clicks "+", **Then** the zoom level stays at the maximum and does not exceed it.
3. **Given** the zoom control is clicked repeatedly, **When** the click count would push zoom beyond the maximum, **Then** each click is handled independently with no compounding errors.

---

### User Story 2 — Zoom Out on Current Image (Priority: P1)

A user is viewing a zoomed-in image and wants to reduce the scale to see more of the image. They click the "−" zoom button. The image should shrink in-place.

**Why this priority**: Same severity as zoom-in; part of the same broken interaction trio.

**Independent Test**: Can be tested by zooming in first (via keyboard or state injection) then clicking the "−" button — the image must visibly scale down.

**Acceptance Scenarios**:

1. **Given** an image is displayed above normal scale, **When** the user clicks the "−" zoom button, **Then** the image shrinks by one zoom step (10%) down to the defined minimum (25%).
2. **Given** the image is at the minimum zoom level, **When** the user clicks "−", **Then** the zoom level stays at the minimum and does not go below it.

---

### User Story 3 — Reset Zoom and Pan (Priority: P1)

A user has zoomed and panned an image and wants to return to the original centered view. They click the "○" reset button. The image must return to 100% scale at the center of the viewport.

**Why this priority**: Without reset, users have no quick recovery path from an accidental zoom; same broken interaction as the other two buttons.

**Independent Test**: Can be tested by zooming and panning, then clicking "○" — the image must return to default scale and centered position in one click.

**Acceptance Scenarios**:

1. **Given** an image is zoomed in and panned off-center, **When** the user clicks the "○" reset button, **Then** the zoom level returns to 100% and the pan offset returns to the centered position.
2. **Given** the image is already at 100% with no pan offset, **When** the user clicks reset, **Then** the image remains at 100% and centered (no visual change, no error).

---

### User Story 4 — Zoom Controls Do Not Interfere with Image Panning (Priority: P2)

A user wants to use both the zoom buttons and manual image panning without one interaction disrupting the other.

**Why this priority**: The root cause of the bug (pointer capture on the parent container) also affects the boundary between drag and click interactions. This must remain reliable after the fix.

**Independent Test**: Click zoom buttons and then immediately drag the image — both operations must work correctly in sequence.

**Acceptance Scenarios**:

1. **Given** an image is zoomed in, **When** the user drags the image to pan, **Then** the image moves following the pointer without triggering a zoom change.
2. **Given** the user clicks a zoom button, **When** the click finishes, **Then** a subsequent drag operation pans the image normally.
3. **Given** a drag is in progress on the image frame, **When** the pointer moves, **Then** the zoom buttons remain inert (no unintended zoom during pan).

---

### Edge Cases

- What happens when a zoom button is clicked while an image is loading? The button click must still register and update the intended zoom level; the new scale applies when the image finishes loading.
- How does the system handle a rapid sequence of zoom-in clicks? Each click must fire independently; accumulated debounce or missed events must not occur.
- What happens when the user clicks outside the zoom button area but inside the image frame? A drag must start normally without triggering any zoom action.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to click Zoom In, Zoom Out, and Reset Zoom buttons and have the corresponding zoom action applied to the current image immediately.
- **FR-002**: Clicking any zoom control MUST NOT initiate an image drag or pan operation.
- **FR-003**: Clicking and dragging on the image frame (outside interactive controls) MUST initiate image panning and MUST NOT trigger zoom button actions.
- **FR-004**: Zoom level MUST be clamped to the defined minimum (25%) and maximum (400%) regardless of how many times the zoom buttons are clicked.
- **FR-005**: The Reset Zoom button MUST restore both the zoom level to 100% and the pan offset to the centered position in a single action.
- **FR-006**: Zoom controls MUST remain reachable and functional while an image is loading.
- **FR-007**: The fix MUST NOT break existing keyboard-based navigation (arrow keys, Home, End) or fullscreen toggle behavior.
- **FR-008**: The fix MUST NOT break the thumbnail strip pin/unpin or hover-reveal interaction.

### Key Entities

- **Zoom Level**: A numeric scale factor (0.25–4.0) representing how much the displayed image is magnified relative to its natural fit size. Persisted in viewer state; reset on image navigation.
- **Pan Offset**: An x/y pixel offset applied to the image position within the viewport. Reset on image navigation and on zoom reset.
- **Pointer Capture**: A browser mechanism that routes all pointer events to a specific element. Used by the image frame to support continuous drag panning; must be restricted to true drag interactions only.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking any of the three zoom controls (Zoom In, Zoom Out, Reset Zoom) produces a visible change in image scale within 100 ms of the click.
- **SC-002**: All three zoom controls work correctly across 100% of test scenarios (unit + manual) with no regressions in existing viewer tests.
- **SC-003**: Image panning via drag continues to work correctly after the fix, with zero drag-related test regressions.
- **SC-004**: No new errors or warnings are introduced in the browser/application console as a result of the fix.

---

## Assumptions

- The viewer is embedded in a desktop application (Tauri); standard browser pointer event behavior applies within the WebView.
- Zoom step size (10%), minimum (25%), and maximum (400%) are fixed and do not need to be user-configurable as part of this fix.
- The fix applies only to the image viewer; no other screens have zoom controls.
- Mobile/touch interactions are out of scope for this fix; the application targets desktop only.
- Existing unit tests (Vitest + Testing Library) provide the regression safety net and do not need to be rewritten, only extended where needed.
