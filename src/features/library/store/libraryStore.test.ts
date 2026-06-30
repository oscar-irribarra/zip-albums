import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLibraryStore } from "./libraryStore";

const invokeMock = vi.fn();

vi.mock( "@tauri-apps/api/core", () => ( {
  invoke: ( ...args: unknown[] ) => invokeMock( ...args ),
} ) );

describe( "libraryStore importAlbum", () => {
  beforeEach( () => {
    invokeMock.mockReset();
    useLibraryStore.setState( {
      albums: [],
      sortOrder: "name",
      loading: false,
      importing: false,
      error: null,
    } );
  } );

  it( "inserts imported album immediately on success", async () => {
    invokeMock.mockResolvedValue( {
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

    invokeMock.mockRejectedValue( { code: "NO_SUPPORTED_IMAGES" } );

    const result = await useLibraryStore.getState().importAlbum( "C:/albums/invalid.zip" );

    expect( result ).toBe( false );
    expect( useLibraryStore.getState().albums ).toHaveLength( 1 );
    expect( useLibraryStore.getState().albums[0].id ).toBe( "existing" );
    expect( useLibraryStore.getState().error ).toBe( "No supported images were found in this ZIP." );
  } );
} );