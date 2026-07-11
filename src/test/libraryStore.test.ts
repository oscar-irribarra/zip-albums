import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLibraryStore } from "../features/library/store/libraryStore";

vi.mock( "../infrastructure/tauri", () => ( {
  deleteAlbum: vi.fn(),
  getLibrary: vi.fn(),
  importAlbum: vi.fn(),
  loadAlbumImageForCache: vi.fn(),
  openAlbumViewer: vi.fn(),
  setLastOpenedAlbum: vi.fn(),
  saveReadingProgress: vi.fn(),
} ) );

import {
  loadAlbumImageForCache,
  openAlbumViewer,
  saveReadingProgress,
} from "../infrastructure/tauri";

const mockedLoadAlbumImageForCache = vi.mocked( loadAlbumImageForCache );
const mockedOpenAlbumViewer = vi.mocked( openAlbumViewer );
const mockedSaveReadingProgress = vi.mocked( saveReadingProgress );

function resetStore() {
  useLibraryStore.setState( {
    albums: [],
    sortOrder: "name",
    loading: false,
    importing: false,
    error: null,
    viewerSession: null,
    viewerImage: null,
    viewerLoading: false,
    viewerError: null,
    imageCache: {},
    cacheWindow: null,
    cacheDiagnostics: {
      current_hit: false,
      previous_cached: false,
      next_cached: false,
      cache_entries: 0,
      cache_estimated_bytes: 0,
    },
    thumbnailCache: {},
    zoomLevel: 1,
    thumbnailStripPinned: false,
  } );
}

describe( "libraryStore zoom and thumbnail pin state", () => {
  beforeEach( () => {
    vi.clearAllMocks();
    resetStore();
  } );

  it( "clamps zoom level to valid range", () => {
    useLibraryStore.getState().setZoomLevel( 5 );
    expect( useLibraryStore.getState().zoomLevel ).toBe( 4 );

    useLibraryStore.getState().setZoomLevel( 0 );
    expect( useLibraryStore.getState().zoomLevel ).toBe( 0.25 );
  } );

  it( "resets zoom to 1.0 on goToImage", async () => {
    mockedLoadAlbumImageForCache.mockResolvedValue( {
      album_id: "a1",
      image_index: 1,
      image_source: "data:image/png;base64,abc",
      mime_type: "image/png",
    } );
    mockedSaveReadingProgress.mockResolvedValue( {
      saved: true,
      updated_at: "2026-07-10T00:00:00.000Z",
    } );

    useLibraryStore.setState( {
      viewerSession: {
        album_id: "a1",
        album_name: "Album",
        total_images: 5,
        current_index: 0,
        started_at: "2026-07-10T00:00:00.000Z",
      },
      zoomLevel: 2,
    } );

    const ok = await useLibraryStore.getState().goToImage( 1 );

    expect( ok ).toBe( true );
    expect( useLibraryStore.getState().zoomLevel ).toBe( 1 );
  } );

  it( "resets zoom to 1.0 on openAlbumViewer", async () => {
    mockedOpenAlbumViewer.mockResolvedValue( {
      album_id: "a1",
      album_name: "Album",
      total_images: 5,
      start_index: 0,
    } );
    mockedLoadAlbumImageForCache.mockResolvedValue( {
      album_id: "a1",
      image_index: 0,
      image_source: "data:image/png;base64,abc",
      mime_type: "image/png",
    } );

    useLibraryStore.setState( { zoomLevel: 3 } );

    const ok = await useLibraryStore.getState().openAlbumViewer( "a1", false );

    expect( ok ).toBe( true );
    expect( useLibraryStore.getState().zoomLevel ).toBe( 1 );
  } );

  it( "resets thumbnailStripPinned on closeViewer", async () => {
    mockedSaveReadingProgress.mockResolvedValue( {
      saved: true,
      updated_at: "2026-07-10T00:00:00.000Z",
    } );

    useLibraryStore.setState( {
      thumbnailStripPinned: true,
      viewerSession: {
        album_id: "a1",
        album_name: "Album",
        total_images: 5,
        current_index: 1,
        started_at: "2026-07-10T00:00:00.000Z",
      },
    } );

    await useLibraryStore.getState().closeViewer();

    expect( useLibraryStore.getState().thumbnailStripPinned ).toBe( false );
  } );
} );
