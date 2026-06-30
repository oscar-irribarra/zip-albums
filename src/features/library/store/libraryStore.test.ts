import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clampImageIndex,
  computeCacheWindow,
  estimateImageBytes,
  sortEvictionKeys,
  useLibraryStore,
} from "./libraryStore";
import type { ViewerImageCacheEntry } from "../../../shared/types/library";

const getLibraryMock = vi.fn();
const deleteAlbumMock = vi.fn();
const importAlbumMock = vi.fn();
const openAlbumViewerMock = vi.fn();
const loadAlbumImageMock = vi.fn();
const saveReadingProgressMock = vi.fn();
const setLastOpenedAlbumMock = vi.fn();

vi.mock( "../../../infrastructure/tauri", () => ( {
  getLibrary: ( ...args: unknown[] ) => getLibraryMock( ...args ),
  deleteAlbum: ( ...args: unknown[] ) => deleteAlbumMock( ...args ),
  importAlbum: ( ...args: unknown[] ) => importAlbumMock( ...args ),
  openAlbumViewer: ( ...args: unknown[] ) => openAlbumViewerMock( ...args ),
  loadAlbumImage: ( ...args: unknown[] ) => loadAlbumImageMock( ...args ),
  loadAlbumImageForCache: ( ...args: unknown[] ) => loadAlbumImageMock( ...args ),
  saveReadingProgress: ( ...args: unknown[] ) => saveReadingProgressMock( ...args ),
  setLastOpenedAlbum: ( ...args: unknown[] ) => setLastOpenedAlbumMock( ...args ),
} ) );

function makeImage( albumId: string, imageIndex: number ) {
  return {
    album_id: albumId,
    image_index: imageIndex,
    image_source: `data:image/png;base64,${btoa( `${albumId}-${imageIndex}` )}`,
    mime_type: "image/png",
  };
}

describe( "libraryStore cache helpers", () => {
  it( "clamps indices within album boundaries", () => {
    expect( clampImageIndex( -10, 5 ) ).toBe( 0 );
    expect( clampImageIndex( 99, 5 ) ).toBe( 4 );
    expect( clampImageIndex( 2, 5 ) ).toBe( 2 );
  } );

  it( "computes bounded cache windows", () => {
    expect( computeCacheWindow( 0, 10 ) ).toEqual( { start: 0, end: 1 } );
    expect( computeCacheWindow( 5, 10 ) ).toEqual( { start: 4, end: 6 } );
    expect( computeCacheWindow( 9, 10 ) ).toEqual( { start: 8, end: 9 } );
  } );

  it( "estimates image bytes from source string length", () => {
    expect( estimateImageBytes( "abc" ) ).toBe( 3 );
  } );

  it( "sorts eviction keys by farthest distance first", () => {
    const cache: Record<string, ViewerImageCacheEntry> = {
      "album:1": {
        album_id: "album",
        image_index: 1,
        image_source: "x",
        mime_type: "image/png",
        cached_at: "0",
        estimated_bytes: 1,
      },
      "album:7": {
        album_id: "album",
        image_index: 7,
        image_source: "x",
        mime_type: "image/png",
        cached_at: "0",
        estimated_bytes: 1,
      },
      "album:5": {
        album_id: "album",
        image_index: 5,
        image_source: "x",
        mime_type: "image/png",
        cached_at: "0",
        estimated_bytes: 1,
      },
    };

    const sorted = sortEvictionKeys( cache, 4, new Set( ["album:5"] ) );
    expect( sorted[0] ).toBe( "album:1" );
  } );
} );

describe( "libraryStore image cache behavior", () => {
  beforeEach( () => {
    getLibraryMock.mockReset();
    deleteAlbumMock.mockReset();
    importAlbumMock.mockReset();
    openAlbumViewerMock.mockReset();
    loadAlbumImageMock.mockReset();
    saveReadingProgressMock.mockReset();
    setLastOpenedAlbumMock.mockReset();
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
    } );

    loadAlbumImageMock.mockImplementation( async ( payload: { album_id: string; image_index: number } ) =>
      makeImage( payload.album_id, payload.image_index ) );
  } );

  it( "inserts imported album immediately on success", async () => {
    importAlbumMock.mockResolvedValue( {
      album: {
        id: "new-album",
        title: "new-album",
        path: "C:/albums/new-album.zip",
        image_count: 5,
        cover_index: 0,
        imported_at: "1761847142",
        last_opened_at: null,
      },
    } );

    const result = await useLibraryStore.getState().importAlbum( "C:/albums/new-album.zip" );

    expect( result ).toBe( true );
    expect( useLibraryStore.getState().albums ).toHaveLength( 1 );
    expect( useLibraryStore.getState().albums[0].id ).toBe( "new-album" );
    expect( useLibraryStore.getState().error ).toBeNull();
  } );

  it( "keeps album list unchanged on import failure", async () => {
    useLibraryStore.setState( {
      albums: [
        {
          id: "existing",
          title: "Existing",
          path: "C:/albums/existing.zip",
          image_count: 1,
          cover_index: 0,
          imported_at: "1761847142",
          last_opened_at: null,
        },
      ],
    } );

    importAlbumMock.mockRejectedValue( { code: "NO_SUPPORTED_IMAGES" } );

    const result = await useLibraryStore.getState().importAlbum( "C:/albums/invalid.zip" );

    expect( result ).toBe( false );
    expect( useLibraryStore.getState().albums ).toHaveLength( 1 );
    expect( useLibraryStore.getState().albums[0].id ).toBe( "existing" );
    expect( useLibraryStore.getState().error ).toBe( "No supported images were found in this ZIP." );
  } );

  it( "opens viewer from cover and loads visible image", async () => {
    openAlbumViewerMock.mockResolvedValue( {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 4,
      start_index: 0,
    } );
    const result = await useLibraryStore.getState().openAlbumViewer( "album-1", true );
    await Promise.resolve();

    expect( result ).toBe( true );
    expect( useLibraryStore.getState().viewerSession?.current_index ).toBe( 0 );
    expect( useLibraryStore.getState().viewerImage?.image_index ).toBe( 0 );
    expect( useLibraryStore.getState().cacheDiagnostics.current_hit ).toBe( true );
    expect( setLastOpenedAlbumMock ).toHaveBeenCalledWith( { album_id: "album-1" } );
  } );

  it( "does not track last opened album when remember flag is disabled", async () => {
    openAlbumViewerMock.mockResolvedValue( {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 4,
      start_index: 0,
    } );
    const result = await useLibraryStore.getState().openAlbumViewer( "album-1", false );

    expect( result ).toBe( true );
    expect( setLastOpenedAlbumMock ).not.toHaveBeenCalled();
  } );

  it( "navigates to a clamped image index and stores the loaded thumbnail", async () => {
    openAlbumViewerMock.mockResolvedValue( {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 4,
      start_index: 0,
    } );
    saveReadingProgressMock.mockResolvedValue( {
      saved: true,
      updated_at: "2026-06-30T00:00:00Z",
    } );

    await useLibraryStore.getState().openAlbumViewer( "album-1" );

    const result = await useLibraryStore.getState().goToImage( 99 );
    await Promise.resolve();

    expect( result ).toBe( true );
    expect( useLibraryStore.getState().viewerSession?.current_index ).toBe( 3 );
    expect( useLibraryStore.getState().viewerImage?.image_index ).toBe( 3 );
    expect( useLibraryStore.getState().thumbnailCache["album-1:3"]?.image_index ).toBe( 3 );
    expect( useLibraryStore.getState().cacheDiagnostics.previous_cached ).toBe( true );
    expect( saveReadingProgressMock ).toHaveBeenCalledWith( {
      album_id: "album-1",
      last_image_index: 3,
    } );
  } );

  it( "keeps per-album progress writes scoped to active viewer album", async () => {
    openAlbumViewerMock.mockResolvedValue( {
      album_id: "album-a",
      album_name: "Album A",
      total_images: 3,
      start_index: 0,
    } );
    saveReadingProgressMock.mockResolvedValue( {
      saved: true,
      updated_at: "2026-06-30T00:00:00Z",
    } );

    await useLibraryStore.getState().openAlbumViewer( "album-a" );

    await useLibraryStore.getState().loadViewerImage( 1 );

    expect( saveReadingProgressMock ).toHaveBeenCalledWith( {
      album_id: "album-a",
      last_image_index: 1,
    } );
  } );

  it( "evicts stale entries when jumping to distant image", async () => {
    openAlbumViewerMock.mockResolvedValue( {
      album_id: "album-jump",
      album_name: "Album Jump",
      total_images: 20,
      start_index: 0,
    } );
    saveReadingProgressMock.mockResolvedValue( {
      saved: true,
      updated_at: "2026-06-30T00:00:00Z",
    } );

    await useLibraryStore.getState().openAlbumViewer( "album-jump" );
    await useLibraryStore.getState().goToImage( 10 );
    await Promise.resolve();

    const keys = Object.keys( useLibraryStore.getState().imageCache );
    expect( keys ).toContain( "album-jump:10" );
    expect( keys.some( ( key ) => key === "album-jump:0" ) ).toBe( false );
  } );

  it( "avoids duplicate cache entries during rapid back-and-forth navigation", async () => {
    openAlbumViewerMock.mockResolvedValue( {
      album_id: "album-loop",
      album_name: "Album Loop",
      total_images: 6,
      start_index: 2,
    } );
    saveReadingProgressMock.mockResolvedValue( {
      saved: true,
      updated_at: "2026-06-30T00:00:00Z",
    } );

    await useLibraryStore.getState().openAlbumViewer( "album-loop" );
    await useLibraryStore.getState().goToImage( 3 );
    await useLibraryStore.getState().goToImage( 2 );
    await useLibraryStore.getState().goToImage( 3 );
    await Promise.resolve();

    const keys = Object.keys( useLibraryStore.getState().imageCache );
    const unique = new Set( keys );
    expect( unique.size ).toBe( keys.length );
  } );
} );