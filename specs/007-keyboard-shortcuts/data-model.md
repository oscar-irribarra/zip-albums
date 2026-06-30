# Data Model: Keyboard Shortcuts

## Entities

### 1) KeyboardShortcutBinding

Represents the mapping between a key gesture and an application action.

- `id: string`
- `gesture: string` (examples: `ArrowLeft`, `ArrowRight`, `Home`, `End`, `f`, `Escape`, `Ctrl+O`, `Delete`)
- `action: string` (example: `viewer.previous`, `viewer.next`, `viewer.first`, `viewer.last`, `viewer.fullscreen.enter`, `viewer.fullscreen.exit`, `library.importZip`, `library.deleteSelected`)
- `scope: string` (`viewer`, `library`, `global`)

Validation rules:

- Gestures must be unique per scope.
- Action must resolve to an existing command path in current frontend/store flow.
- Bindings are runtime configuration for this feature version (not user-customizable yet).

### 2) ViewerNavigationContext

Runtime context used to validate viewer navigation shortcuts.

- `album_id: string | null`
- `current_index: number | null`
- `total_images: number | null`
- `viewer_loading: boolean`

Validation rules:

- Navigation commands are valid only when `album_id` is present and `current_index`/`total_images` are known.
- Previous is valid only if `current_index > 0`.
- Next is valid only if `current_index < total_images - 1`.
- Home/End are valid only when `total_images > 0`.

### 3) LibraryActionContext

Runtime context for import/delete keyboard actions.

- `window_focused: boolean`
- `selected_album_id: string | null`
- `editable_target_active: boolean`

Validation rules:

- Ctrl+O requires `window_focused` and `editable_target_active = false`.
- Delete requires `selected_album_id` and confirmation from user.

### 4) FullscreenContext

Runtime context for fullscreen transitions.

- `is_fullscreen: boolean`
- `viewer_active: boolean`

Validation rules:

- `F` enters fullscreen only when viewer is active and not already fullscreen.
- `Escape` exits fullscreen only when currently fullscreen.

## Relationships

- `KeyboardShortcutBinding` resolves to actions that use `ViewerNavigationContext`, `LibraryActionContext`, or `FullscreenContext`.
- One active viewer session produces one active `ViewerNavigationContext`.
- `LibraryActionContext` and `FullscreenContext` gate whether shortcut actions execute or are ignored.

## State Transitions

1. Keydown event received.
2. Evaluate editable-target guard.
3. Match key gesture to binding.
4. Validate relevant context.
5. Execute mapped action through existing store/infrastructure path.
6. Update UI state or error state using existing store fields.
