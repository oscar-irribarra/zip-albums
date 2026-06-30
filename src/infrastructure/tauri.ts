import { invoke } from "@tauri-apps/api/core";
import type {
  DeleteAlbumResponse,
  ImportAlbumResponse,
  LibraryResponse,
  LoadAlbumImageRequest,
  LoadAlbumImageResponse,
  OpenAlbumViewerRequest,
  OpenAlbumViewerResponse,
  SaveReadingProgressRequest,
  SaveReadingProgressResponse,
} from "../shared/types/library";

export function getLibrary() {
  return invoke<LibraryResponse>( "get_library" );
}

export function deleteAlbum( payload: { album_id: string } ) {
  return invoke<DeleteAlbumResponse>( "delete_album", { payload } );
}

export function importAlbum( payload: { zip_path: string } ) {
  return invoke<ImportAlbumResponse>( "import_album", { payload } );
}

export function openAlbumViewer( payload: OpenAlbumViewerRequest ) {
  return invoke<OpenAlbumViewerResponse>( "open_album_viewer", { payload } );
}

export function loadAlbumImage( payload: LoadAlbumImageRequest ) {
  return invoke<LoadAlbumImageResponse>( "load_album_image", { payload } );
}

export function saveReadingProgress( payload: SaveReadingProgressRequest ) {
  return invoke<SaveReadingProgressResponse>( "save_reading_progress", { payload } );
}
