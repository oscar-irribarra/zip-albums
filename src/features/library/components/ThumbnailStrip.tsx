import { useEffect, useRef } from "react";
import type { LoadAlbumImageResponse } from "../../../shared/types/library";

interface ThumbnailStripProps {
  albumId: string;
  totalImages: number;
  selectedIndex: number;
  thumbnailCache: Record<string, LoadAlbumImageResponse>;
  onSelect: (index: number) => void;
  loadThumbnailImage: (imageIndex: number) => Promise<LoadAlbumImageResponse | null>;
}

function buildThumbnailKey(albumId: string, imageIndex: number) {
  return `${albumId}:${imageIndex}`;
}

function ThumbnailStrip({
  albumId,
  totalImages,
  selectedIndex,
  thumbnailCache,
  onSelect,
  loadThumbnailImage,
}: ThumbnailStripProps) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const startIndex = Math.max(0, selectedIndex - 3);
    const endIndex = Math.min(totalImages - 1, selectedIndex + 3);

    for (let index = startIndex; index <= endIndex; index += 1) {
      void loadThumbnailImage(index);
    }
  }, [loadThumbnailImage, selectedIndex, totalImages]);

  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem && typeof selectedItem.scrollIntoView === "function") {
      selectedItem.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  return (
    <div className="thumbnail-strip" aria-label="Album thumbnails">
      {Array.from({ length: totalImages }, (_, index) => {
        const cacheKey = buildThumbnailKey(albumId, index);
        const cached = thumbnailCache[cacheKey];
        const isSelected = index === selectedIndex;

        return (
          <button
            key={cacheKey}
            type="button"
            className={isSelected ? "thumbnail-card thumbnail-card-selected" : "thumbnail-card"}
            onClick={() => onSelect(index)}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            aria-label={`Image ${index + 1}`}
            aria-pressed={isSelected}
          >
            <div className="thumbnail-preview">
              {cached ? <img src={cached.image_source} alt={`Thumbnail ${index + 1}`} loading="lazy" /> : <span>{index + 1}</span>}
            </div>
            <span className="thumbnail-index">{index + 1}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ThumbnailStrip;