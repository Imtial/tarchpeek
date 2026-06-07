import { useCallback } from 'react';
import type { ContinueWatchingItem, TubeArchivistClient } from '../../services/tubeArchivist';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { VideoResultsList } from './VideoResultsList';
import { usePagedResource } from './hooks/usePagedResource';

type ContinueWatchingScreenProps = {
  browseRefreshKey: number;
  client: TubeArchivistClient;
  onOpenVideo: (
    videoId: string,
    queueContext?: { videoIds: string[]; currentIndex: number },
  ) => Promise<void>;
};

function sortWatchedLast(items: ContinueWatchingItem[]) {
  const unwatched = items.filter(item => !item.watched);
  const watched = items.filter(item => item.watched);
  return [...unwatched, ...watched];
}

function ContinueWatchingScreen({
  browseRefreshKey,
  client,
  onOpenVideo,
}: ContinueWatchingScreenProps) {
  const fetchPage = useCallback((page: number) => client.fetchContinueWatching(page), [client]);
  const mergeItems = useCallback(
    (currentItems: ContinueWatchingItem[], nextPageItems: ContinueWatchingItem[]) =>
      sortWatchedLast([...currentItems, ...nextPageItems]),
    [],
  );

  const { hasNextPage, isLoading, isLoadingMore, items, loadMore } =
    usePagedResource<ContinueWatchingItem>({
      fetchPage,
      mergeItems,
      reloadKey: browseRefreshKey,
    });

  return (
    <BrowsingScreenShell subtitle="" testID="continue-watching-screen" title="Continue Watching">
      <VideoResultsList
        hasNextPage={hasNextPage}
        isLoading={isLoading && items.length === 0}
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
