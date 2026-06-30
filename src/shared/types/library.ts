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
