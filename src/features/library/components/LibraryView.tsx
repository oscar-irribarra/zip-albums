import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useLibraryStore } from "../store/libraryStore";
import AlbumCard from "./AlbumCard";
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
    loadLibrary,
    deleteAlbum,
    importAlbum,
    openAlbumViewer,
    setSortOrder,
  } = useLibraryStore();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>( null );
  const [pendingImportTitle, setPendingImportTitle] = useState<string | null>( null );
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>( null );

  useEffect( () => {
    void loadLibrary();
  }, [loadLibrary] );

  useEffect( () => {
    if ( albums.length === 0 ) {
      setSelectedAlbumId( null );
      return;
    }
    if ( selectedAlbumId && albums.some( ( album ) => album.id === selectedAlbumId ) ) {
      return;
    }
    setSelectedAlbumId( albums[0].id );
  }, [albums, selectedAlbumId] );

  const sortedAlbums = useMemo( () => {
    const items = [...albums];
    return items.sort( ( left, right ) => {
      if ( sortOrder === "date" ) {
        return new Date( right.imported_at ).getTime() - new Date( left.imported_at ).getTime();
      }
      return left.title.localeCompare( right.title );
    } );
  }, [albums, sortOrder] );

  const handleDelete = async ( albumId: string ) => {
    const confirmed = window.confirm( "Remove this album from the library?" );
    if ( !confirmed ) {
      return;
    }
    const deleted = await deleteAlbum( albumId );
    if ( deleted ) {
      setPendingDeleteId( albumId );
      setTimeout( () => setPendingDeleteId( null ), 1500 );
    }
  };

  const handleImport = async () => {
    const selected = await open( {
      multiple: false,
      filters: [{ name: "ZIP archive", extensions: ["zip"] }],
    } );
    if ( !selected || Array.isArray( selected ) ) {
      return;
    }
    const imported = await importAlbum( selected );
    if ( imported ) {
      const title = selected.split( /[\\/]/ ).pop() ?? "album";
      setPendingImportTitle( title );
      setTimeout( () => setPendingImportTitle( null ), 2000 );
    }
  };

  const handleOpen = async ( albumId: string ) => {
    setSelectedAlbumId( albumId );
    await openAlbumViewer( albumId, rememberLastAlbum );
  };

  const handleSelectAlbum = ( albumId: string ) => {
    setSelectedAlbumId( albumId );
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
            <select value={sortOrder} onChange={( event ) => setSortOrder( event.target.value as SortOrder )}>
              <option value="name">Name</option>
              <option value="date">Date</option>
            </select>
          </label>
        </div>
      </header>

      {loading && <p>Loading albums...</p>}
      {error && <p className="error-message">{error}</p>}
      {startupWarnings.map( ( warning ) => (
        <p key={warning} className="error-message">{warning}</p>
      ) )}

      {!loading && sortedAlbums.length === 0 && <p>No albums available yet.</p>}

      <div className="album-list">
        {sortedAlbums.map( ( album ) => (
          <AlbumCard
            key={album.id}
            album={album}
            onDelete={handleDelete}
            onOpen={handleOpen}
            onSelect={handleSelectAlbum}
          />
        ) )}
      </div>

      {pendingDeleteId && <p>Album removed from library.</p>}
      {pendingImportTitle && <p>Imported {pendingImportTitle}.</p>}
    </section>
  );
}

export default LibraryView;
