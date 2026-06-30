import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LibraryView from "./LibraryView";
import type { AlbumViewSession, LoadAlbumImageResponse, SortOrder } from "../../../shared/types/library";

const loadLibrary = vi.fn();
const deleteAlbum = vi.fn();
const importAlbum = vi.fn();
const openAlbumViewer = vi.fn();
const goToImage = vi.fn();
const loadThumbnailImage = vi.fn();
const closeViewer = vi.fn();
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
  viewerImage: LoadAlbumImageResponse | null;
  viewerLoading: boolean;
  viewerError: string | null;
  thumbnailCache: Record<string, LoadAlbumImageResponse>;
  loadLibrary: typeof loadLibrary;
  deleteAlbum: typeof deleteAlbum;
  importAlbum: typeof importAlbum;
  openAlbumViewer: typeof openAlbumViewer;
  goToImage: typeof goToImage;
  loadThumbnailImage: typeof loadThumbnailImage;
  closeViewer: typeof closeViewer;
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
  viewerImage: null,
  viewerLoading: false,
  viewerError: null as string | null,
  thumbnailCache: {},
  loadLibrary,
  deleteAlbum,
  importAlbum,
  openAlbumViewer,
  goToImage,
  loadThumbnailImage,
  closeViewer,
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
    loadThumbnailImage.mockReset();
    closeViewer.mockReset();
    setSortOrder.mockReset();

    mockState.sortOrder = "name";
    mockState.loading = false;
    mockState.importing = false;
    mockState.error = null;
    mockState.viewerSession = null;
    mockState.viewerImage = null;
    mockState.viewerLoading = false;
    mockState.viewerError = null;
    mockState.thumbnailCache = {};
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

  it("renders album viewer header context when session is open", () => {
    mockState.error = null;
    mockState.viewerSession = {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 10,
      current_index: 0,
      started_at: "2026-06-30T00:00:00Z",
    };
    mockState.viewerImage = {
      album_id: "album-1",
      image_index: 0,
      image_source: "data:image/png;base64,ZmFrZQ==",
      mime_type: "image/png",
    };

    render(<LibraryView />);

    const viewer = screen.getByLabelText("Album viewer");
    expect(within(viewer).getByRole("heading", { name: "Album One" })).toBeInTheDocument();
    expect(screen.getByText("1 / 10")).toBeInTheDocument();

    mockState.viewerSession = null;
    mockState.viewerImage = null;
  });

  it("renders restored counter position when reopening an album", () => {
    mockState.viewerSession = {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 10,
      current_index: 4,
      started_at: "2026-06-30T00:00:00Z",
    };
    mockState.viewerImage = {
      album_id: "album-1",
      image_index: 4,
      image_source: "data:image/png;base64,ZmFrZQ==",
      mime_type: "image/png",
    };

    render(<LibraryView />);

    expect(screen.getByText("5 / 10")).toBeInTheDocument();

    mockState.viewerSession = null;
    mockState.viewerImage = null;
  });

  it("renders thumbnail strip when the viewer is open", () => {
    mockState.viewerSession = {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 3,
      current_index: 1,
      started_at: "2026-06-30T00:00:00Z",
    };
    mockState.thumbnailCache = {
      "album-1:1": {
        album_id: "album-1",
        image_index: 1,
        image_source: "data:image/png;base64,ZmFrZQ==",
        mime_type: "image/png",
      },
    };

    render(<LibraryView />);

    expect(screen.getByLabelText("Album thumbnails")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Image 2" })).toBeInTheDocument();

    mockState.viewerSession = null;
    mockState.thumbnailCache = {};
  });

  it("disables previous button at first image", () => {
    mockState.viewerSession = {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 3,
      current_index: 0,
      started_at: "2026-06-30T00:00:00Z",
    };
    mockState.viewerImage = {
      album_id: "album-1",
      image_index: 0,
      image_source: "data:image/png;base64,ZmFrZQ==",
      mime_type: "image/png",
    };

    render(<LibraryView />);
    const previous = screen.getByRole("button", { name: "Previous" });
    fireEvent.click(previous);

    expect(previous).toBeDisabled();
    expect(goToImage).not.toHaveBeenCalled();

    mockState.viewerSession = null;
    mockState.viewerImage = null;
  });

  it("disables next button at last image", () => {
    mockState.viewerSession = {
      album_id: "album-1",
      album_name: "Album One",
      total_images: 3,
      current_index: 2,
      started_at: "2026-06-30T00:00:00Z",
    };
    mockState.viewerImage = {
      album_id: "album-1",
      image_index: 2,
      image_source: "data:image/png;base64,ZmFrZQ==",
      mime_type: "image/png",
    };

    render(<LibraryView />);
    const next = screen.getByRole("button", { name: "Next" });
    fireEvent.click(next);

    expect(next).toBeDisabled();
    expect(goToImage).not.toHaveBeenCalled();

    mockState.viewerSession = null;
    mockState.viewerImage = null;
  });
} );