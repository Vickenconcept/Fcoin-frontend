import { MouseEvent } from 'react';
import type { FeedPost } from './hooks/useFeed';

type FeedMediaGridProps = {
  media: FeedPost['media'];
  onOpen?: () => void;
};

export function FeedMediaGrid({ media, onOpen }: FeedMediaGridProps) {
  if (!media || media.length === 0) return null;

  const total = media.length;
  const displayMedias = media.slice(0, 4);

  const layoutConfig: Record<number, { container: string; tiles: string[] }> = {
    1: { container: 'space-y-2', tiles: ['h-96'] },
    2: {
      container: 'grid grid-cols-2 gap-2',
      tiles: ['h-72', 'h-72'],
    },
    3: {
      container: 'grid grid-cols-2 gap-2',
      tiles: ['h-64', 'h-64', 'h-64 col-span-2'],
    },
    4: {
      container: 'grid grid-cols-2 gap-2',
      tiles: ['h-60', 'h-60', 'h-60', 'h-60'],
    },
  };

  const layout =
    layoutConfig[Math.min(displayMedias.length, 4)] ?? layoutConfig[4];
  const tileBase =
    'relative rounded-lg overflow-hidden cursor-pointer bg-black/5 hover:ring-2 hover:ring-orange-200';
  const remainingCount = total - 4;

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
    }
  };

  const handleOverlayClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handleOpen();
  };

  const renderMediaContent = (item: FeedPost['media'][number]) => {
    if (item.type === 'image') {
      return (
        <img
          src={item.url}
          alt="Post media"
          className="h-full w-full object-cover transition duration-200 hover:scale-105"
        />
      );
    }

    return (
      <video
        src={item.url}
        controls
        className="h-full w-full object-cover bg-black"
        poster={item.thumbnail_url || undefined}
      />
    );
  };

  return (
    <div className={`mb-4 ${layout.container}`}>
      {displayMedias.map((item, index) => {
        const tileClass = layout.tiles[index] ?? 'h-60';
        const showOverlay =
          total > 4 &&
          index === displayMedias.length - 1 &&
          remainingCount > 0;

        return (
          <div
            key={`${item.id}-${index}`}
            className={`${tileBase} ${tileClass}`}
            onClick={handleOpen}
          >
            {renderMediaContent(item)}
            {showOverlay && (
              <button
                type="button"
                onClick={handleOverlayClick}
                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-lg font-semibold tracking-wide"
              >
                See all +{remainingCount}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

