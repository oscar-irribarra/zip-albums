import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ImageViewer from "../features/library/components/ImageViewer";
import type { AlbumViewSession, LoadAlbumImageResponse } from "../shared/types/library";

const session: AlbumViewSession = {
  album_id: "a1",
  album_name: "Album",
  total_images: 10,
  current_index: 2,
  started_at: "2026-07-10T00:00:00.000Z",
};

const image: LoadAlbumImageResponse = {
  album_id: "a1",
  image_index: 2,
  image_source: "data:image/png;base64,abc",
  mime_type: "image/png",
};

function renderViewer( loading = false ) {
  const onZoomIn = vi.fn();
  const onZoomOut = vi.fn();
  const onZoomReset = vi.fn();

  const view = render(
    <ImageViewer
      session={session}
      image={image}
      loading={loading}
      error={null}
      zoomLevel={1}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onZoomReset={onZoomReset}
      onPrev={vi.fn()}
      onNext={vi.fn()}
      onClose={vi.fn()}
      thumbnailStripPinned={false}
      onToggleThumbnailStrip={vi.fn()}
      thumbnailCache={{}}
      loadThumbnailImage={vi.fn().mockResolvedValue( null )}
      onSelectThumbnail={vi.fn()}
    />,
  );

  return { view, onZoomIn, onZoomOut, onZoomReset };
}

describe( "ImageViewer", () => {
  it( "renders skeleton while loading after previous image size is known", () => {
    const { view } = renderViewer( false );

    const imageElement = screen.getByRole( "img", { name: /album page 3/i } );
    Object.defineProperty( imageElement, "naturalWidth", { value: 1200, configurable: true } );
    Object.defineProperty( imageElement, "naturalHeight", { value: 800, configurable: true } );
    fireEvent.load( imageElement );

    view.rerender(
      <ImageViewer
        session={session}
        image={image}
        loading={true}
        error={null}
        zoomLevel={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onClose={vi.fn()}
        thumbnailStripPinned={false}
        onToggleThumbnailStrip={vi.fn()}
        thumbnailCache={{}}
        loadThumbnailImage={vi.fn().mockResolvedValue( null )}
        onSelectThumbnail={vi.fn()}
      />,
    );

    expect( document.querySelector( ".image-skeleton" ) ).not.toBeNull();
  } );

  it( "fires zoom callbacks from controls", () => {
    const { onZoomIn, onZoomOut, onZoomReset } = renderViewer( false );

    fireEvent.click( screen.getByRole( "button", { name: /zoom in/i } ) );
    fireEvent.click( screen.getByRole( "button", { name: /zoom out/i } ) );
    fireEvent.click( screen.getByRole( "button", { name: /reset zoom/i } ) );

    expect( onZoomIn ).toHaveBeenCalledTimes( 1 );
    expect( onZoomOut ).toHaveBeenCalledTimes( 1 );
    expect( onZoomReset ).toHaveBeenCalledTimes( 1 );
  } );
} );
