import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useLibraryStore } from "../store/libraryStore";
import AlbumCard from "./AlbumCard";
import ImageViewer from "./ImageViewer";
import type { ShortcutGesture, SortOrder } from "../../../shared/types/library";

interface LibraryViewProps {
  startupWarnings?: string[];
  rememberLastAlbum?: boolean;
}

const SUPPORTED_SHORTCUTS: Record<string, ShortcutGesture> = {
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Home: "Home",
  End: "End",
  f: "f",
  F: "f",
  Escape: "Escape",
  Delete: "Delete",
};

function isEditableTarget( target: EventTarget | null ): boolean {
  const element = target as HTMLElement | null;
  const tagName = element?.tagName?.toLowerCase();
  return Boolean(
    element?.isContentEditable
      || tagName === "input"
      || tagName === "textarea"
      || tagName === "select",
  );
}

function toShortcutGesture( event: KeyboardEvent ): ShortcutGesture | null {
  const hasOpenModifier = event.ctrlKey || event.metaKey;
  if ( hasOpenModifier && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "o" ) {
    return "Ctrl+O";
  }

  return SUPPORTED_SHORTCUTS[event.key] ?? null;
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
    zoomLevel,
    thumbnailStripPinned,
    loadLibrary,
    deleteAlbum,
    importAlbum,
    openAlbumViewer,
    goToImage,
    loadThumbnailImage,
    closeViewer,
    setSortOrder,
    setZoomLevel,
    setThumbnailStripPinned,
  } = useLibraryStore();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingImportTitle, setPendingImportTitle] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [shortcutError, setShortcutError] = useState<string | null>(null);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    if ( albums.length === 0 ) {
      setSelectedAlbumId( null );
      return;
    }

    if ( selectedAlbumId && albums.some( ( album ) => album.id === selectedAlbumId ) ) {
      return;
    }

    setSelectedAlbumId( albums[0].id );
  }, [albums, selectedAlbumId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ( isEditableTarget( event.target ) ) {
        return;
      }

      const gesture = toShortcutGesture( event );
      if ( !gesture ) {
        return;
      }

      const isFullscreenActive = Boolean( document.fullscreenElement );

      switch ( gesture ) {
        case "ArrowLeft":
          if ( viewerSession && viewerSession.current_index > 0 ) {
            event.preventDefault();
            void goToImage( viewerSession.current_index - 1 );
          }
          break;
        case "ArrowRight":
          if ( viewerSession && viewerSession.current_index < viewerSession.total_images - 1 ) {
            event.preventDefault();
            void goToImage( viewerSession.current_index + 1 );
          }
          break;
        case "Home":
          if ( viewerSession && viewerSession.total_images > 0 && viewerSession.current_index !== 0 ) {
            event.preventDefault();
            void goToImage( 0 );
          }
          break;
        case "End":
          if ( viewerSession && viewerSession.total_images > 0 && viewerSession.current_index !== viewerSession.total_images - 1 ) {
            event.preventDefault();
            void goToImage( viewerSession.total_images - 1 );
          }
          break;
        case "f":
          if ( viewerSession && !isFullscreenActive && document.documentElement.requestFullscreen ) {
            event.preventDefault();
            void document.documentElement.requestFullscreen().catch( ( error: unknown ) => {
              setShortcutError( error instanceof Error ? error.message : "Unable to enter fullscreen" );
            } );
          }
          break;
        case "Escape":
          if ( isFullscreenActive && document.exitFullscreen ) {
            event.preventDefault();
            void document.exitFullscreen().catch( ( error: unknown ) => {
              setShortcutError( error instanceof Error ? error.message : "Unable to exit fullscreen" );
            } );
          }
          break;
        case "Ctrl+O":
          event.preventDefault();
          void handleImport();
          break;
        case "Delete": {
          const targetAlbumId = selectedAlbumId ?? viewerSession?.album_id ?? null;
          if ( targetAlbumId ) {
            event.preventDefault();
            void handleDelete( targetAlbumId );
          }
          break;
        }
      }
    };

    window.addEventListener( "keydown", handleKeyDown );
    return () => window.removeEventListener( "keydown", handleKeyDown );
  }, [goToImage, selectedAlbumId, viewerSession]);

  useEffect( () => {
    if ( !shortcutError ) {
      return;
    }

    const timeout = setTimeout( () => setShortcutError( null ), 2500 );
    return () => clearTimeout( timeout );
  }, [shortcutError]);

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
      if ( viewerSession?.album_id === albumId ) {
        await closeViewer();
      }
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
    setSelectedAlbumId( albumId );
    await openAlbumViewer(albumId, rememberLastAlbum);
  };

  const handleSelectAlbum = ( albumId: string ) => {
    setSelectedAlbumId( albumId );
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
      {shortcutError && <p className="error-message">{shortcutError}</p>}
      {startupWarnings.map( ( warning ) => (
        <p key={warning} className="error-message">{warning}</p>
      ) )}

      {viewerSession && (
        <ImageViewer
          session={viewerSession}
          image={viewerImage}
          loading={viewerLoading}
          error={viewerError}
          zoomLevel={zoomLevel}
          onZoomIn={() => setZoomLevel( zoomLevel + 0.25 )}
          onZoomOut={() => setZoomLevel( zoomLevel - 0.25 )}
          onZoomReset={() => setZoomLevel( 1 )}
          onPrev={() => void handlePrevious()}
          onNext={() => void handleNext()}
          onClose={() => void closeViewer()}
          thumbnailStripPinned={thumbnailStripPinned}
          onToggleThumbnailStrip={() => setThumbnailStripPinned( !thumbnailStripPinned )}
          thumbnailCache={thumbnailCache}
          loadThumbnailImage={loadThumbnailImage}
          onSelectThumbnail={(index) => void handleThumbnailSelect(index)}
        />
      )}

      {!loading && sortedAlbums.length === 0 && <p>No albums available yet.</p>}

      <div className="album-list">
        {sortedAlbums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onDelete={handleDelete}
            onOpen={handleOpen}
            onSelect={handleSelectAlbum}
          />
        ))}
      </div>

      {pendingDeleteId && <p>Album removed from library.</p>}
      {pendingImportTitle && <p>Imported {pendingImportTitle}.</p>}
    </section>
  );
}

export default LibraryView;
