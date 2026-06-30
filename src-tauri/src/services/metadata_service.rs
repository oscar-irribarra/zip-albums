use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AlbumMetadata {
    pub id: String,
    pub title: String,
    pub path: String,
    pub image_count: usize,
    pub cover_index: usize,
    pub imported_at: String,
    pub last_opened_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AlbumCatalog {
    pub version: u32,
    pub albums: Vec<AlbumMetadata>,
}

impl Default for AlbumCatalog {
    fn default() -> Self {
        Self {
            version: 1,
            albums: Vec::new(),
        }
    }
}

pub struct MetadataService;

impl MetadataService {
    pub fn catalog_path(base_dir: &Path) -> PathBuf {
        base_dir.join("albums_catalog.json")
    }

    pub fn load_catalog(path: &Path) -> std::io::Result<AlbumCatalog> {
        if !path.exists() {
            return Ok(AlbumCatalog::default());
        }

        let contents = fs::read_to_string(path)?;
        let catalog: AlbumCatalog = serde_json::from_str(&contents).unwrap_or_default();
        Ok(catalog)
    }

    pub fn save_catalog(path: &Path, catalog: &AlbumCatalog) -> std::io::Result<()> {
        let contents = serde_json::to_string_pretty(catalog).unwrap_or_default();
        fs::write(path, contents)
    }

    pub fn remove_album(path: &Path, album_id: &str) -> std::io::Result<AlbumCatalog> {
        let mut catalog = Self::load_catalog(path)?;
        catalog.albums.retain(|album| album.id != album_id);
        Self::save_catalog(path, &catalog)?;
        Ok(catalog)
    }

    pub fn has_album_with_path(catalog: &AlbumCatalog, candidate_path: &str) -> bool {
        catalog
            .albums
            .iter()
            .any(|album| album.path == candidate_path)
    }

    pub fn add_album(path: &Path, album: AlbumMetadata) -> std::io::Result<AlbumCatalog> {
        let mut catalog = Self::load_catalog(path)?;
        catalog.albums.push(album);
        Self::save_catalog(path, &catalog)?;
        Ok(catalog)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn loads_empty_catalog_when_missing() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-metadata-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = fs::remove_dir_all(&temp_dir);
        let path = temp_dir.join("albums_catalog.json");

        let catalog = MetadataService::load_catalog(&path).unwrap();
        assert!(catalog.albums.is_empty());
    }

    #[test]
    fn removes_album_from_catalog() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-metadata-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = fs::create_dir_all(&temp_dir);
        let path = temp_dir.join("albums_catalog.json");

        let mut catalog = AlbumCatalog::default();
        catalog.albums.push(AlbumMetadata {
            id: "album-1".to_string(),
            title: "Test".to_string(),
            path: "/tmp/test.zip".to_string(),
            image_count: 2,
            cover_index: 0,
            imported_at: "2026-06-30T00:00:00Z".to_string(),
            last_opened_at: None,
        });
        MetadataService::save_catalog(&path, &catalog).unwrap();

        let updated = MetadataService::remove_album(&path, "album-1").unwrap();
        assert!(updated.albums.is_empty());
    }

    #[test]
    fn appends_album_to_catalog() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-metadata-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = fs::create_dir_all(&temp_dir);
        let path = temp_dir.join("albums_catalog.json");

        let album = AlbumMetadata {
            id: "album-2".to_string(),
            title: "Import Test".to_string(),
            path: "/tmp/import.zip".to_string(),
            image_count: 3,
            cover_index: 0,
            imported_at: "2026-06-30T00:00:00Z".to_string(),
            last_opened_at: None,
        };

        let updated = MetadataService::add_album(&path, album).unwrap();
        assert_eq!(updated.albums.len(), 1);
        assert_eq!(updated.albums[0].id, "album-2");
    }
}
