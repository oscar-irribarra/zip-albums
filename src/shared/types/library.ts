export type SortOrder = "name" | "date";

export interface AlbumSummary {
  id: string;
  title: string;
  path: string;
  image_count: number;
  cover_index: number;
  imported_at: string;
  last_opened_at?: string | null;
  cover_data?: string | null;
}

export interface LibraryResponse {
  albums: AlbumSummary[];
  sort_order: string;
}

export interface DeleteAlbumResponse {
  success: boolean;
  removed_album_id?: string | null;
}

export interface ImportAlbumRequest {
  zip_path: string;
}

export interface ImportAlbumResponse {
  album: AlbumSummary;
}

export type ImportErrorCode =
  | "UNSUPPORTED_FORMAT"
  | "ZIP_CORRUPTED"
  | "ZIP_EMPTY"
  | "NO_SUPPORTED_IMAGES"
  | "DUPLICATE_ALBUM"
  | "IO_FAILURE";

export interface ImportAlbumError {
  code: ImportErrorCode;
  message: string;
  details?: string;
}

export interface OpenAlbumViewerRequest {
  album_id: string;
}

export interface OpenAlbumViewerResponse {
  album_id: string;
  album_name: string;
  total_images: number;
  start_index: number;
}

export interface LoadAlbumImageRequest {
  album_id: string;
  image_index: number;
}

export interface LoadAlbumImageResponse {
  album_id: string;
  image_index: number;
  image_source: string;
  mime_type: string;
}

export interface ViewerImageCacheEntry {
  album_id: string;
  image_index: number;
  image_source: string;
  mime_type: string;
  cached_at: string;
  estimated_bytes: number;
}

export interface CacheWindowState {
  current_index: number;
  window_start: number;
  window_end: number;
  max_entries: number;
  max_estimated_bytes: number;
  total_estimated_bytes: number;
}

export interface ImageCacheDiagnostics {
  current_hit: boolean;
  previous_cached: boolean;
  next_cached: boolean;
  cache_entries: number;
  cache_estimated_bytes: number;
}

export type ShortcutGesture =
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End"
  | "f"
  | "Escape"
  | "Ctrl+O"
  | "Delete";

export interface ShortcutGuardContext {
  viewer_active: boolean;
  is_fullscreen: boolean;
  selected_album_id: string | null;
  editable_target_active: boolean;
}

export interface SaveReadingProgressRequest {
  album_id: string;
  last_image_index: number;
}

export interface SaveReadingProgressResponse {
  saved: boolean;
  updated_at: string;
}

export type ViewerErrorCode =
  | "ALBUM_NOT_FOUND"
  | "IMAGE_INDEX_OUT_OF_RANGE"
  | "ZIP_READ_FAILURE"
  | "UNSUPPORTED_IMAGE"
  | "PROGRESS_READ_FAILURE"
  | "PROGRESS_WRITE_FAILURE"
  | "IO_FAILURE";

export interface ViewerCommandError {
  code: ViewerErrorCode;
  message: string;
  details?: string;
}

export interface AlbumViewSession {
  album_id: string;
  album_name: string;
  total_images: number;
  current_index: number;
  started_at: string;
}

export type ThemePreference = "light" | "dark" | "system";

export interface UserSettings {
  theme: ThemePreference;
  albums_directory: string | null;
  fullscreen: boolean;
  remember_last_album: boolean;
  initial_zoom: number;
  updated_at: string;
}

export interface UpdateUserSettingsRequest {
  theme: ThemePreference;
  albums_directory: string | null;
  fullscreen: boolean;
  remember_last_album: boolean;
  initial_zoom: number;
}

export interface UpdateUserSettingsResponse {
  settings: UserSettings;
}

export interface StartupContextResponse {
  settings: UserSettings;
  restore_album_id: string | null;
  warnings: string[];
}

export interface SetLastOpenedAlbumRequest {
  album_id: string;
}

export interface SetLastOpenedAlbumResponse {
  saved: boolean;
  updated_at: string;
}

export type SettingsErrorCode =
  | "SETTINGS_READ_FAILURE"
  | "SETTINGS_WRITE_FAILURE"
  | "INVALID_ALBUMS_DIRECTORY"
  | "INVALID_ZOOM_VALUE"
  | "STARTUP_CONTEXT_FAILURE"
  | "ALBUM_NOT_FOUND"
  | "IO_FAILURE";

export interface SettingsCommandError {
  code: SettingsErrorCode;
  message: string;
  details?: string;
}
