import { useEffect, useMemo, useState } from "react";
import { useLibraryStore } from "../store/libraryStore";
import AlbumCard from "./AlbumCard";
import type { SortOrder } from "../../../shared/types/library";

function LibraryView() {
  const { albums, sortOrder, loading, error, loadLibrary, deleteAlbum, setSortOrder } = useLibraryStore();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

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

  return (
    <section className="library-view">
      <header className="library-toolbar">
        <h2>Library</h2>
        <label>
          Sort by
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
            <option value="name">Name</option>
            <option value="date">Date</option>
          </select>
        </label>
      </header>

      {loading && <p>Loading albums...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && sortedAlbums.length === 0 && <p>No albums available yet.</p>}

      <div className="album-list">
        {sortedAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} onDelete={handleDelete} />
        ))}
      </div>

      {pendingDeleteId && <p>Album removed from library.</p>}
    </section>
  );
}

export default LibraryView;
