import { create } from "zustand";
import {
  deleteAlbum as deleteAlbumCommand,
  getLibrary,
  importAlbum as importAlbumCommand,
  loadAlbumImageForCache,
  openAlbumViewer as openAlbumViewerCommand,
  setLastOpenedAlbum as setLastOpenedAlbumCommand,
  saveReadingProgress as saveReadingProgressCommand,
} from "../../../infrastructure/tauri";
import type {
  AlbumViewSession,
  AlbumSummary,
  CacheWindowState,
  ImageCacheDiagnostics,
  ImportAlbumError,
  LoadAlbumImageResponse,
  SortOrder,
  ViewerImageCacheEntry,
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
  imageCache: Record<string, ViewerImageCacheEntry>;
  cacheWindow: CacheWindowState | null;
  cacheDiagnostics: ImageCacheDiagnostics;
  thumbnailCache: Record<string, LoadAlbumImageResponse>;
  loadLibrary: () => Promise<void>;
  deleteAlbum: ( albumId: string ) => Promise<boolean>;
  importAlbum: ( zipPath: string ) => Promise<boolean>;
  openAlbumViewer: ( albumId: string, rememberLastAlbum?: boolean ) => Promise<boolean>;
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

export const VIEWER_CACHE_WINDOW_RADIUS = 1;
export const VIEWER_CACHE_MAX_ENTRIES = 9;
export const VIEWER_CACHE_MAX_ESTIMATED_BYTES = 24 * 1024 * 1024;

export function clampImageIndex( imageIndex: number, totalImages: number ): number {
  if ( totalImages <= 0 ) {
    return 0;
  }

  return Math.max( 0, Math.min( imageIndex, totalImages - 1 ) );
}

export function computeCacheWindow( currentIndex: number, totalImages: number, radius = VIEWER_CACHE_WINDOW_RADIUS ) {
  if ( totalImages <= 0 ) {
    return { start: 0, end: 0 };
  }

  const start = clampImageIndex( currentIndex - radius, totalImages );
  const end = clampImageIndex( currentIndex + radius, totalImages );
  return { start, end };
}

export function estimateImageBytes( imageSource: string ): number {
  // Base64 text occupies roughly one byte per ASCII char in JS strings.
  return imageSource.length;
}

function imageIndexFromCacheKey( cacheKey: string ): number {
  const parts = cacheKey.split( ":" );
  const value = Number( parts[parts.length - 1] );
  return Number.isFinite( value ) ? value : -1;
}

function toCacheEntry( image: LoadAlbumImageResponse ): ViewerImageCacheEntry {
  return {
    album_id: image.album_id,
    image_index: image.image_index,
    image_source: image.image_source,
    mime_type: image.mime_type,
    cached_at: new Date().toISOString(),
    estimated_bytes: estimateImageBytes( image.image_source ),
  };
}

function toImageResponse( entry: ViewerImageCacheEntry ): LoadAlbumImageResponse {
  return {
    album_id: entry.album_id,
    image_index: entry.image_index,
    image_source: entry.image_source,
    mime_type: entry.mime_type,
  };
}

export function sortEvictionKeys(
  cacheEntries: Record<string, ViewerImageCacheEntry>,
  currentIndex: number,
  protectedKeys: Set<string>,
): string[] {
  return Object.keys( cacheEntries )
    .filter( ( key ) => !protectedKeys.has( key ) )
    .sort( ( left, right ) => {
      const leftDistance = Math.abs( imageIndexFromCacheKey( left ) - currentIndex );
      const rightDistance = Math.abs( imageIndexFromCacheKey( right ) - currentIndex );
      return rightDistance - leftDistance;
    } );
}

function toThumbnailCache( cacheEntries: Record<string, ViewerImageCacheEntry> ): Record<string, LoadAlbumImageResponse> {
  return Object.fromEntries(
    Object.entries( cacheEntries ).map( ( [key, entry] ) => [key, toImageResponse( entry )] ),
  );
}

function applyCachePolicy(
  albumId: string,
  currentIndex: number,
  totalImages: number,
  imageCache: Record<string, ViewerImageCacheEntry>,
) {
  const { start, end } = computeCacheWindow( currentIndex, totalImages );
  const protectedKeys = new Set<string>();
  for ( let index = start; index <= end; index += 1 ) {
    protectedKeys.add( buildThumbnailKey( albumId, index ) );
  }

  const scopedEntries = Object.fromEntries(
    Object.entries( imageCache ).filter( ( [_, entry] ) => entry.album_id === albumId ),
  );

  const windowEntries = Object.fromEntries(
    Object.entries( scopedEntries ).filter( ( [key] ) => {
      const imageIndex = imageIndexFromCacheKey( key );
      return imageIndex >= start && imageIndex <= end;
    } ),
  );

  const keysByDistance = sortEvictionKeys( windowEntries, currentIndex, protectedKeys );
  let nextCache = { ...windowEntries };

  while ( Object.keys( nextCache ).length > VIEWER_CACHE_MAX_ENTRIES && keysByDistance.length > 0 ) {
    const evictKey = keysByDistance.shift();
    if ( !evictKey ) {
      break;
    }

    delete nextCache[evictKey];
  }

  let totalEstimatedBytes = Object.values( nextCache ).reduce( ( sum, entry ) => sum + entry.estimated_bytes, 0 );
  const byteEvictionOrder = sortEvictionKeys( nextCache, currentIndex, protectedKeys );
  while ( totalEstimatedBytes > VIEWER_CACHE_MAX_ESTIMATED_BYTES && byteEvictionOrder.length > 0 ) {
    const evictKey = byteEvictionOrder.shift();
    if ( !evictKey ) {
      break;
    }

    totalEstimatedBytes -= nextCache[evictKey].estimated_bytes;
    delete nextCache[evictKey];
  }

  totalEstimatedBytes = Object.values( nextCache ).reduce( ( sum, entry ) => sum + entry.estimated_bytes, 0 );
  const previousKey = buildThumbnailKey( albumId, currentIndex - 1 );
  const currentKey = buildThumbnailKey( albumId, currentIndex );
  const nextKey = buildThumbnailKey( albumId, currentIndex + 1 );

  return {
    imageCache: nextCache,
    thumbnailCache: toThumbnailCache( nextCache ),
    cacheWindow: {
      current_index: currentIndex,
      window_start: start,
      window_end: end,
      max_entries: VIEWER_CACHE_MAX_ENTRIES,
      max_estimated_bytes: VIEWER_CACHE_MAX_ESTIMATED_BYTES,
      total_estimated_bytes: totalEstimatedBytes,
    },
    cacheDiagnostics: {
      current_hit: currentKey in nextCache,
      previous_cached: previousKey in nextCache,
      next_cached: nextKey in nextCache,
      cache_entries: Object.keys( nextCache ).length,
      cache_estimated_bytes: totalEstimatedBytes,
    },
  };
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

  openAlbumViewer: async ( albumId: string, rememberLastAlbum = false ) => {
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

      const image = await loadAlbumImageForCache( {
        album_id: response.album_id,
        image_index: response.start_index,
      } );

      if ( requestId !== navigationRequestId ) {
        return true;
      }

      const seededCache = {
        [buildThumbnailKey( response.album_id, response.start_index )]: toCacheEntry( image ),
      };
      const policy = applyCachePolicy(
        response.album_id,
        response.start_index,
        response.total_images,
        seededCache,
      );

      set( {
        viewerSession: session,
        viewerImage: image,
        viewerLoading: false,
        ...policy,
      } );

      const prefetchTargets = [response.start_index - 1, response.start_index + 1]
        .filter( ( index ) => index >= 0 && index < response.total_images );

      for ( const prefetchIndex of prefetchTargets ) {
        void loadAlbumImageForCache( {
          album_id: response.album_id,
          image_index: prefetchIndex,
        } ).then( ( prefetched ) => {
          if ( requestId !== navigationRequestId || get().viewerSession?.album_id !== response.album_id ) {
            return;
          }

          set( ( state ) => {
            const cacheKey = buildThumbnailKey( response.album_id, prefetched.image_index );
            if ( state.imageCache[cacheKey] ) {
              return state;
            }

            const nextCache = {
              ...state.imageCache,
              [cacheKey]: toCacheEntry( prefetched ),
            };

            return {
              ...applyCachePolicy( response.album_id, session.current_index, session.total_images, nextCache ),
            };
          } );
        } ).catch( () => {
          // Prefetch is opportunistic and should never block primary navigation.
        } );
      }

      if ( rememberLastAlbum ) {
        try {
          await setLastOpenedAlbumCommand( { album_id: response.album_id } );
        } catch {
          // Last-opened tracking is best effort and should not block viewer open.
        }
      }

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
      return false;
    }
  },

  goToImage: async ( imageIndex: number ) => {
    const session = get().viewerSession;
    if ( !session ) {
      return false;
    }

    const boundedIndex = clampImageIndex( imageIndex, session.total_images );
    const requestId = ++navigationRequestId;
    const cacheKey = buildThumbnailKey( session.album_id, boundedIndex );

    set( { viewerLoading: true, viewerError: null } );
    try {
      const cachedImage = get().imageCache[cacheKey];
      const image = cachedImage
        ? toImageResponse( cachedImage )
        : await loadAlbumImageForCache( {
          album_id: session.album_id,
          image_index: boundedIndex,
        } );

      if ( requestId !== navigationRequestId ) {
        return true;
      }

      set( ( state ) => {
        const nextCache = {
          ...state.imageCache,
          [cacheKey]: toCacheEntry( image ),
        };
        const policy = applyCachePolicy( session.album_id, boundedIndex, session.total_images, nextCache );

        return {
          viewerImage: image,
          viewerSession: { ...session, current_index: boundedIndex },
          ...policy,
        };
      } );

      const prefetchTargets = [boundedIndex - 1, boundedIndex + 1]
        .filter( ( index ) => index >= 0 && index < session.total_images );

      for ( const prefetchIndex of prefetchTargets ) {
        const prefetchKey = buildThumbnailKey( session.album_id, prefetchIndex );
        if ( get().imageCache[prefetchKey] ) {
          continue;
        }

        void loadAlbumImageForCache( {
          album_id: session.album_id,
          image_index: prefetchIndex,
        } ).then( ( prefetched ) => {
          if ( requestId !== navigationRequestId || get().viewerSession?.album_id !== session.album_id ) {
            return;
          }

          set( ( state ) => {
            const nextKey = buildThumbnailKey( session.album_id, prefetched.image_index );
            if ( state.imageCache[nextKey] ) {
              return state;
            }

            const nextCache = {
              ...state.imageCache,
              [nextKey]: toCacheEntry( prefetched ),
            };

            return {
              ...applyCachePolicy( session.album_id, boundedIndex, session.total_images, nextCache ),
            };
          } );
        } ).catch( () => {
          // Prefetch failures should not block current image navigation.
        } );
      }

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

    const boundedIndex = clampImageIndex( imageIndex, session.total_images );
    const cacheKey = buildThumbnailKey( session.album_id, boundedIndex );
    const cached = get().thumbnailCache[cacheKey];
    if ( cached ) {
      return cached;
    }

    const cachedImage = get().imageCache[cacheKey];
    if ( cachedImage ) {
      return toImageResponse( cachedImage );
    }

    const image = await loadAlbumImageForCache( {
      album_id: session.album_id,
      image_index: boundedIndex,
    } );

    if ( get().viewerSession?.album_id === session.album_id ) {
      set( ( state ) => ( {
        ...applyCachePolicy(
          session.album_id,
          state.viewerSession?.current_index ?? boundedIndex,
          session.total_images,
          {
            ...state.imageCache,
            [cacheKey]: toCacheEntry( image ),
          },
        ),
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
  },

  setSortOrder: ( order ) => set( { sortOrder: order } ),
} ) );
