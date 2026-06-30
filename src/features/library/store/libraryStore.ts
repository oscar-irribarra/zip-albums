import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  AlbumSummary,
  DeleteAlbumResponse,
  ImportAlbumError,
  ImportAlbumResponse,
  LibraryResponse,
  SortOrder,
} from "../../../shared/types/library";

interface LibraryState {
  albums: AlbumSummary[];
  sortOrder: SortOrder;
  loading: boolean;
  importing: boolean;
  error: string | null;
  loadLibrary: () => Promise<void>;
  deleteAlbum: ( albumId: string ) => Promise<boolean>;
  importAlbum: ( zipPath: string ) => Promise<boolean>;
  setSortOrder: ( order: SortOrder ) => void;
}

const importErrorMessages: Record<ImportAlbumError["code"], string> = {
  UNSUPPORTED_FORMAT: "Only ZIP files are supported for import.",
  ZIP_CORRUPTED: "The selected ZIP appears to be corrupted.",
  ZIP_EMPTY: "The selected ZIP is empty.",
  NO_SUPPORTED_IMAGES: "No supported images were found in this ZIP.",
  DUPLICATE_ALBUM: "This ZIP is already in your library.",
  IO_FAILURE: "A local file error occurred while importing.",
};

function resolveImportErrorMessage( error: unknown ): string {
  if ( error && typeof error === "object" && "code" in error ) {
    const typed = error as Partial<ImportAlbumError>;
    if ( typed.code && typed.code in importErrorMessages ) {
      return importErrorMessages[typed.code as ImportAlbumError["code"]];
    }
  }

  if ( error instanceof Error ) {
    return error.message;
  }

  return "Unable to import the selected ZIP";
}

export const useLibraryStore = create<LibraryState>( ( set, get ) => ( {
  albums: [],
  sortOrder: "name",
  loading: false,
  importing: false,
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

  importAlbum: async ( zipPath: string ) => {
    set( { importing: true, error: null } );
    try {
      const response = await invoke<ImportAlbumResponse>( "import_album", {
        payload: { zip_path: zipPath },
      } );

      const albums = [response.album, ...get().albums.filter( ( album ) => album.id !== response.album.id )];
      set( { albums, importing: false } );
      return true;
    } catch ( error ) {
      set( { error: resolveImportErrorMessage( error ), importing: false } );
      return false;
    }
  },

  setSortOrder: ( order ) => set( { sortOrder: order } ),
} ) );
