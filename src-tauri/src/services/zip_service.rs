use std::fs::File;
use std::io;
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ZipInspectionError {
    Corrupted,
    Empty,
    NoSupportedImages,
    Io,
}

pub struct ZipService;

impl ZipService {
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
                let name = entry.name().to_lowercase();
                if name.ends_with(".png")
                    || name.ends_with(".jpg")
                    || name.ends_with(".jpeg")
                    || name.ends_with(".webp")
                {
                    Some(name)
                } else {
                    None
                }
            })
            .collect();

        if image_entries.is_empty() {
            return Err(ZipInspectionError::NoSupportedImages);
        }

        let image_count = image_entries.len();
        let cover_index = if image_count > 0 { 0 } else { 0 };

        Ok(AlbumInspection {
            image_count,
            cover_index,
            image_names: image_entries,
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
}
