import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LibraryView from "./LibraryView";
import type { AlbumViewSession, SortOrder } from "../../../shared/types/library";

const openDialogMock = vi.fn();

vi.mock("@tauri-apps/plugin-dialog", () => ( {
  open: ( ...args: unknown[] ) => openDialogMock( ...args ),
} ) );

const loadLibrary = vi.fn();
const deleteAlbum = vi.fn();
const importAlbum = vi.fn();
const openAlbumViewer = vi.fn();
const goToImage = vi.fn();
const setSortOrder = vi.fn();
interface LibraryViewMockState {
  albums: Array<{
    id: string;
    title: string;
    path: string;
    image_count: number;
    cover_index: number;
    imported_at: string;
    last_opened_at: string | null;
    cover_data: string | null;
  }>;
  sortOrder: SortOrder;
  loading: boolean;
  importing: boolean;
  error: string | null;
  viewerSession: AlbumViewSession | null;
  loadLibrary: typeof loadLibrary;
  deleteAlbum: typeof deleteAlbum;
  importAlbum: typeof importAlbum;
  openAlbumViewer: typeof openAlbumViewer;
  goToImage: typeof goToImage;
  setSortOrder: typeof setSortOrder;
}

const mockState: LibraryViewMockState = {
  albums: [
    {
      id: "album-1",
      title: "Album One",
      path: "C:/albums/album-1.zip",
      image_count: 3,
      cover_index: 0,
      imported_at: "2026-06-30T00:00:00Z",
      last_opened_at: null,
      cover_data: null,
    },
  ],
  sortOrder: "name" as const,
  loading: false,
  importing: false,
  error: null as string | null,
  viewerSession: null,
  loadLibrary,
  deleteAlbum,
  importAlbum,
  openAlbumViewer,
  goToImage,
  setSortOrder,
};

vi.mock("../store/libraryStore", () => ( {
  useLibraryStore: () => mockState,
} ) );

describe("LibraryView", () => {
  beforeEach(() => {
    loadLibrary.mockReset();
    deleteAlbum.mockReset();
    importAlbum.mockReset();
    openAlbumViewer.mockReset();
    goToImage.mockReset();
    setSortOrder.mockReset();
    openDialogMock.mockReset();
    vi.spyOn( window, "confirm" ).mockReturnValue( true );

    mockState.sortOrder = "name";
    mockState.loading = false;
    mockState.importing = false;
    mockState.error = null;
    mockState.viewerSession = null;
    mockState.albums = [
      {
        id: "album-1",
        title: "Album One",
        path: "C:/albums/album-1.zip",
        image_count: 3,
        cover_index: 0,
        imported_at: "2026-06-30T00:00:00Z",
        last_opened_at: null,
        cover_data: null,
      },
    ];
  });

  it("renders imported albums", () => {
    mockState.error = null;
    mockState.albums = [
      {
        id: "album-1",
        title: "Album One",
        path: "C:/albums/album-1.zip",
        image_count: 3,
        cover_index: 0,
        imported_at: "2026-06-30T00:00:00Z",
        last_opened_at: null,
        cover_data: null,
      },
    ];
    render(<LibraryView />);
    expect(screen.getByText("Album One")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import ZIP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });

  it("renders backend-provided import errors", () => {
    mockState.albums = [];
    mockState.error = "No supported images were found in this ZIP.";
    render(<LibraryView />);
    expect(screen.getByText("No supported images were found in this ZIP.")).toBeInTheDocument();
  });


  it( "does not execute shortcuts when editing text inputs", () => {
    mockState.viewerSession = {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 5,
      current_index: 2,
      started_at: "2026-06-30T00:00:00Z",
    };

    render( <LibraryView /> );
    const input = document.createElement( "input" );
    document.body.appendChild( input );

    fireEvent.keyDown( input, { key: "ArrowRight" } );
    fireEvent.keyDown( input, { key: "Home" } );

    expect( goToImage ).not.toHaveBeenCalled();
    document.body.removeChild( input );
  } );


  it( "does not delete when no album is selected", async () => {
    mockState.albums = [];
    render( <LibraryView /> );

    fireEvent.keyDown( window, { key: "Delete" } );
    await Promise.resolve();

    expect( deleteAlbum ).not.toHaveBeenCalled();
  } );
} );