mod services;

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use services::{
    file_system_service::FileSystemService,
    metadata_service::{AlbumMetadata, MetadataService},
    zip_service::ZipService,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct AlbumSummary {
    pub id: String,
    pub title: String,
    pub path: String,
    pub image_count: usize,
    pub cover_index: usize,
    pub imported_at: String,
    pub last_opened_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LibraryResponse {
    pub albums: Vec<AlbumSummary>,
    pub sort_order: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteAlbumResponse {
    pub success: bool,
    pub removed_album_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeleteAlbumRequest {
    pub album_id: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_library() -> Result<LibraryResponse, String> {
    let base_dir = std::env::current_dir().map_err(|err| err.to_string())?;
    let album_dir =
        FileSystemService::resolve_album_directory(&base_dir).map_err(|err| err.to_string())?;
    let catalog_path = MetadataService::catalog_path(&album_dir);
    let mut catalog =
        MetadataService::load_catalog(&catalog_path).map_err(|err| err.to_string())?;

    if catalog.albums.is_empty() {
        let entries = std::fs::read_dir(&album_dir).map_err(|err| err.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|err| err.to_string())?;
            let path = entry.path();
            if !path.is_file() || path.extension().and_then(|v| v.to_str()) != Some("zip") {
                continue;
            }

            let inspection = ZipService::inspect_album(&path).map_err(|err| err.to_string())?;
            let metadata = AlbumMetadata {
                id: path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned(),
                title: path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned(),
                path: path.to_string_lossy().to_string(),
                image_count: inspection.image_count,
                cover_index: inspection.cover_index,
                imported_at: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
                    .to_string(),
                last_opened_at: None,
            };
            catalog.albums.push(metadata);
        }
    }

    let albums = catalog
        .albums
        .into_iter()
        .map(|album| AlbumSummary {
            id: album.id,
            title: album.title,
            path: album.path,
            image_count: album.image_count,
            cover_index: album.cover_index,
            imported_at: album.imported_at,
            last_opened_at: album.last_opened_at,
        })
        .collect();

    Ok(LibraryResponse {
        albums,
        sort_order: "name".to_string(),
    })
}

#[tauri::command]
fn delete_album(payload: DeleteAlbumRequest) -> Result<DeleteAlbumResponse, String> {
    let base_dir = std::env::current_dir().map_err(|err| err.to_string())?;
    let album_dir =
        FileSystemService::resolve_album_directory(&base_dir).map_err(|err| err.to_string())?;
    let catalog_path = MetadataService::catalog_path(&album_dir);
    let catalog = MetadataService::load_catalog(&catalog_path).map_err(|err| err.to_string())?;
    let album = catalog
        .albums
        .iter()
        .find(|item| item.id == payload.album_id);

    if let Some(album) = album {
        let album_path = PathBuf::from(&album.path);
        FileSystemService::delete_file(&album_path).map_err(|err| err.to_string())?;
        let _ = MetadataService::remove_album(&catalog_path, &payload.album_id)
            .map_err(|err| err.to_string())?;
        Ok(DeleteAlbumResponse {
            success: true,
            removed_album_id: Some(payload.album_id),
        })
    } else {
        Ok(DeleteAlbumResponse {
            success: false,
            removed_album_id: None,
        })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_library, delete_album])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
