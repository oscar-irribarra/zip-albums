# Feature Specification: Image Cache

**Feature Branch**: `[006-image-cache]`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "# 006-image-cache\n\nEsta feature no es visible para el usuario.\n\nEs un Enabler.\n\n## Objetivo\n\nReducir tiempos de carga.\n\n### Criterios\n\n- Mantener en memoria la imagen anterior.\n- Mantener la imagen siguiente.\n- Liberar imágenes lejanas.\n- No consumir memoria excesiva."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegacion fluida entre imagenes (Priority: P1)

Como usuario que recorre un album, quiero que la imagen anterior y la siguiente esten listas para visualizarse para navegar sin pausas perceptibles.

**Why this priority**: La experiencia principal del producto es recorrer imagenes; reducir esperas en cada cambio de imagen impacta directamente el valor percibido.

**Independent Test**: Con un album cargado, avanzar y retroceder una imagen en secuencia y verificar que las transiciones inmediatas no presentan esperas perceptibles en la mayoria de cambios.

**Acceptance Scenarios**:

1. **Given** an album is open and the user is viewing image N, **When** the user moves to image N+1, **Then** the next image is shown without espera perceptible para navegacion normal.
2. **Given** an album is open and the user is viewing image N, **When** the user moves to image N-1, **Then** the previous image is shown without espera perceptible para navegacion normal.
3. **Given** the user advances from image N to N+1, **When** the new current image is displayed, **Then** the cache window is updated to keep the new adjacent images ready.

---

### User Story 2 - Uso de memoria controlado (Priority: P2)

Como usuario con recursos de equipo variables, quiero que la aplicacion limite imagenes en memoria para evitar degradacion por consumo excesivo.

**Why this priority**: El rendimiento sostenido requiere equilibrio entre velocidad de carga y consumo de memoria; sin limites, la aplicacion puede degradarse en albums grandes.

**Independent Test**: Navegar por un album largo de forma continua, medir memoria de la aplicacion y verificar que el consumo se mantiene dentro del limite definido sin crecimiento indefinido.

**Acceptance Scenarios**:

1. **Given** the user has navigated through many images, **When** images are no longer near the current position, **Then** those distant images are released from in-memory cache.
2. **Given** memory usage reaches the configured cache budget, **When** new nearby images must be cached, **Then** the system evicts the farthest cached images first.
3. **Given** rapid back-and-forth navigation within nearby images, **When** cache updates occur, **Then** the system preserves adjacent images and avoids unnecessary reload churn.

---

### User Story 3 - Comportamiento estable en bordes (Priority: P3)

Como usuario, quiero que la navegacion funcione igual de bien al inicio y al final del album sin errores de carga.

**Why this priority**: Los limites del album son puntos frecuentes de fallo en navegacion por indices; validarlos asegura robustez del flujo principal.

**Independent Test**: Abrir un album, situarse en la primera y ultima imagen y validar que el cache de adyacentes se ajusta sin intentar cargar indices inexistentes.

**Acceptance Scenarios**:

1. **Given** the user is at the first image, **When** cache is refreshed, **Then** only valid adjacent images are kept and no invalid previous index is requested.
2. **Given** the user is at the last image, **When** cache is refreshed, **Then** only valid adjacent images are kept and no invalid next index is requested.

---

### Edge Cases

- Jump navigation: when the user jumps from image N to a distant image M, the cache should be recalculated around M and stale distant items should be released promptly.
- Very large images: when adjacent images are unusually heavy, cache policy should still enforce memory budget and evict distant entries to avoid excessive memory growth.
- Tiny albums (1 or 2 images): cache logic should gracefully keep only existing images without redundant cache operations.
- Fast directional changes: repeated rapid next/previous actions should not create duplicated cached entries for the same image.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain an in-memory cache window centered on the current image during album navigation.
- **FR-002**: The system MUST keep the previous image in memory whenever a valid previous image exists.
- **FR-003**: The system MUST keep the next image in memory whenever a valid next image exists.
- **FR-004**: The system MUST release cached images that are outside the active cache window.
- **FR-005**: The system MUST enforce a bounded memory budget for image cache to prevent unbounded growth.
- **FR-006**: The system MUST prioritize retaining current and adjacent images when memory budget enforcement requires eviction.
- **FR-007**: The system MUST handle first-image and last-image boundaries without requesting non-existent neighbors.
- **FR-008**: The system MUST recalculate cache contents when the current image changes, including sequential moves and jump navigation.
- **FR-009**: The system MUST avoid duplicate in-memory entries for the same image within a single album session.

### Key Entities *(include if feature involves data)*

- **Image Cache Entry**: A transient in-memory representation of one decoded or ready-to-display image associated with an album image index.
- **Cache Window**: The set of image indices considered near the current position and therefore eligible to remain in memory.
- **Cache Budget Policy**: Rules that cap total cache memory and define eviction priority for entries outside the active window.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: During sequential navigation tests, at least 95% of next/previous transitions complete without perceptible wait to end users.
- **SC-002**: During a 10-minute navigation session on a large album, cache-related memory usage remains within the defined budget in 100% of sampled intervals.
- **SC-003**: In boundary tests (first and last image), 100% of navigation actions complete without invalid neighbor access attempts.
- **SC-004**: In stress tests with repeated jump navigation, cache size returns to within budget within 2 navigation steps after each jump in at least 95% of cases.

## Assumptions

- This feature is an internal enabler and does not introduce new user-facing controls or settings.
- Cache lifetime is limited to the active album viewing session and does not persist across application restarts.
- Existing image loading behavior remains the source for fetching uncached images; this feature only governs in-memory retention and eviction.
- Validation of memory budget thresholds will use project-standard performance test environments and representative large albums.
