import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ChannelDetail,
  ContinueWatchingItem,
  TubeArchivistClient,
} from '../../../services/tubeArchivist';
import { usePagedResource } from './usePagedResource';

type UseChannelDetailResourceParams = {
  channelId: string;
  client: TubeArchivistClient;
};

function useChannelDetailResource({ channelId, client }: UseChannelDetailResourceParams) {
  const [detail, setDetail] = useState<ChannelDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(true);
  const [isDetailError, setIsDetailError] = useState(false);

  const reloadKey = useMemo(() => ({ channelId, client }), [channelId, client]);
  const mergeVideoItems = useCallback(
    (currentItems: ContinueWatchingItem[], nextPageItems: ContinueWatchingItem[]) => [
      ...currentItems,
      ...nextPageItems,
    ],
    [],
  );
  const fetchPage = useCallback(
    (page: number) => client.fetchChannelVideos(channelId, page),
    [channelId, client],
  );
  const {
    hasNextPage,
    isError: isVideosError,
    isLoading: isVideosLoading,
    isLoadingMore,
    items: videoItems,
    loadMore,
    reload,
  } = usePagedResource<ContinueWatchingItem>({
    fetchPage,
    mergeItems: mergeVideoItems,
    reloadKey,
  });

  useEffect(() => {
    let isMounted = true;
    setIsDetailLoading(true);
    setIsDetailError(false);

    async function loadDetail() {
      try {
        const response = await client.fetchChannelDetail(channelId);
        if (!isMounted) {
          return;
        }
        setDetail(response);
      } catch {
        if (!isMounted) {
          return;
        }
        setIsDetailError(true);
        setDetail(null);
      } finally {
        if (isMounted) {
          setIsDetailLoading(false);
        }
      }
    }

    loadDetail().catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, [channelId, client]);

  return {
    detail,
    hasNextPage,
    isDetailError,
    isDetailLoading,
    isVideosError,
    isVideosLoading,
    isLoadingMore,
    videoItems,
    loadMore,
    reloadVideos: reload,
  };
}

export { useChannelDetailResource };
