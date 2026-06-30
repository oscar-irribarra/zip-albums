import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useLibraryStore } from "../store/libraryStore";
import AlbumCard from "./AlbumCard";
import ThumbnailStrip from "./ThumbnailStrip";
import type { SortOrder } from "../../../shared/types/library";

interface LibraryViewProps {
  startupWarnings?: string[];
  rememberLastAlbum?: boolean;
}

function LibraryView( { startupWarnings = [], rememberLastAlbum = false }: LibraryViewProps ) {
  const {
    albums,
    sortOrder,
    loading,
    importing,
    error,
    viewerSession,
    viewerImage,
    viewerLoading,
    viewerError,
    thumbnailCache,
    loadLibrary,
    deleteAlbum,
    importAlbum,
    openAlbumViewer,
    goToImage,
    loadThumbnailImage,
    closeViewer,
    setSortOrder,
  } = useLibraryStore();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingImportTitle, setPendingImportTitle] = useState<string | null>(null);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    if (!viewerSession) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();

      if (target?.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select") {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        void goToImage(viewerSession.current_index - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        void goToImage(viewerSession.current_index + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToImage, viewerSession]);

  const sortedAlbums = useMemo(() => {
    const items = [...albums];
    return items.sort((left, right) => {
      if (sortOrder === "date") {
        return new Date(right.imported_at).getTime() - new Date(left.imported_at).getTime();
      }

      return left.title.localeCompare(right.title);
    });
  }, [albums, sortOrder]);

  const handleDelete = async (albumId: string) => {
    const confirmed = window.confirm("Delete this album and its ZIP file?");
    if (!confirmed) {
      return;
    }

    const deleted = await deleteAlbum(albumId);
    if (deleted) {
      setPendingDeleteId(albumId);
      setTimeout(() => setPendingDeleteId(null), 1500);
    }
  };

  const handleImport = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "ZIP archive", extensions: ["zip"] }],
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    const imported = await importAlbum(selected);
    if (imported) {
      const title = selected.split(/[\\/]/).pop() ?? "album";
      setPendingImportTitle(title);
      setTimeout(() => setPendingImportTitle(null), 2000);
    }
  };

  const handleOpen = async (albumId: string) => {
    await openAlbumViewer(albumId, rememberLastAlbum);
  };

  const handlePrevious = async () => {
    if (!viewerSession || viewerSession.current_index <= 0) {
      return;
    }

    await goToImage(viewerSession.current_index - 1);
  };

  const handleNext = async () => {
    if (!viewerSession || viewerSession.current_index >= viewerSession.total_images - 1) {
      return;
    }

    await goToImage(viewerSession.current_index + 1);
  };

  const counter = viewerSession
    ? `${viewerSession.current_index + 1} / ${viewerSession.total_images}`
    : null;

  const handleThumbnailSelect = async ( index: number ) => {
    await goToImage( index );
  };

  return (
    <section className="library-view">
      <header className="library-toolbar">
        <h2>Library</h2>
        <div className="library-toolbar-actions">
          <button type="button" onClick={() => void handleImport()} disabled={importing}>
            {importing ? "Importing..." : "Import ZIP"}
          </button>
          <label>
            Sort by
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
              <option value="name">Name</option>
              <option value="date">Date</option>
            </select>
          </label>
        </div>
      </header>

      {loading && <p>Loading albums...</p>}
      {error && <p className="error-message">{error}</p>}
      {viewerError && <p className="error-message">{viewerError}</p>}
      {startupWarnings.map( ( warning ) => (
        <p key={warning} className="error-message">{warning}</p>
      ) )}

      {viewerSession && (
        <section className="album-viewer" aria-label="Album viewer">
          <header className="album-viewer-header">
            <h3>{viewerSession.album_name}</h3>
            <p className="album-viewer-counter">{counter}</p>
          </header>
          <div className="album-viewer-image-frame">
            {viewerLoading && <p>Loading image...</p>}
            {!viewerLoading && viewerImage && (
              <img src={viewerImage.image_source} alt={`${viewerSession.album_name} page ${viewerSession.current_index + 1}`} />
            )}
          </div>
          <ThumbnailStrip
            albumId={viewerSession.album_id}
            totalImages={viewerSession.total_images}
            selectedIndex={viewerSession.current_index}
            thumbnailCache={thumbnailCache}
            onSelect={(index) => void handleThumbnailSelect(index)}
            loadThumbnailImage={loadThumbnailImage}
          />
          <div className="album-viewer-actions">
            <button type="button" onClick={() => void handlePrevious()} disabled={viewerLoading || viewerSession.current_index <= 0}>
              Previous
            </button>
            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={viewerLoading || viewerSession.current_index >= viewerSession.total_images - 1}
            >
              Next
            </button>
            <button type="button" onClick={() => void closeViewer()}>
              Close Viewer
            </button>
          </div>
        </section>
      )}

      {!loading && sortedAlbums.length === 0 && <p>No albums available yet.</p>}

      <div className="album-list">
        {sortedAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} onDelete={handleDelete} onOpen={handleOpen} />
        ))}
      </div>

      {pendingDeleteId && <p>Album removed from library.</p>}
      {pendingImportTitle && <p>Imported {pendingImportTitle}.</p>}
    </section>
  );
}

export default LibraryView;
