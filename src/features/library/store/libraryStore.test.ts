import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLibraryStore } from "./libraryStore";

const getLibraryMock = vi.fn();
const deleteAlbumMock = vi.fn();
const importAlbumMock = vi.fn();
const openAlbumViewerMock = vi.fn();
const loadAlbumImageMock = vi.fn();
const saveReadingProgressMock = vi.fn();

vi.mock( "../../../infrastructure/tauri", () => ( {
  getLibrary: ( ...args: unknown[] ) => getLibraryMock( ...args ),
  deleteAlbum: ( ...args: unknown[] ) => deleteAlbumMock( ...args ),
  importAlbum: ( ...args: unknown[] ) => importAlbumMock( ...args ),
  openAlbumViewer: ( ...args: unknown[] ) => openAlbumViewerMock( ...args ),
  loadAlbumImage: ( ...args: unknown[] ) => loadAlbumImageMock( ...args ),
  saveReadingProgress: ( ...args: unknown[] ) => saveReadingProgressMock( ...args ),
} ) );

describe( "libraryStore importAlbum", () => {
  beforeEach( () => {
    getLibraryMock.mockReset();
    deleteAlbumMock.mockReset();
    importAlbumMock.mockReset();
    openAlbumViewerMock.mockReset();
    loadAlbumImageMock.mockReset();
    saveReadingProgressMock.mockReset();
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
      thumbnailCache: {},
    } );
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
    loadAlbumImageMock.mockResolvedValue( {
      album_id: "album-1",
      image_index: 0,
      image_source: "data:image/png;base64,ZmFrZQ==",
      mime_type: "image/png",
    } );

    const result = await useLibraryStore.getState().openAlbumViewer( "album-1" );

    expect( result ).toBe( true );
    expect( useLibraryStore.getState().viewerSession?.current_index ).toBe( 0 );
    expect( useLibraryStore.getState().viewerImage?.image_index ).toBe( 0 );
  } );

  it( "navigates to a clamped image index and stores the loaded thumbnail", async () => {
    openAlbumViewerMock.mockResolvedValue( {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 4,
      start_index: 0,
    } );
    loadAlbumImageMock.mockResolvedValue( {
      album_id: "album-1",
      image_index: 0,
      image_source: "data:image/png;base64,ZmFrZQ==",
      mime_type: "image/png",
    } );
    saveReadingProgressMock.mockResolvedValue( {
      saved: true,
      updated_at: "2026-06-30T00:00:00Z",
    } );

    await useLibraryStore.getState().openAlbumViewer( "album-1" );

    loadAlbumImageMock.mockResolvedValueOnce( {
      album_id: "album-1",
      image_index: 3,
      image_source: "data:image/png;base64,ZmFrZQ==",
      mime_type: "image/png",
    } );

    const result = await useLibraryStore.getState().goToImage( 99 );

    expect( result ).toBe( true );
    expect( useLibraryStore.getState().viewerSession?.current_index ).toBe( 3 );
    expect( useLibraryStore.getState().viewerImage?.image_index ).toBe( 3 );
    expect( useLibraryStore.getState().thumbnailCache["album-1:3"]?.image_index ).toBe( 3 );
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
    loadAlbumImageMock.mockResolvedValue( {
      album_id: "album-a",
      image_index: 0,
      image_source: "data:image/png;base64,ZmFrZQ==",
      mime_type: "image/png",
    } );
    saveReadingProgressMock.mockResolvedValue( {
      saved: true,
      updated_at: "2026-06-30T00:00:00Z",
    } );

    await useLibraryStore.getState().openAlbumViewer( "album-a" );

    loadAlbumImageMock.mockResolvedValueOnce( {
      album_id: "album-a",
      image_index: 1,
      image_source: "data:image/png;base64,ZmFrZQ==",
      mime_type: "image/png",
    } );
    await useLibraryStore.getState().loadViewerImage( 1 );

    expect( saveReadingProgressMock ).toHaveBeenCalledWith( {
      album_id: "album-a",
      last_image_index: 1,
    } );
  } );
} );