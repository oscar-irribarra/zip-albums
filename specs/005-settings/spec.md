# Feature Specification: Settings Persistence

**Feature Branch**: `[005-settings]`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Persistir preferencias del usuario: tema, carpeta de albumes, pantalla completa, recordar ultimo album y zoom inicial; mantener configuracion entre ejecuciones."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Configurar preferencias (Priority: P1)

Como usuario, quiero configurar las preferencias principales de la aplicacion para adaptarla a mi forma de uso.

**Why this priority**: Configuring preferences is the core value of this feature and enables all expected personalization behavior.

**Independent Test**: Open settings, change each supported preference, save changes, and verify the updated values are reflected immediately in the application behavior.

**Acceptance Scenarios**:

1. **Given** the user opens the settings screen, **When** the user selects a theme and confirms the change, **Then** the application applies the selected theme.
2. **Given** the user opens the settings screen, **When** the user selects an albums folder and confirms the change, **Then** the selected folder is saved as the active albums folder.
3. **Given** the user opens the settings screen, **When** the user enables or disables fullscreen preference, **Then** the application stores that fullscreen preference.
4. **Given** the user opens the settings screen, **When** the user enables or disables remember-last-album, **Then** the application stores that preference for future launches.
5. **Given** the user opens the settings screen, **When** the user sets an initial zoom value and confirms the change, **Then** the application stores that zoom value for new album viewing sessions.

---

### User Story 2 - Recuperar configuracion al reiniciar (Priority: P2)

Como usuario, quiero que la aplicacion recuerde mi configuracion entre ejecuciones para no tener que configurarla cada vez.

**Why this priority**: Persistence is the expected outcome of settings; without it, user configuration effort is lost.

**Independent Test**: Change settings, fully close the application, relaunch it, and verify all saved settings are restored automatically.

**Acceptance Scenarios**:

1. **Given** the user has saved settings, **When** the user closes and reopens the application, **Then** all saved preferences are restored.
2. **Given** remember-last-album is enabled and an album was last opened, **When** the user relaunches the application, **Then** the app restores that album as the starting context.
3. **Given** remember-last-album is disabled, **When** the user relaunches the application, **Then** the app does not automatically restore a last-opened album.

---

### Edge Cases

- What happens when the user selects an albums folder that is no longer accessible at next launch? The app should keep the preference value, notify the user the folder is unavailable, and allow selecting a new folder.
- What happens when stored settings data is partially missing or invalid? The app should load valid preferences and apply safe defaults only for invalid fields.
- What happens when the user sets an out-of-range zoom value? The app should reject it with clear feedback and keep the last valid zoom value.
- What happens when no album has been opened yet and remember-last-album is enabled? The app should start normally without attempting album restoration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a settings interface where users can view and modify all configurable preferences in one place.
- **FR-002**: The system MUST allow users to choose and save the application theme.
- **FR-003**: The system MUST allow users to choose and save the albums folder location.
- **FR-004**: The system MUST allow users to enable or disable fullscreen preference.
- **FR-005**: The system MUST allow users to enable or disable remembering the last opened album.
- **FR-006**: The system MUST allow users to set and save an initial zoom preference used when opening album views.
- **FR-007**: The system MUST persist all settings between application executions without requiring user reconfiguration.
- **FR-008**: The system MUST restore persisted settings automatically during application startup.
- **FR-009**: The system MUST restore the last opened album on startup only when remember-last-album is enabled and a previously opened album exists.
- **FR-010**: The system MUST validate settings values before saving and prevent invalid values from being persisted.
- **FR-011**: The system MUST provide a clear user-facing message when a saved albums folder cannot be accessed.

### Key Entities *(include if feature involves data)*

- **User Settings**: A persisted preference set containing theme, albums folder, fullscreen preference, remember-last-album preference, and initial zoom value.
- **Session Launch State**: Startup context derived from user settings, including whether to restore a last opened album.
- **Last Opened Album Reference**: Metadata pointer to the most recently opened album, used only when remember-last-album is enabled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability tests, at least 95% of users can update all five target settings in under 90 seconds without assistance.
- **SC-002**: In persistence tests, 100% of saved settings remain unchanged after closing and reopening the application.
- **SC-003**: In startup behavior tests, the application applies the saved theme, fullscreen preference, and initial zoom correctly in at least 95% of launches.
- **SC-004**: In restoration tests, when remember-last-album is enabled and a last album exists, at least 95% of launches restore that album automatically.

## Assumptions


- Settings apply to the local desktop user profile of this application instance.
- A default value exists for each preference so the application can start even when no user settings were saved previously.
- The feature scope does not include cloud sync or sharing settings across devices.
- Album restoration behavior depends on an existing valid last-opened-album reference.
