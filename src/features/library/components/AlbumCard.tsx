import type { AlbumSummary } from "../../../shared/types/library";

interface AlbumCardProps {
  album: AlbumSummary;
  onDelete: (albumId: string) => void;
  onOpen: (albumId: string) => void;
}

function AlbumCard({ album, onDelete, onOpen }: AlbumCardProps) {
  return (
    <article className="album-card">
      <div className="album-cover" aria-label={`Cover for ${album.title}`}>
        <img
          src={album.cover_data ?? "/vite.svg"}
          alt={album.title}
          loading="lazy"
        />
      </div>
      <div className="album-details">
        <h3>{album.title}</h3>
        <p>{album.image_count} images</p>
        <p>Imported {new Date(album.imported_at).toLocaleDateString()}</p>
        <button type="button" onClick={() => onOpen(album.id)}>
          Open
        </button>
        <button type="button" onClick={() => onDelete(album.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default AlbumCard;
