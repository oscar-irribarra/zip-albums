# Feature Specification: Keyboard Shortcuts Navigation

**Feature Branch**: `[007-keyboard-shortcuts]`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Mejorar la navegacion con atajos de teclado para navegacion de imagenes, pantalla completa, importacion ZIP y eliminacion de albumes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar imagenes sin mouse (Priority: P1)

Como usuario que esta viendo un album, quiero moverme por las imagenes con el teclado para revisar contenido rapidamente sin depender del mouse.

**Why this priority**: La navegacion de imagenes es el flujo principal del visor; si no funciona por teclado, se degrada la experiencia base.

**Independent Test**: Puede probarse cargando un album con multiples imagenes y verificando el avance/retroceso y salto a extremos usando solo teclado.

**Acceptance Scenarios**:

1. **Given** que el usuario esta viendo una imagen que no es la primera, **When** presiona la flecha izquierda, **Then** se muestra la imagen anterior.
2. **Given** que el usuario esta viendo una imagen que no es la ultima, **When** presiona la flecha derecha, **Then** se muestra la imagen siguiente.
3. **Given** que el usuario esta viendo cualquier imagen de un album, **When** presiona Home, **Then** se muestra la primera imagen del album.
4. **Given** que el usuario esta viendo cualquier imagen de un album, **When** presiona End, **Then** se muestra la ultima imagen del album.

---

### User Story 2 - Controlar pantalla completa por teclado (Priority: P2)

Como usuario quiero entrar y salir de pantalla completa con atajos para concentrarme en la imagen y volver al modo normal de forma inmediata.

**Why this priority**: Mejora la inmersion durante la visualizacion y reduce friccion en tareas frecuentes de inspeccion.

**Independent Test**: Puede probarse abriendo una imagen, activando pantalla completa con teclado y saliendo con Escape, sin usar controles visuales.

**Acceptance Scenarios**:

1. **Given** que el visor esta en modo normal, **When** el usuario presiona F, **Then** el visor entra en pantalla completa.
2. **Given** que el visor esta en pantalla completa, **When** el usuario presiona Escape, **Then** el visor vuelve a modo normal.

---

### User Story 3 - Ejecutar acciones de biblioteca con atajos (Priority: P3)

Como usuario quiero importar un ZIP y eliminar un album con combinaciones de teclado para mantener un flujo rapido de gestion de biblioteca.

**Why this priority**: Son acciones de gestion importantes, pero secundarias frente al flujo de visualizacion.

**Independent Test**: Puede probarse desde la vista de biblioteca con un album seleccionado verificando que Ctrl+O inicia importacion y Delete solicita/elimina el album seleccionado.

**Acceptance Scenarios**:

1. **Given** que la aplicacion esta enfocada, **When** el usuario presiona Ctrl+O, **Then** se inicia el flujo de importacion de ZIP.
2. **Given** que existe un album seleccionado en la biblioteca, **When** el usuario presiona Delete y confirma la accion, **Then** el album se elimina de la biblioteca.

---

### Edge Cases

- Que ocurre si el usuario presiona navegacion (izquierda, derecha, Home, End) cuando no hay album abierto o no hay imagen cargada?
- Como responde el sistema al presionar izquierda en la primera imagen o derecha en la ultima imagen?
- Que ocurre si el usuario presiona Delete sin album seleccionado?
- Como se comportan los atajos cuando el foco esta en un campo de texto activo (por ejemplo, input de configuracion) para evitar acciones involuntarias?
- Que ocurre si el usuario presiona F cuando ya esta en pantalla completa o Escape cuando ya esta en modo normal?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir navegar a la imagen anterior con la tecla flecha izquierda cuando exista una imagen anterior disponible.
- **FR-002**: El sistema MUST permitir navegar a la imagen siguiente con la tecla flecha derecha cuando exista una imagen siguiente disponible.
- **FR-003**: El sistema MUST mostrar la primera imagen del album al presionar Home cuando un album este abierto.
- **FR-004**: El sistema MUST mostrar la ultima imagen del album al presionar End cuando un album este abierto.
- **FR-005**: El sistema MUST entrar en pantalla completa al presionar F desde el visor de imagen.
- **FR-006**: El sistema MUST salir de pantalla completa al presionar Escape cuando la aplicacion este en pantalla completa.
- **FR-007**: El sistema MUST iniciar el flujo de importacion de archivo ZIP al presionar Ctrl+O cuando la aplicacion este enfocada.
- **FR-008**: El sistema MUST permitir eliminar el album seleccionado al presionar Delete, solicitando confirmacion explicita antes de completar la eliminacion.
- **FR-009**: El sistema MUST ignorar atajos que dependan de contexto cuando dicho contexto no exista (por ejemplo, sin album seleccionado o sin imagen cargada) sin provocar errores visibles para el usuario.
- **FR-010**: El sistema MUST priorizar la edicion de texto en campos activos, evitando ejecutar atajos globales mientras el foco de escritura este en un control editable.
- **FR-011**: El sistema MUST mantener un comportamiento consistente de atajos en Windows, macOS y Linux con equivalentes nativos cuando corresponda.

### Key Entities *(include if feature involves data)*

- **Shortcut Action**: Definicion de una accion de usuario activada por una tecla o combinacion (por ejemplo, ir a siguiente imagen, importar ZIP).
- **Viewer Context**: Estado operativo del visor (modo normal/pantalla completa, indice de imagen actual, existencia de album abierto) que determina si un atajo aplica.
- **Library Selection**: Estado de seleccion de album en la biblioteca usado para habilitar o bloquear acciones como eliminar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En pruebas de aceptacion, el 100% de los atajos definidos (izquierda, derecha, Home, End, F, Ctrl+O, Delete, Escape) ejecutan la accion esperada en su contexto valido.
- **SC-002**: Al menos el 90% de usuarios de prueba completan una sesion de navegacion de 10 cambios de imagen sin usar mouse ni controles en pantalla.
- **SC-003**: El cambio visual de estado provocado por un atajo valido se percibe en menos de 1 segundo en al menos el 95% de las ejecuciones de prueba.
- **SC-004**: En pruebas de regresion, no se reportan eliminaciones de album accidentales por pulsaciones involuntarias sin confirmacion.

## Assumptions

- Los atajos se aplican cuando la ventana de la aplicacion esta activa y enfocada.
- La eliminacion de album afecta la biblioteca local y no altera el contenido original del ZIP, en linea con el principio de solo lectura de albumes.
- La experiencia con teclado debe coexistir con controles visuales ya existentes sin reemplazarlos.
- En plataformas donde el equivalente del modificador cambie, se mantiene la intencion funcional del atajo de importacion.
