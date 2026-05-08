import { useEffect, useMemo, useState } from 'react';
import { TARCHPEEK_CONSTANTS } from '../../constants/tarchpeekConstants';
import type { ContinueWatchingItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { VideoResultsList } from './VideoResultsList';

const HOME_PAGE_WINDOW_SIZE = TARCHPEEK_CONSTANTS.browsing.homePageWindowSize;

type HomeScreenProps = {
  browseRefreshKey: number;
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string) => Promise<void>;
};

type HomePageChunk = {
  page: number;
  items: ContinueWatchingItem[];
};

function sortWatchedLast(items: ContinueWatchingItem[]) {
  const unwatched = items.filter(item => !item.watched);
  const watched = items.filter(item => item.watched);
  return [...unwatched, ...watched];
}

function HomeScreen({ browseRefreshKey, client, onOpenVideo }: HomeScreenProps) {
  const [pageChunks, setPageChunks] = useState<HomePageChunk[]>([]);
  const [isLoadingContinueWatching, setIsLoadingContinueWatching] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const homeItems = useMemo(() => {
    const seenIds = new Set<string>();
    const merged = pageChunks.flatMap(chunk => chunk.items);
    const uniqueItems = merged.filter(item => {
      if (seenIds.has(item.videoId)) {
        return false;
      }
      seenIds.add(item.videoId);
      return true;
    });
    return sortWatchedLast(uniqueItems);
  }, [pageChunks]);

  useEffect(() => {
    let isMounted = true;

    async function loadContinueWatching() {
      setIsLoadingContinueWatching(true);
      try {
        const homePage = await client.fetchHomeFeed(1);
        if (!isMounted) {
          return;
        }
        setPageChunks([{ page: homePage.currentPage, items: homePage.items }]);
        setPage(homePage.currentPage);
        setHasNextPage(homePage.hasNextPage);
      } catch {
        if (!isMounted) {
          return;
        }
        setPageChunks([]);
      } finally {
        if (isMounted) {
          setIsLoadingContinueWatching(false);
        }
      }
    }

    loadContinueWatching();

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
      const homePage = await client.fetchHomeFeed(nextPage);
      setPageChunks(previousChunks => {
        const filtered = previousChunks.filter(chunk => chunk.page !== homePage.currentPage);
        const nextChunks = [...filtered, { page: homePage.currentPage, items: homePage.items }];
        while (nextChunks.length > HOME_PAGE_WINDOW_SIZE) {
          nextChunks.shift();
        }
        return nextChunks;
      });
      setPage(homePage.currentPage);
      setHasNextPage(homePage.hasNextPage);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <BrowsingScreenShell
      subtitle="Intentional retrieval with glanceable progress and newness cues."
      title="Home">
      <VideoResultsList
        hasNextPage={hasNextPage}
        isLoading={isLoadingContinueWatching}
        isLoadingMore={isLoadingMore}
        items={homeItems}
        loadingCount={3}
        onLoadMore={loadMore}
        onOpenVideo={onOpenVideo}
      />
    </BrowsingScreenShell>
  );
}

export { HomeScreen };
