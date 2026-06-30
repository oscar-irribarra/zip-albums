export type SortOrder = "name" | "date";

export interface AlbumSummary {
  id: string;
  title: string;
  path: string;
  image_count: number;
  cover_index: number;
  imported_at: string;
  last_opened_at?: string | null;
  cover_data?: string | null;
}

export interface LibraryResponse {
  albums: AlbumSummary[];
  sort_order: string;
}

export interface DeleteAlbumResponse {
  success: boolean;
  removed_album_id?: string | null;
}
