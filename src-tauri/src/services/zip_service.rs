use std::fs::File;
use std::io::{self, Read};
use std::path::Path;

use base64::Engine;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ZipInspectionError {
    Corrupted,
    Empty,
    NoSupportedImages,
    Io,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ZipImageLoadError {
    IndexOutOfRange,
    Corrupted,
    UnsupportedImage,
    Io,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LoadedImage {
    pub image_source: String,
    pub mime_type: String,
}

pub struct ZipService;

impl ZipService {
    fn supported_image_mime(name: &str) -> Option<&'static str> {
        let lowered = name.to_lowercase();
        if lowered.ends_with(".png") {
            Some("image/png")
        } else if lowered.ends_with(".jpg") || lowered.ends_with(".jpeg") {
            Some("image/jpeg")
        } else if lowered.ends_with(".webp") {
            Some("image/webp")
        } else {
            None
        }
    }

    pub fn inspect_album(path: &Path) -> io::Result<AlbumInspection> {
        match Self::inspect_album_checked(path) {
            Ok(inspection) => Ok(inspection),
            Err(ZipInspectionError::Corrupted) => Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "ZIP archive is corrupted",
            )),
            Err(ZipInspectionError::Empty) => Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "ZIP archive is empty",
            )),
            Err(ZipInspectionError::NoSupportedImages) => Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "ZIP archive has no supported images",
            )),
            Err(ZipInspectionError::Io) => Err(io::Error::new(
                io::ErrorKind::Other,
                "Unable to inspect ZIP archive",
            )),
        }
    }

    pub fn inspect_album_checked(path: &Path) -> Result<AlbumInspection, ZipInspectionError> {
        let file = File::open(path).map_err(|_| ZipInspectionError::Io)?;
        let mut archive = zip::ZipArchive::new(file).map_err(|_| ZipInspectionError::Corrupted)?;

        if archive.len() == 0 {
            return Err(ZipInspectionError::Empty);
        }

        let image_entries: Vec<_> = (0..archive.len())
            .filter_map(|index| {
                let entry = archive.by_index(index).ok()?;
                let name = entry.name().to_string();
                if Self::supported_image_mime(&name).is_some() {
                    Some(name.to_lowercase())
                } else {
                    None
                }
            })
            .collect();

        if image_entries.is_empty() {
            return Err(ZipInspectionError::NoSupportedImages);
        }

        let mut image_entries = image_entries;
        image_entries.sort_unstable();

        let image_count = image_entries.len();
        let cover_index = if image_count > 0 { 0 } else { 0 };

        Ok(AlbumInspection {
            image_count,
            cover_index,
            image_names: image_entries,
        })
    }

    pub fn load_image_by_index(
        path: &Path,
        image_index: usize,
    ) -> Result<LoadedImage, ZipImageLoadError> {
        let file = File::open(path).map_err(|_| ZipImageLoadError::Io)?;
        let mut archive = zip::ZipArchive::new(file).map_err(|_| ZipImageLoadError::Corrupted)?;

        let mut supported_entries: Vec<(usize, String, String)> = Vec::new();
        for index in 0..archive.len() {
            let entry = archive
                .by_index(index)
                .map_err(|_| ZipImageLoadError::Corrupted)?;
            let name = entry.name().to_string();
            if let Some(mime) = Self::supported_image_mime(&name) {
                supported_entries.push((index, name, mime.to_string()));
            }
        }

        if supported_entries.is_empty() {
            return Err(ZipImageLoadError::UnsupportedImage);
        }

        supported_entries.sort_unstable_by(|a, b| a.1.to_lowercase().cmp(&b.1.to_lowercase()));

        if image_index >= supported_entries.len() {
            return Err(ZipImageLoadError::IndexOutOfRange);
        }

        let (entry_index, _entry_name, mime_type) = &supported_entries[image_index];
        let mut entry = archive
            .by_index(*entry_index)
            .map_err(|_| ZipImageLoadError::Corrupted)?;

        let mut bytes = Vec::new();
        entry
            .read_to_end(&mut bytes)
            .map_err(|_| ZipImageLoadError::Io)?;

        let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);
        Ok(LoadedImage {
            image_source: format!("data:{};base64,{}", mime_type, encoded),
            mime_type: mime_type.clone(),
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AlbumInspection {
    pub image_count: usize,
    pub cover_index: usize,
    pub image_names: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn inspects_album_archive_without_extracting_contents() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-zip-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = std::fs::create_dir_all(&temp_dir);
        let archive_path = temp_dir.join("album.zip");
        let file = File::create(&archive_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = zip::write::FileOptions::default();
        zip.start_file("cover.png", options).unwrap();
        zip.write_all(b"png-data").unwrap();
        zip.start_file("notes.txt", options).unwrap();
        zip.write_all(b"text").unwrap();
        zip.finish().unwrap();

        let inspection = ZipService::inspect_album_checked(&archive_path).unwrap();
        assert_eq!(inspection.image_count, 1);
        assert_eq!(inspection.cover_index, 0);
        assert_eq!(inspection.image_names, vec!["cover.png".to_string()]);
    }

    #[test]
    fn returns_no_supported_images_for_text_only_archive() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-zip-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = std::fs::create_dir_all(&temp_dir);
        let archive_path = temp_dir.join("text-only.zip");
        let file = File::create(&archive_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = zip::write::FileOptions::default();
        zip.start_file("readme.txt", options).unwrap();
        zip.write_all(b"text").unwrap();
        zip.finish().unwrap();

        let inspection = ZipService::inspect_album_checked(&archive_path);
        assert_eq!(inspection, Err(ZipInspectionError::NoSupportedImages));
    }

    #[test]
    fn returns_empty_for_empty_archive() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-zip-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = std::fs::create_dir_all(&temp_dir);
        let archive_path = temp_dir.join("empty.zip");
        let file = File::create(&archive_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        zip.finish().unwrap();

        let inspection = ZipService::inspect_album_checked(&archive_path);
        assert_eq!(inspection, Err(ZipInspectionError::Empty));
    }

    #[test]
    fn returns_corrupted_for_invalid_archive_data() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-zip-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = std::fs::create_dir_all(&temp_dir);
        let archive_path = temp_dir.join("corrupted.zip");
        std::fs::write(&archive_path, b"not-a-zip").unwrap();

        let inspection = ZipService::inspect_album_checked(&archive_path);
        assert_eq!(inspection, Err(ZipInspectionError::Corrupted));
    }

    #[test]
    fn loads_single_image_by_index() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-zip-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = std::fs::create_dir_all(&temp_dir);
        let archive_path = temp_dir.join("viewer.zip");
        let file = File::create(&archive_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = zip::write::FileOptions::default();
        zip.start_file("first.png", options).unwrap();
        zip.write_all(b"first-image").unwrap();
        zip.start_file("second.jpg", options).unwrap();
        zip.write_all(b"second-image").unwrap();
        zip.finish().unwrap();

        let loaded = ZipService::load_image_by_index(&archive_path, 1).unwrap();
        assert_eq!(loaded.mime_type, "image/jpeg");
        assert!(loaded.image_source.starts_with("data:image/jpeg;base64,"));
    }

    #[test]
    fn returns_out_of_range_for_invalid_image_index() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-zip-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = std::fs::create_dir_all(&temp_dir);
        let archive_path = temp_dir.join("viewer-range.zip");
        let file = File::create(&archive_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = zip::write::FileOptions::default();
        zip.start_file("first.png", options).unwrap();
        zip.write_all(b"first-image").unwrap();
        zip.finish().unwrap();

        let loaded = ZipService::load_image_by_index(&archive_path, 4);
        assert_eq!(loaded, Err(ZipImageLoadError::IndexOutOfRange));
    }

    #[test]
    fn load_image_by_index_zero_returns_alphabetically_first_file() {
        let temp_dir = std::env::temp_dir().join(format!(
            "library-sort-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = std::fs::create_dir_all(&temp_dir);
        let archive_path = temp_dir.join("sorted.zip");

        // Write entries in reverse order: 02, 01, 00
        let file = File::create(&archive_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = zip::write::FileOptions::default();
        zip.start_file("02.jpg", options).unwrap();
        zip.write_all(b"second-image").unwrap();
        zip.start_file("01.jpg", options).unwrap();
        zip.write_all(b"middle-image").unwrap();
        zip.start_file("00.jpg", options).unwrap();
        zip.write_all(b"first-image").unwrap();
        zip.finish().unwrap();

        let loaded = ZipService::load_image_by_index(&archive_path, 0).unwrap();
        let base64_part = loaded.image_source.split(',').nth(1).unwrap_or("");
        use base64::Engine;
        let decoded = base64::engine::general_purpose::STANDARD
            .decode(base64_part)
            .unwrap();
        assert_eq!(
            decoded, b"first-image",
            "Index 0 must return the alphabetically-first file (00.jpg)"
        );
    }
}
