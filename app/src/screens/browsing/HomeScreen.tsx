import { useCallback, useMemo } from 'react';
import { TARCHPEEK_CONSTANTS } from '../../constants/tarchpeekConstants';
import type { ContinueWatchingItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { usePagedResource, type PagedResponse } from './hooks/usePagedResource';
import { VideoResultsList } from './VideoResultsList';

const HOME_PAGE_WINDOW_SIZE = TARCHPEEK_CONSTANTS.browsing.homePageWindowSize;

type HomeScreenProps = {
  browseRefreshKey: number;
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string, queueContext?: { videoIds: string[]; currentIndex: number }) => Promise<void>;
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
  const reloadKey = useMemo(() => ({ browseRefreshKey, client }), [browseRefreshKey, client]);
  const fetchPage = useCallback(
    async (page: number): Promise<PagedResponse<HomePageChunk>> => {
      const homePage = await client.fetchHomeFeed(page);
      return {
        items: [{ page: homePage.currentPage, items: homePage.items }],
        currentPage: homePage.currentPage,
        hasNextPage: homePage.hasNextPage,
      };
    },
    [client],
  );
  const mergePageChunks = useCallback((currentItems: HomePageChunk[], nextPageItems: HomePageChunk[]) => {
    const nextPageChunk = nextPageItems[0];
    if (!nextPageChunk) {
      return currentItems;
    }
    const filtered = currentItems.filter(chunk => chunk.page !== nextPageChunk.page);
    const nextChunks = [...filtered, nextPageChunk];
    while (nextChunks.length > HOME_PAGE_WINDOW_SIZE) {
      nextChunks.shift();
    }
    return nextChunks;
  }, []);
  const {
    hasNextPage,
    isLoading: isLoadingContinueWatching,
    isLoadingMore,
    items: pageChunks,
    loadMore,
  } = usePagedResource<HomePageChunk>({
    fetchPage,
    mergeItems: mergePageChunks,
    reloadKey,
  });
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

  return (
    <BrowsingScreenShell
      subtitle="Intentional retrieval with glanceable progress and newness cues."
      testID="home-screen"
      title="Home">
      <VideoResultsList
        hasNextPage={hasNextPage}
        isLoading={isLoadingContinueWatching && homeItems.length === 0}
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
