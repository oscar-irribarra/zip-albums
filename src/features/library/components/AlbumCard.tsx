import { useEffect, useState } from "react";
import { getAlbumCover } from "../../../infrastructure/tauri";
import type { AlbumSummary } from "../../../shared/types/library";

interface AlbumCardProps {
  album: AlbumSummary;
  onDelete: (albumId: string) => void;
  onOpen: (albumId: string) => void;
  onSelect?: (albumId: string) => void;
}

interface CoverState {
  data: string | null;
  loading: boolean;
  error: boolean;
}

function AlbumCard({ album, onDelete, onOpen, onSelect }: AlbumCardProps) {
  const [cover, setCover] = useState<CoverState>({ data: null, loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    getAlbumCover({ album_id: album.id })
      .then((resp) => {
        if (!cancelled) {
          setCover({ data: resp.image_source, loading: false, error: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCover({ data: null, loading: false, error: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [album.id]);

  return (
    <article
      className="album-card"
      tabIndex={0}
      onClick={() => onSelect?.(album.id)}
      onFocus={() => onSelect?.(album.id)}
    >
      <div className="album-cover" aria-label={`Cover for ${album.title}`}>
        {cover.loading && <div className="album-cover-skeleton" />}
        {!cover.loading && cover.data && (
          <img src={cover.data} alt={album.title} loading="lazy" />
        )}
        {!cover.loading && !cover.data && (
          <span className="album-cover-placeholder" aria-hidden="true">📁</span>
        )}
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
