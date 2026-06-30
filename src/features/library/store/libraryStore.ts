import { create } from "zustand";
import {
  deleteAlbum as deleteAlbumCommand,
  getLibrary,
  importAlbum as importAlbumCommand,
  loadAlbumImage as loadAlbumImageCommand,
  openAlbumViewer as openAlbumViewerCommand,
  saveReadingProgress as saveReadingProgressCommand,
} from "../../../infrastructure/tauri";
import type {
  AlbumViewSession,
  AlbumSummary,
  ImportAlbumError,
  LoadAlbumImageResponse,
  SortOrder,
  ViewerCommandError,
} from "../../../shared/types/library";

interface LibraryState {
  albums: AlbumSummary[];
  sortOrder: SortOrder;
  loading: boolean;
  importing: boolean;
  error: string | null;
  viewerSession: AlbumViewSession | null;
  viewerImage: LoadAlbumImageResponse | null;
  viewerLoading: boolean;
  viewerError: string | null;
  thumbnailCache: Record<string, LoadAlbumImageResponse>;
  loadLibrary: () => Promise<void>;
  deleteAlbum: ( albumId: string ) => Promise<boolean>;
  importAlbum: ( zipPath: string ) => Promise<boolean>;
  openAlbumViewer: ( albumId: string ) => Promise<boolean>;
  goToImage: ( imageIndex: number ) => Promise<boolean>;
  loadViewerImage: ( imageIndex: number ) => Promise<boolean>;
  loadThumbnailImage: ( imageIndex: number ) => Promise<LoadAlbumImageResponse | null>;
  closeViewer: () => Promise<void>;
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

const viewerErrorMessages: Record<ViewerCommandError["code"], string> = {
  ALBUM_NOT_FOUND: "The selected album could not be found.",
  IMAGE_INDEX_OUT_OF_RANGE: "The selected page is out of range.",
  ZIP_READ_FAILURE: "Unable to read image data from the ZIP.",
  UNSUPPORTED_IMAGE: "This image format is not supported.",
  PROGRESS_READ_FAILURE: "Unable to restore your previous progress.",
  PROGRESS_WRITE_FAILURE: "Unable to save your reading progress.",
  IO_FAILURE: "A local file error occurred while opening this album.",
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

function resolveViewerErrorMessage( error: unknown ): string {
  if ( error && typeof error === "object" && "code" in error ) {
    const typed = error as Partial<ViewerCommandError>;
    if ( typed.code && typed.code in viewerErrorMessages ) {
      return viewerErrorMessages[typed.code as ViewerCommandError["code"]];
    }
  }

  if ( error instanceof Error ) {
    return error.message;
  }

  return "Unable to open the selected album";
}

function buildThumbnailKey( albumId: string, imageIndex: number ): string {
  return `${albumId}:${imageIndex}`;
}

let navigationRequestId = 0;

export const useLibraryStore = create<LibraryState>( ( set, get ) => ( {
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

  loadLibrary: async () => {
    set( { loading: true, error: null } );
    try {
      const response = await getLibrary();
      set( { albums: response.albums, loading: false } );
    } catch ( error ) {
      set( { error: error instanceof Error ? error.message : "Unable to load the library", loading: false } );
    }
  },

  deleteAlbum: async ( albumId: string ) => {
    try {
      const response = await deleteAlbumCommand( { album_id: albumId } );
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
      const response = await importAlbumCommand( { zip_path: zipPath } );

      const albums = [response.album, ...get().albums.filter( ( album ) => album.id !== response.album.id )];
      set( { albums, importing: false } );
      return true;
    } catch ( error ) {
      set( { error: resolveImportErrorMessage( error ), importing: false } );
      return false;
    }
  },

  openAlbumViewer: async ( albumId: string ) => {
    const requestId = ++navigationRequestId;
    set( { viewerLoading: true, viewerError: null } );
    try {
      const response = await openAlbumViewerCommand( { album_id: albumId } );
      const session: AlbumViewSession = {
        album_id: response.album_id,
        album_name: response.album_name,
        total_images: response.total_images,
        current_index: response.start_index,
        started_at: new Date().toISOString(),
      };

      const image = await loadAlbumImageCommand( {
        album_id: response.album_id,
        image_index: response.start_index,
      } );

      if ( requestId !== navigationRequestId ) {
        return true;
      }

      set( {
        viewerSession: session,
        viewerImage: image,
        viewerLoading: false,
        thumbnailCache: {
          [buildThumbnailKey( response.album_id, response.start_index )]: image,
        },
      } );
      return true;
    } catch ( error ) {
      if ( requestId !== navigationRequestId ) {
        return false;
      }

      set( {
        viewerSession: null,
        viewerImage: null,
        viewerError: resolveViewerErrorMessage( error ),
        viewerLoading: false,
        thumbnailCache: {},
      } );
      return false;
    }
  },

  goToImage: async ( imageIndex: number ) => {
    const session = get().viewerSession;
    if ( !session ) {
      return false;
    }

    const boundedIndex = Math.max( 0, Math.min( imageIndex, session.total_images - 1 ) );
    const requestId = ++navigationRequestId;

    set( { viewerLoading: true, viewerError: null } );
    try {
      const image = await loadAlbumImageCommand( {
        album_id: session.album_id,
        image_index: boundedIndex,
      } );

      if ( requestId !== navigationRequestId ) {
        return true;
      }

      set( {
        viewerImage: image,
        viewerSession: { ...session, current_index: boundedIndex },
        thumbnailCache: {
          ...get().thumbnailCache,
          [buildThumbnailKey( session.album_id, boundedIndex )]: image,
        },
      } );

      try {
        if ( requestId !== navigationRequestId ) {
          return true;
        }

        await saveReadingProgressCommand( {
          album_id: session.album_id,
          last_image_index: boundedIndex,
        } );
      } catch ( progressError ) {
        if ( requestId === navigationRequestId ) {
          set( { viewerError: resolveViewerErrorMessage( progressError ) } );
        }
      }

      if ( requestId === navigationRequestId ) {
        set( { viewerLoading: false } );
      }
      return true;
    } catch ( error ) {
      if ( requestId === navigationRequestId ) {
        set( { viewerError: resolveViewerErrorMessage( error ), viewerLoading: false } );
      }
      return false;
    }
  },

  loadViewerImage: async ( imageIndex: number ) => get().goToImage( imageIndex ),

  loadThumbnailImage: async ( imageIndex: number ) => {
    const session = get().viewerSession;
    if ( !session ) {
      return null;
    }

    const boundedIndex = Math.max( 0, Math.min( imageIndex, session.total_images - 1 ) );
    const cacheKey = buildThumbnailKey( session.album_id, boundedIndex );
    const cached = get().thumbnailCache[cacheKey];
    if ( cached ) {
      return cached;
    }

    const image = await loadAlbumImageCommand( {
      album_id: session.album_id,
      image_index: boundedIndex,
    } );

    if ( get().viewerSession?.album_id === session.album_id ) {
      set( ( state ) => ( {
        thumbnailCache: {
          ...state.thumbnailCache,
          [cacheKey]: image,
        },
      } ) );
    }

    return image;
  },

  closeViewer: async () => {
    navigationRequestId += 1;
    const session = get().viewerSession;
    if ( session ) {
      try {
        await saveReadingProgressCommand( {
          album_id: session.album_id,
          last_image_index: session.current_index,
        } );
      } catch {
        // Closing should not be blocked by progress persistence issues.
      }
    }

    set( {
      viewerSession: null,
      viewerImage: null,
      viewerLoading: false,
      viewerError: null,
      thumbnailCache: {},
    } );
  },

  setSortOrder: ( order ) => set( { sortOrder: order } ),
} ) );
