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
}
