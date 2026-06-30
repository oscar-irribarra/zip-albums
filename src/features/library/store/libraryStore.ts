import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AlbumSummary, DeleteAlbumResponse, LibraryResponse, SortOrder } from "../../../shared/types/library";

interface LibraryState {
  albums: AlbumSummary[];
  sortOrder: SortOrder;
  loading: boolean;
  error: string | null;
  loadLibrary: () => Promise<void>;
  deleteAlbum: ( albumId: string ) => Promise<boolean>;
  setSortOrder: ( order: SortOrder ) => void;
}

export const useLibraryStore = create<LibraryState>( ( set, get ) => ( {
  albums: [],
  sortOrder: "name",
  loading: false,
  error: null,

  loadLibrary: async () => {
    set( { loading: true, error: null } );
    try {
      const response = await invoke<LibraryResponse>( "get_library" );
      set( { albums: response.albums, loading: false } );
    } catch ( error ) {
      set( { error: error instanceof Error ? error.message : "Unable to load the library", loading: false } );
    }
  },

  deleteAlbum: async ( albumId: string ) => {
    try {
      const response = await invoke<DeleteAlbumResponse>( "delete_album", { payload: { album_id: albumId } } );
      if ( response.success ) {
        const albums = get().albums.filter( ( album ) => album.id !== albumId );
        set( { albums } );
        return true;
      }

      set( { error: "The selected album could not be deleted" } );
      return false;
    } catch ( error ) {
      set( { error: error instanceof Error ? error.message : "Unable to delete the album" } );
      return false;
    }
  },

  setSortOrder: ( order ) => set( { sortOrder: order } ),
} ) );
