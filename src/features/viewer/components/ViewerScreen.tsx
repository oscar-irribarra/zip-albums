import { useEffect, useMemo, useRef, useState } from "react";
import ThumbnailStrip from "./ThumbnailStrip";
import { useLibraryStore } from "../../library/store/libraryStore";

function isEditableTarget( target: EventTarget | null ): boolean {
  const el = target as HTMLElement | null;
  const tag = el?.tagName?.toLowerCase();
  return Boolean( el?.isContentEditable || tag === "input" || tag === "textarea" || tag === "select" );
}

function ViewerScreen() {
  const session = useLibraryStore( ( s ) => s.viewerSession );
  const image = useLibraryStore( ( s ) => s.viewerImage );
  const loading = useLibraryStore( ( s ) => s.viewerLoading );
  const error = useLibraryStore( ( s ) => s.viewerError );
  const zoomLevel = useLibraryStore( ( s ) => s.zoomLevel );
  const thumbnailStripPinned = useLibraryStore( ( s ) => s.thumbnailStripPinned );
  const thumbnailCache = useLibraryStore( ( s ) => s.thumbnailCache );
  const goToImage = useLibraryStore( ( s ) => s.goToImage );
  const closeViewer = useLibraryStore( ( s ) => s.closeViewer );
  const setZoomLevel = useLibraryStore( ( s ) => s.setZoomLevel );
  const setThumbnailStripPinned = useLibraryStore( ( s ) => s.setThumbnailStripPinned );
  const loadThumbnailImage = useLibraryStore( ( s ) => s.loadThumbnailImage );

  const sessionCurrentIndex = session?.current_index ?? 0;
  const sessionTotalImages = session?.total_images ?? 0;

  const [prevImageSize, setPrevImageSize] = useState<{ width: number; height: number } | null>( null );
  const [hoverVisible, setHoverVisible] = useState( false );
  const [panOffset, setPanOffset] = useState( { x: 0, y: 0 } );
  const frameRef = useRef<HTMLDivElement>( null );
  const isDragging = useRef( false );
  const dragStart = useRef( { x: 0, y: 0, panX: 0, panY: 0 } );

  const handlePointerDown = ( e: React.PointerEvent<HTMLDivElement> ) => {
    if ( zoomLevel <= 1 ) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: panOffset.x, panY: panOffset.y };
    e.currentTarget.setPointerCapture( e.pointerId );
  };

  const handlePointerMove = ( e: React.PointerEvent<HTMLDivElement> ) => {
    if ( !isDragging.current || !frameRef.current || !prevImageSize ) return;
    const frame = frameRef.current.getBoundingClientRect();
    const maxX = Math.max( 0, ( prevImageSize.width * zoomLevel - frame.width ) / 2 );
    const maxY = Math.max( 0, ( prevImageSize.height * zoomLevel - frame.height ) / 2 );
    const newX = dragStart.current.panX + ( e.clientX - dragStart.current.x );
    const newY = dragStart.current.panY + ( e.clientY - dragStart.current.y );
    setPanOffset( {
      x: Math.max( -maxX, Math.min( newX, maxX ) ),
      y: Math.max( -maxY, Math.min( newY, maxY ) ),
    } );
  };

  const handlePointerUp = ( e: React.PointerEvent<HTMLDivElement> ) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture( e.pointerId );
  };

  useEffect( () => {
    const handleKeyDown = ( event: KeyboardEvent ) => {
      if ( isEditableTarget( event.target ) ) return;
      const isFullscreen = Boolean( document.fullscreenElement );

      if ( event.key === "ArrowLeft" && sessionCurrentIndex > 0 ) {
        event.preventDefault();
        void goToImage( sessionCurrentIndex - 1 );
      } else if ( event.key === "ArrowRight" && sessionCurrentIndex < sessionTotalImages - 1 ) {
        event.preventDefault();
        void goToImage( sessionCurrentIndex + 1 );
      } else if ( event.key === "Home" && sessionCurrentIndex !== 0 ) {
        event.preventDefault();
        void goToImage( 0 );
      } else if ( event.key === "End" && sessionCurrentIndex !== sessionTotalImages - 1 ) {
        event.preventDefault();
        void goToImage( sessionTotalImages - 1 );
      } else if ( ( event.key === "f" || event.key === "F" ) && !isFullscreen ) {
        event.preventDefault();
        void document.documentElement.requestFullscreen?.();
      } else if ( event.key === "Escape" && isFullscreen ) {
        event.preventDefault();
        void document.exitFullscreen?.();
      }
    };

    window.addEventListener( "keydown", handleKeyDown );
    return () => window.removeEventListener( "keydown", handleKeyDown );
  }, [goToImage, sessionCurrentIndex, sessionTotalImages] );

  if ( !session ) {
    return null;
  }

  const counter = `${session.current_index + 1} / ${session.total_images}`;
  const thumbnailVisible = hoverVisible || thumbnailStripPinned;

  const skeletonStyle = useMemo( () => {
    if ( !prevImageSize ) {
      return undefined;
    }
    return { aspectRatio: `${prevImageSize.width}/${prevImageSize.height}` };
  }, [prevImageSize] );

  const disablePrevious = loading || session.current_index <= 0;
  const disableNext = loading || session.current_index >= session.total_images - 1;

  const handlePrev = () => {
    if ( session.current_index > 0 ) {
      setPanOffset( { x: 0, y: 0 } );
      void goToImage( session.current_index - 1 );
    }
  };

  const handleNext = () => {
    if ( session.current_index < session.total_images - 1 ) {
      setPanOffset( { x: 0, y: 0 } );
      void goToImage( session.current_index + 1 );
    }
  };

  return (
    <section
      className="album-viewer"
      aria-label="Album viewer"
    >
      <header className="album-viewer-header">
        <button
          type="button"
          className="viewer-back-btn"
          onClick={() => void closeViewer()}
          aria-label="Back to library"
        >
          ← Back
        </button>
        <h3>{session.album_name}</h3>
        <p className="album-viewer-counter">{counter}</p>
      </header>

      <div
        ref={frameRef}
        className="album-viewer-image-frame"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: zoomLevel > 1 ? "grab" : "default" }}
      >
        <div className="viewer-zoom-controls">
          <button type="button" onClick={() => setZoomLevel( zoomLevel + 0.25 )} aria-label="Zoom in" title="Zoom in">+</button>
          <button type="button" onClick={() => setZoomLevel( zoomLevel - 0.25 )} aria-label="Zoom out" title="Zoom out">-</button>
          <button type="button" onClick={() => { setZoomLevel( 1 ); setPanOffset( { x: 0, y: 0 } ); }} aria-label="Reset zoom" title="Reset zoom">○</button>
        </div>

        {loading && prevImageSize && <div className="image-skeleton" style={skeletonStyle} />}
        {loading && !prevImageSize && <p>Loading image...</p>}

        {!loading && image && (
          <img
            src={image.image_source}
            alt={`${session.album_name} page ${session.current_index + 1}`}
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`, transformOrigin: "center" }}
            onLoad={( event ) => {
              setPrevImageSize( {
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              } );
            }}
          />
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="viewer-thumbnail-area">
        <div className={`thumbnail-strip-wrapper thumbnail-strip-wrapper--${thumbnailVisible ? "visible" : "hidden"}`}>
          <ThumbnailStrip
            albumId={session.album_id}
            totalImages={session.total_images}
            selectedIndex={session.current_index}
            thumbnailCache={thumbnailCache}
            onSelect={( index ) => void goToImage( index )}
            loadThumbnailImage={loadThumbnailImage}
            visible={thumbnailVisible}
          />
        </div>
        <div
          className="thumbnail-hover-zone"
          onMouseEnter={() => setHoverVisible( true )}
          onMouseLeave={() => setHoverVisible( false )}
        />
      </div>

      <div className="album-viewer-actions">
        <button type="button" onClick={handlePrev} disabled={disablePrevious}>
          Previous
        </button>
        <button
          type="button"
          onClick={() => setThumbnailStripPinned( !thumbnailStripPinned )}
          aria-label="Toggle thumbnail strip"
        >
          Thumbnails
        </button>
        <button type="button" onClick={handleNext} disabled={disableNext}>
          Next
        </button>
      </div>
    </section>
  );
}

export default ViewerScreen;
