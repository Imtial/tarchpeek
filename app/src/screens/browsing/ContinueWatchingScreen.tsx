import { useEffect, useState } from 'react';
import type { ContinueWatchingItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { VideoResultsList } from './VideoResultsList';

type ContinueWatchingScreenProps = {
  browseRefreshKey: number;
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string, queueContext?: { videoIds: string[]; currentIndex: number }) => Promise<void>;
};

function sortWatchedLast(items: ContinueWatchingItem[]) {
  const unwatched = items.filter(item => !item.watched);
  const watched = items.filter(item => item.watched);
  return [...unwatched, ...watched];
}

function ContinueWatchingScreen({ browseRefreshKey, client, onOpenVideo }: ContinueWatchingScreenProps) {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFirstPage() {
      setIsLoading(true);
      try {
        const firstPage = await client.fetchContinueWatching(1);
        if (!isMounted) {
          return;
        }
        setItems(sortWatchedLast(firstPage.items));
        setPage(firstPage.currentPage);
        setHasNextPage(firstPage.hasNextPage);
      } catch {
        if (!isMounted) {
          return;
        }
        setItems([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFirstPage();

    return () => {
      isMounted = false;
    };
  }, [browseRefreshKey, client]);

  async function loadMore() {
    if (isLoadingMore || !hasNextPage) {
      return;
    }
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const response = await client.fetchContinueWatching(nextPage);
      setItems(currentItems => sortWatchedLast([...currentItems, ...response.items]));
      setPage(response.currentPage);
      setHasNextPage(response.hasNextPage);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <BrowsingScreenShell
      subtitle=""
      testID="continue-watching-screen"
      title="Continue Watching">
      <VideoResultsList
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        items={items}
        loadingCount={5}
        onLoadMore={loadMore}
        onOpenVideo={onOpenVideo}
      />
    </BrowsingScreenShell>
  );
}

export { ContinueWatchingScreen };
