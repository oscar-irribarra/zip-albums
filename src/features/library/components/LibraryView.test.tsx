import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LibraryView from "./LibraryView";

const loadLibrary = vi.fn();
const deleteAlbum = vi.fn();
const importAlbum = vi.fn();
const openAlbumViewer = vi.fn();
const loadViewerImage = vi.fn();
const closeViewer = vi.fn();
const setSortOrder = vi.fn();
const mockState = {
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
  loadLibrary,
  deleteAlbum,
  importAlbum,
  openAlbumViewer,
  loadViewerImage,
  closeViewer,
  setSortOrder,
};

vi.mock("../store/libraryStore", () => ( {
  useLibraryStore: () => mockState,
} ) );

describe("LibraryView", () => {
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

    expect(screen.getByRole("heading", { name: "Album One" })).toBeInTheDocument();
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
} );