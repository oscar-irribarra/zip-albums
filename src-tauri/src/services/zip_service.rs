use std::fs::File;
use std::io;
use std::path::Path;

pub struct ZipService;

impl ZipService {
    pub fn inspect_album(path: &Path) -> io::Result<AlbumInspection> {
        let file = File::open(path)?;
        let mut archive = zip::ZipArchive::new(file)?;

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

        let inspection = ZipService::inspect_album(&archive_path).unwrap();
        assert_eq!(inspection.image_count, 1);
        assert_eq!(inspection.cover_index, 0);
        assert_eq!(inspection.image_names, vec!["cover.png".to_string()]);
    }
}
