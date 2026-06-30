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
  SetLastOpenedAlbumRequest,
  SetLastOpenedAlbumResponse,
  StartupContextResponse,
  UpdateUserSettingsRequest,
  UpdateUserSettingsResponse,
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

export function getStartupContext() {
  return invoke<StartupContextResponse>( "get_startup_context" );
}

export function updateUserSettings( payload: UpdateUserSettingsRequest ) {
  return invoke<UpdateUserSettingsResponse>( "update_user_settings", { payload } );
}

export function setLastOpenedAlbum( payload: SetLastOpenedAlbumRequest ) {
  return invoke<SetLastOpenedAlbumResponse>( "set_last_opened_album", { payload } );
}
