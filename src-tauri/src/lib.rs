mod services;

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use services::{
    file_system_service::FileSystemService,
    metadata_service::{AlbumMetadata, MetadataService},
    zip_service::{ZipImageLoadError, ZipInspectionError, ZipService},
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

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportAlbumRequest {
    pub zip_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportAlbumResponse {
    pub album: AlbumSummary,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportAlbumError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct OpenAlbumViewerRequest {
    pub album_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenAlbumViewerResponse {
    pub album_id: String,
    pub album_name: String,
    pub total_images: usize,
    pub start_index: usize,
}

#[derive(Debug, Deserialize)]
pub struct LoadAlbumImageRequest {
    pub album_id: String,
    pub image_index: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoadAlbumImageResponse {
    pub album_id: String,
    pub image_index: usize,
    pub image_source: String,
    pub mime_type: String,
}

#[derive(Debug, Deserialize)]
pub struct SaveReadingProgressRequest {
    pub album_id: String,
    pub last_image_index: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveReadingProgressResponse {
    pub saved: bool,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ViewerCommandError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl ViewerCommandError {
    fn album_not_found() -> Self {
        Self {
            code: "ALBUM_NOT_FOUND".to_string(),
            message: "The requested album could not be found.".to_string(),
            details: None,
        }
    }

    fn image_index_out_of_range() -> Self {
        Self {
            code: "IMAGE_INDEX_OUT_OF_RANGE".to_string(),
            message: "The requested image index is out of range.".to_string(),
            details: None,
        }
    }

    fn zip_read_failure(details: &str) -> Self {
        Self {
            code: "ZIP_READ_FAILURE".to_string(),
            message: "Unable to read image data from the ZIP archive.".to_string(),
            details: Some(details.to_string()),
        }
    }

    fn unsupported_image() -> Self {
        Self {
            code: "UNSUPPORTED_IMAGE".to_string(),
            message: "No supported image content was available.".to_string(),
            details: None,
        }
    }

    fn progress_read_failure(details: &str) -> Self {
        Self {
            code: "PROGRESS_READ_FAILURE".to_string(),
            message: "Unable to restore reading progress.".to_string(),
            details: Some(details.to_string()),
        }
    }

    fn progress_write_failure(details: &str) -> Self {
        Self {
            code: "PROGRESS_WRITE_FAILURE".to_string(),
            message: "Unable to save reading progress.".to_string(),
            details: Some(details.to_string()),
        }
    }

    fn io_failure(details: &str) -> Self {
        Self {
            code: "IO_FAILURE".to_string(),
            message: "A local file operation failed.".to_string(),
            details: Some(details.to_string()),
        }
    }
}

impl ImportAlbumError {
    fn unsupported_format(details: &str) -> Self {
        Self {
            code: "UNSUPPORTED_FORMAT".to_string(),
            message: "Only ZIP files can be imported.".to_string(),
            details: Some(details.to_string()),
        }
    }

    fn zip_corrupted(details: &str) -> Self {
        Self {
            code: "ZIP_CORRUPTED".to_string(),
            message: "The selected ZIP is invalid or corrupted.".to_string(),
            details: Some(details.to_string()),
        }
    }

    fn zip_empty() -> Self {
        Self {
            code: "ZIP_EMPTY".to_string(),
            message: "The selected ZIP is empty.".to_string(),
            details: None,
        }
    }

    fn no_supported_images() -> Self {
        Self {
            code: "NO_SUPPORTED_IMAGES".to_string(),
            message: "The ZIP does not contain supported images.".to_string(),
            details: Some("Supported formats: png, jpg, jpeg, webp".to_string()),
        }
    }

    fn duplicate_album() -> Self {
        Self {
            code: "DUPLICATE_ALBUM".to_string(),
            message: "This ZIP has already been imported.".to_string(),
            details: None,
        }
    }

    fn io_failure(details: &str) -> Self {
        Self {
            code: "IO_FAILURE".to_string(),
            message: "An unexpected local file error occurred during import.".to_string(),
            details: Some(details.to_string()),
        }
    }
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

#[tauri::command]
fn import_album(payload: ImportAlbumRequest) -> Result<ImportAlbumResponse, ImportAlbumError> {
    let candidate = PathBuf::from(&payload.zip_path);
    FileSystemService::ensure_zip_file(&candidate)
        .map_err(|err| ImportAlbumError::unsupported_format(&err.to_string()))?;

    let canonical_path = FileSystemService::canonicalize_path(&candidate)
        .map_err(|err| ImportAlbumError::io_failure(&err.to_string()))?;

    let inspection =
        ZipService::inspect_album_checked(&canonical_path).map_err(|err| match err {
            ZipInspectionError::Corrupted => ImportAlbumError::zip_corrupted("Archive read failed"),
            ZipInspectionError::Empty => ImportAlbumError::zip_empty(),
            ZipInspectionError::NoSupportedImages => ImportAlbumError::no_supported_images(),
            ZipInspectionError::Io => ImportAlbumError::io_failure("Unable to inspect ZIP archive"),
        })?;

    let base_dir =
        std::env::current_dir().map_err(|err| ImportAlbumError::io_failure(&err.to_string()))?;
    let album_dir = FileSystemService::resolve_album_directory(&base_dir)
        .map_err(|err| ImportAlbumError::io_failure(&err.to_string()))?;
    let catalog_path = MetadataService::catalog_path(&album_dir);

    let catalog = MetadataService::load_catalog(&catalog_path)
        .map_err(|err| ImportAlbumError::io_failure(&err.to_string()))?;
    let canonical_text = canonical_path.to_string_lossy().to_string();
    if MetadataService::has_album_with_path(&catalog, &canonical_text) {
        return Err(ImportAlbumError::duplicate_album());
    }

    let title = canonical_path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("Imported Album")
        .to_string();
    let imported_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string();

    let metadata = AlbumMetadata {
        id: title.clone(),
        title: title.clone(),
        path: canonical_text,
        image_count: inspection.image_count,
        cover_index: 0,
        imported_at: imported_at.clone(),
        last_opened_at: None,
    };

    MetadataService::add_album(&catalog_path, metadata.clone())
        .map_err(|err| ImportAlbumError::io_failure(&err.to_string()))?;

    Ok(ImportAlbumResponse {
        album: AlbumSummary {
            id: metadata.id,
            title: metadata.title,
            path: metadata.path,
            image_count: metadata.image_count,
            cover_index: metadata.cover_index,
            imported_at: metadata.imported_at,
            last_opened_at: metadata.last_opened_at,
        },
    })
}

#[tauri::command]
fn open_album_viewer(
    payload: OpenAlbumViewerRequest,
) -> Result<OpenAlbumViewerResponse, ViewerCommandError> {
    let base_dir = std::env::current_dir().map_err(|err| ViewerCommandError::io_failure(&err.to_string()))?;
    let album_dir = FileSystemService::resolve_album_directory(&base_dir)
        .map_err(|err| ViewerCommandError::io_failure(&err.to_string()))?;
    let catalog_path = MetadataService::catalog_path(&album_dir);
    let catalog = MetadataService::load_catalog(&catalog_path)
        .map_err(|err| ViewerCommandError::io_failure(&err.to_string()))?;

    let album = catalog
        .albums
        .iter()
        .find(|entry| entry.id == payload.album_id)
        .ok_or_else(ViewerCommandError::album_not_found)?;

    let progress = MetadataService::get_reading_progress(&catalog, &payload.album_id);
    let start_index = match progress {
        Some(saved) if saved.last_image_index < album.image_count => saved.last_image_index,
        Some(_) => 0,
        None => 0,
    };

    Ok(OpenAlbumViewerResponse {
        album_id: album.id.clone(),
        album_name: album.title.clone(),
        total_images: album.image_count,
        start_index,
    })
}

#[tauri::command]
fn load_album_image(
    payload: LoadAlbumImageRequest,
) -> Result<LoadAlbumImageResponse, ViewerCommandError> {
    let base_dir = std::env::current_dir().map_err(|err| ViewerCommandError::io_failure(&err.to_string()))?;
    let album_dir = FileSystemService::resolve_album_directory(&base_dir)
        .map_err(|err| ViewerCommandError::io_failure(&err.to_string()))?;
    let catalog_path = MetadataService::catalog_path(&album_dir);
    let catalog = MetadataService::load_catalog(&catalog_path)
        .map_err(|err| ViewerCommandError::io_failure(&err.to_string()))?;

    let album = catalog
        .albums
        .iter()
        .find(|entry| entry.id == payload.album_id)
        .ok_or_else(ViewerCommandError::album_not_found)?;

    let album_path = FileSystemService::resolve_album_zip_path(&album.path)
        .map_err(|err| ViewerCommandError::io_failure(&err.to_string()))?;

    let image = ZipService::load_image_by_index(&album_path, payload.image_index).map_err(|err| {
        match err {
            ZipImageLoadError::IndexOutOfRange => ViewerCommandError::image_index_out_of_range(),
            ZipImageLoadError::Corrupted => ViewerCommandError::zip_read_failure("Archive read failure"),
            ZipImageLoadError::UnsupportedImage => ViewerCommandError::unsupported_image(),
            ZipImageLoadError::Io => ViewerCommandError::zip_read_failure("Unable to load requested image"),
        }
    })?;

    Ok(LoadAlbumImageResponse {
        album_id: payload.album_id,
        image_index: payload.image_index,
        image_source: image.image_source,
        mime_type: image.mime_type,
    })
}

#[tauri::command]
fn save_reading_progress(
    payload: SaveReadingProgressRequest,
) -> Result<SaveReadingProgressResponse, ViewerCommandError> {
    let base_dir = std::env::current_dir().map_err(|err| ViewerCommandError::io_failure(&err.to_string()))?;
    let album_dir = FileSystemService::resolve_album_directory(&base_dir)
        .map_err(|err| ViewerCommandError::io_failure(&err.to_string()))?;
    let catalog_path = MetadataService::catalog_path(&album_dir);
    let catalog = MetadataService::load_catalog(&catalog_path)
        .map_err(|err| ViewerCommandError::progress_read_failure(&err.to_string()))?;

    if !catalog.albums.iter().any(|entry| entry.id == payload.album_id) {
        return Err(ViewerCommandError::album_not_found());
    }

    let progress = MetadataService::save_reading_progress(
        &catalog_path,
        &payload.album_id,
        payload.last_image_index,
    )
    .map_err(|err| ViewerCommandError::progress_write_failure(&err.to_string()))?;

    Ok(SaveReadingProgressResponse {
        saved: true,
        updated_at: progress.updated_at,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_library,
            delete_album,
            import_album,
            open_album_viewer,
            load_album_image,
            save_reading_progress
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::io::Write;
    use std::sync::{Mutex, OnceLock};

    fn cwd_test_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    fn create_zip(path: &std::path::Path, entries: &[(&str, &[u8])]) {
        let file = fs::File::create(path).unwrap();
        let mut writer = zip::ZipWriter::new(file);
        let options = zip::write::FileOptions::default();
        for (name, content) in entries {
            writer.start_file(*name, options).unwrap();
            writer.write_all(content).unwrap();
        }
        writer.finish().unwrap();
    }

    #[test]
    fn import_album_returns_duplicate_error_for_same_file() {
        let _lock = cwd_test_lock().lock().unwrap();
        let temp_dir = std::env::temp_dir().join(format!(
            "library-import-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let old_cwd = std::env::current_dir().unwrap();
        std::env::set_current_dir(&temp_dir).unwrap();

        let zip_path = temp_dir.join("album.zip");
        create_zip(&zip_path, &[("cover.png", b"png")]);

        let payload = ImportAlbumRequest {
            zip_path: zip_path.to_string_lossy().to_string(),
        };

        let first = import_album(ImportAlbumRequest {
            zip_path: payload.zip_path.clone(),
        });
        assert!(first.is_ok());

        let second = import_album(payload).unwrap_err();
        assert_eq!(second.code, "DUPLICATE_ALBUM");

        std::env::set_current_dir(old_cwd).unwrap();
    }

    #[test]
    fn import_album_returns_io_failure_for_missing_file() {
        let result = import_album(ImportAlbumRequest {
            zip_path: "Z:/missing/album.zip".to_string(),
        })
        .unwrap_err();

        assert!(result.code == "UNSUPPORTED_FORMAT" || result.code == "IO_FAILURE");
    }

    #[test]
    fn open_album_viewer_restores_saved_progress() {
        let _lock = cwd_test_lock().lock().unwrap();
        let temp_dir = std::env::temp_dir().join(format!(
            "library-viewer-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let old_cwd = std::env::current_dir().unwrap();
        std::env::set_current_dir(&temp_dir).unwrap();

        let zip_path = temp_dir.join("viewer.zip");
        create_zip(&zip_path, &[("cover.png", b"png"), ("page2.png", b"png2")]);

        let catalog_path = MetadataService::catalog_path(&temp_dir);
        let _ = MetadataService::add_album(
            &catalog_path,
            AlbumMetadata {
                id: "viewer".to_string(),
                title: "Viewer".to_string(),
                path: zip_path.to_string_lossy().to_string(),
                image_count: 2,
                cover_index: 0,
                imported_at: "0".to_string(),
                last_opened_at: None,
            },
        )
        .unwrap();
        let _ = MetadataService::save_reading_progress(&catalog_path, "viewer", 1).unwrap();

        let response = open_album_viewer(OpenAlbumViewerRequest {
            album_id: "viewer".to_string(),
        })
        .unwrap();

        assert_eq!(response.start_index, 1);
        std::env::set_current_dir(old_cwd).unwrap();
    }

    #[test]
    fn open_album_viewer_falls_back_to_cover_for_invalid_progress() {
        let _lock = cwd_test_lock().lock().unwrap();
        let temp_dir = std::env::temp_dir().join(format!(
            "library-viewer-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let old_cwd = std::env::current_dir().unwrap();
        std::env::set_current_dir(&temp_dir).unwrap();

        let zip_path = temp_dir.join("viewer2.zip");
        create_zip(&zip_path, &[("cover.png", b"png")]);

        let catalog_path = MetadataService::catalog_path(&temp_dir);
        let _ = MetadataService::add_album(
            &catalog_path,
            AlbumMetadata {
                id: "viewer2".to_string(),
                title: "Viewer 2".to_string(),
                path: zip_path.to_string_lossy().to_string(),
                image_count: 1,
                cover_index: 0,
                imported_at: "0".to_string(),
                last_opened_at: None,
            },
        )
        .unwrap();
        let _ = MetadataService::save_reading_progress(&catalog_path, "viewer2", 5).unwrap();

        let response = open_album_viewer(OpenAlbumViewerRequest {
            album_id: "viewer2".to_string(),
        })
        .unwrap();

        assert_eq!(response.start_index, 0);
        std::env::set_current_dir(old_cwd).unwrap();
    }
}
