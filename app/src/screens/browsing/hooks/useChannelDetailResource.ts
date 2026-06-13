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

type ChannelDetailState = {
  channelId: string;
  client: TubeArchivistClient;
  detail: ChannelDetail | null;
  isError: boolean;
  isLoaded: boolean;
};

function useChannelDetailResource({ channelId, client }: UseChannelDetailResourceParams) {
  const [detailState, setDetailState] = useState<ChannelDetailState>({
    channelId,
    client,
    detail: null,
    isError: false,
    isLoaded: false,
  });

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

  const isCurrentDetailState = detailState.channelId === channelId && detailState.client === client;
  const detail = isCurrentDetailState ? detailState.detail : null;
  const isDetailError = isCurrentDetailState ? detailState.isError : false;
  const isDetailLoading = !isCurrentDetailState || !detailState.isLoaded;

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      try {
        const response = await client.fetchChannelDetail(channelId);
        if (!isMounted) {
          return;
        }
        setDetailState({
          channelId,
          client,
          detail: response,
          isError: false,
          isLoaded: true,
        });
      } catch {
        if (!isMounted) {
          return;
        }
        setDetailState({
          channelId,
          client,
          detail: null,
          isError: true,
          isLoaded: true,
        });
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
