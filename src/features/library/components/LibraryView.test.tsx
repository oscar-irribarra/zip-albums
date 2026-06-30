import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LibraryView from "./LibraryView";

const loadLibrary = vi.fn();
const deleteAlbum = vi.fn();
const importAlbum = vi.fn();
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
  loadLibrary,
  deleteAlbum,
  importAlbum,
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
  });

  it("renders backend-provided import errors", () => {
    mockState.albums = [];
    mockState.error = "No supported images were found in this ZIP.";
    render(<LibraryView />);
    expect(screen.getByText("No supported images were found in this ZIP.")).toBeInTheDocument();
  });
} );