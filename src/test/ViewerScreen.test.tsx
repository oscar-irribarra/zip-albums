import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ViewerScreen from "../features/viewer/components/ViewerScreen";

// Mock ThumbnailStrip to isolate ViewerScreen from async thumbnail loading side-effects.
vi.mock( "../features/viewer/components/ThumbnailStrip", () => ( {
  default: () => null,
} ) );

// Mutable zoom level for per-test control; must be a box object so the factory
// closure picks up mutations made before each render.
const mocks = vi.hoisted( () => ( {
  setZoomLevel: vi.fn(),
  goToImage: vi.fn().mockResolvedValue( true ),
  closeViewer: vi.fn().mockResolvedValue( undefined ),
  setThumbnailStripPinned: vi.fn(),
  loadThumbnailImage: vi.fn().mockResolvedValue( null ),
  zoomLevel: { value: 1.0 },
} ) );

vi.mock( "../features/library/store/libraryStore", () => ( {
  useLibraryStore: ( selector: ( s: unknown ) => unknown ) =>
    selector( {
      viewerSession: {
        album_id: "test-album",
        album_name: "Test Album",
        total_images: 3,
        current_index: 0,
        started_at: "2026-07-11T00:00:00.000Z",
      },
      viewerImage: {
        album_id: "test-album",
        image_index: 0,
        image_source: "data:image/png;base64,abc",
        mime_type: "image/png",
      },
      viewerLoading: false,
      viewerError: null,
      zoomLevel: mocks.zoomLevel.value,
      thumbnailStripPinned: false,
      thumbnailCache: {},
      goToImage: mocks.goToImage,
      closeViewer: mocks.closeViewer,
      setZoomLevel: mocks.setZoomLevel,
      setThumbnailStripPinned: mocks.setThumbnailStripPinned,
      loadThumbnailImage: mocks.loadThumbnailImage,
    } ),
} ) );

beforeEach( () => {
  mocks.zoomLevel.value = 1.0;
  vi.clearAllMocks();
  // jsdom does not implement pointer capture — stub to prevent errors.
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
} );

// ─── US1: Zoom In and Out ─────────────────────────────────────────────────────

describe( "ViewerScreen — Zoom In/Out (US1)", () => {
  it( "Zoom In from 1.0 calls setZoomLevel with 1.1 (10% step)", () => {
    render( <ViewerScreen /> );

    fireEvent.click( screen.getByRole( "button", { name: /zoom in/i } ) );

    expect( mocks.setZoomLevel ).toHaveBeenCalledWith( 1.1 );
  } );

  it( "Zoom In at 4.0 (max) calls setZoomLevel with 4.0 (clamped)", () => {
    mocks.zoomLevel.value = 4.0;
    render( <ViewerScreen /> );

    fireEvent.click( screen.getByRole( "button", { name: /zoom in/i } ) );

    expect( mocks.setZoomLevel ).toHaveBeenCalledWith( 4.0 );
  } );

  it( "Zoom Out from 1.0 calls setZoomLevel with 0.9 (10% step)", () => {
    render( <ViewerScreen /> );

    fireEvent.click( screen.getByRole( "button", { name: /zoom out/i } ) );

    expect( mocks.setZoomLevel ).toHaveBeenCalledWith( 0.9 );
  } );

  it( "Zoom Out at 0.25 (min) calls setZoomLevel with 0.25 (clamped)", () => {
    mocks.zoomLevel.value = 0.25;
    render( <ViewerScreen /> );

    fireEvent.click( screen.getByRole( "button", { name: /zoom out/i } ) );

    expect( mocks.setZoomLevel ).toHaveBeenCalledWith( 0.25 );
  } );
} );

// ─── US2: Pan While Zoomed ────────────────────────────────────────────────────

describe( "ViewerScreen — Pan (US2)", () => {
  it( "drag at 100% scale updates the image transform (drag not gated on zoom level)", () => {
    render( <ViewerScreen /> );

    const frame = document.querySelector( ".album-viewer-image-frame" ) as HTMLElement;
    fireEvent.pointerDown( frame, { clientX: 0, clientY: 0, pointerId: 1 } );
    fireEvent.pointerMove( frame, { clientX: 50, clientY: 30, pointerId: 1 } );
    fireEvent.pointerUp( frame, { pointerId: 1 } );

    const img = screen.getByRole( "img" );
    expect( img ).toHaveStyle( { transform: "translate(50px, 30px) scale(1)" } );
  } );
} );

// ─── US3: Reset ───────────────────────────────────────────────────────────────

describe( "ViewerScreen — Reset (US3)", () => {
  it( "Reset calls setZoomLevel(1) and restores the image transform to origin", () => {
    render( <ViewerScreen /> );

    // Pan the image first to establish a non-zero offset.
    const frame = document.querySelector( ".album-viewer-image-frame" ) as HTMLElement;
    fireEvent.pointerDown( frame, { clientX: 0, clientY: 0, pointerId: 1 } );
    fireEvent.pointerMove( frame, { clientX: 80, clientY: 60, pointerId: 1 } );
    fireEvent.pointerUp( frame, { pointerId: 1 } );

    // Confirm offset was applied.
    expect( screen.getByRole( "img" ) ).toHaveStyle( {
      transform: "translate(80px, 60px) scale(1)",
    } );

    // Reset zoom and position.
    fireEvent.click( screen.getByRole( "button", { name: /reset zoom/i } ) );

    expect( mocks.setZoomLevel ).toHaveBeenCalledWith( 1 );
    expect( screen.getByRole( "img" ) ).toHaveStyle( {
      transform: "translate(0px, 0px) scale(1)",
    } );
  } );
} );
