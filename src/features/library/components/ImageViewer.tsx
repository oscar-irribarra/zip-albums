import { useMemo, useState } from "react";
import ThumbnailStrip from "./ThumbnailStrip";
import type { AlbumViewSession, LoadAlbumImageResponse } from "../../../shared/types/library";

interface ImageViewerProps {
  session: AlbumViewSession;
  image: LoadAlbumImageResponse | null;
  loading: boolean;
  error: string | null;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  thumbnailStripPinned: boolean;
  onToggleThumbnailStrip: () => void;
  thumbnailCache: Record<string, LoadAlbumImageResponse>;
  loadThumbnailImage: (imageIndex: number) => Promise<LoadAlbumImageResponse | null>;
  onSelectThumbnail: (index: number) => void;
}

function ImageViewer( {
  session,
  image,
  loading,
  error,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrev,
  onNext,
  onClose,
  thumbnailStripPinned,
  onToggleThumbnailStrip,
  thumbnailCache,
  loadThumbnailImage,
  onSelectThumbnail,
}: ImageViewerProps ) {
  const [prevImageSize, setPrevImageSize] = useState<{ width: number; height: number } | null>( null );
  const [isHovered, setIsHovered] = useState( false );

  const counter = `${session.current_index + 1} / ${session.total_images}`;
  const thumbnailVisible = isHovered || thumbnailStripPinned;

  const skeletonStyle = useMemo( () => {
    if ( !prevImageSize ) {
      return undefined;
    }

    return { aspectRatio: `${prevImageSize.width}/${prevImageSize.height}` };
  }, [prevImageSize] );

  const disablePrevious = loading || session.current_index <= 0;
  const disableNext = loading || session.current_index >= session.total_images - 1;

  return (
    <section
      className="album-viewer"
      aria-label="Album viewer"
      onMouseEnter={() => setIsHovered( true )}
      onMouseLeave={() => setIsHovered( false )}
    >
      <header className="album-viewer-header">
        <h3>{session.album_name}</h3>
        <p className="album-viewer-counter">{counter}</p>
      </header>

      <div className="album-viewer-image-frame">
        <div className="viewer-zoom-controls">
          <button type="button" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">+</button>
          <button type="button" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">-</button>
          <button type="button" onClick={onZoomReset} aria-label="Reset zoom" title="Reset zoom">o</button>
        </div>

        {loading && prevImageSize && <div className="image-skeleton" style={skeletonStyle} />}
        {loading && !prevImageSize && <p>Loading image...</p>}

        {!loading && image && (
          <img
            src={image.image_source}
            alt={`${session.album_name} page ${session.current_index + 1}`}
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center" }}
            onLoad={(event) => {
              setPrevImageSize( {
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              } );
            }}
          />
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      <ThumbnailStrip
        albumId={session.album_id}
        totalImages={session.total_images}
        selectedIndex={session.current_index}
        thumbnailCache={thumbnailCache}
        onSelect={onSelectThumbnail}
        loadThumbnailImage={loadThumbnailImage}
        visible={thumbnailVisible}
      />

      <div className="album-viewer-actions">
        <button type="button" onClick={onPrev} disabled={disablePrevious}>
          Previous
        </button>
        <button type="button" onClick={onToggleThumbnailStrip} aria-label="Toggle thumbnail strip">
          Thumbnails
        </button>
        <button type="button" onClick={onNext} disabled={disableNext}>
          Next
        </button>
        <button type="button" onClick={onClose}>
          Close Viewer
        </button>
      </div>
    </section>
  );
}

export default ImageViewer;
