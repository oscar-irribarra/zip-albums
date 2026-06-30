use std::fs;
use std::path::{Path, PathBuf};

pub struct FileSystemService;

impl FileSystemService {
    pub fn resolve_album_directory(base_dir: &Path) -> std::io::Result<PathBuf> {
        if !base_dir.exists() {
            fs::create_dir_all(base_dir)?;
        }

        Ok(base_dir.to_path_buf())
    }

    pub fn delete_file(path: &Path) -> std::io::Result<()> {
        if path.exists() {
            fs::remove_file(path)?;
        }

        Ok(())
    }

    pub fn ensure_zip_file(path: &Path) -> std::io::Result<()> {
        let metadata = fs::metadata(path)?;
        if !metadata.is_file() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Path is not a file",
            ));
        }

        let is_zip = path
            .extension()
            .and_then(|value| value.to_str())
            .map(|ext| ext.eq_ignore_ascii_case("zip"))
            .unwrap_or(false);

        if !is_zip {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Only ZIP files are supported",
            ));
        }

        Ok(())
    }

    pub fn canonicalize_path(path: &Path) -> std::io::Result<PathBuf> {
        fs::canonicalize(path)
    }
}

#[cfg(test)]
mod tests {
    use super::FileSystemService;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_dir() -> std::path::PathBuf {
        std::env::temp_dir().join(format!(
            "library-fs-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ))
    }

    #[test]
    fn rejects_non_zip_files() {
        let dir = unique_temp_dir();
        fs::create_dir_all(&dir).unwrap();
        let file_path = dir.join("notes.txt");
        fs::write(&file_path, b"text").unwrap();

        let result = FileSystemService::ensure_zip_file(&file_path);
        assert!(result.is_err());
    }

    #[test]
    fn accepts_zip_files_case_insensitive() {
        let dir = unique_temp_dir();
        fs::create_dir_all(&dir).unwrap();
        let file_path = dir.join("album.ZIP");
        fs::write(&file_path, b"zip").unwrap();

        let result = FileSystemService::ensure_zip_file(&file_path);
        assert!(result.is_ok());
    }
}
