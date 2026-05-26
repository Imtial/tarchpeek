import { useCallback, useEffect, useRef, useState } from 'react';

type PagedResponse<TItem> = {
  items: TItem[];
  currentPage: number;
  hasNextPage: boolean;
};

type UsePagedResourceParams<TItem> = {
  fetchPage: (page: number) => Promise<PagedResponse<TItem>>;
  reloadKey: unknown;
  mergeItems?: (currentItems: TItem[], nextPageItems: TItem[]) => TItem[];
  shouldKeepItemsDuringReload?: boolean;
};

function usePagedResource<TItem>({
  fetchPage,
  mergeItems = (_, nextPageItems) => nextPageItems,
  reloadKey,
  shouldKeepItemsDuringReload = false,
}: UsePagedResourceParams<TItem>) {
  const [items, setItems] = useState<TItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isError, setIsError] = useState(false);
  const isMountedRef = useRef(true);

  const loadFirstPage = useCallback(async () => {
    if (!shouldKeepItemsDuringReload) {
      setIsLoading(true);
    }

    try {
      setIsError(false);
      const firstPage = await fetchPage(1);
      if (!isMountedRef.current) {
        return;
      }
      setItems(mergeItems([], firstPage.items));
      setPage(firstPage.currentPage);
      setHasNextPage(firstPage.hasNextPage);
    } catch {
      if (!isMountedRef.current) {
        return;
      }
      setIsError(true);
      setItems([]);
      setPage(1);
      setHasNextPage(false);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchPage, mergeItems, shouldKeepItemsDuringReload]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasNextPage) {
      return;
    }

    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      setIsError(false);
      const response = await fetchPage(nextPage);
      if (!isMountedRef.current) {
        return;
      }
      setItems(currentItems => mergeItems(currentItems, response.items));
      setPage(response.currentPage);
      setHasNextPage(response.hasNextPage);
    } catch {
      if (isMountedRef.current) {
        setIsError(true);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [fetchPage, hasNextPage, isLoadingMore, mergeItems, page]);

  useEffect(() => {
    isMountedRef.current = true;
    loadFirstPage().catch(() => undefined);
    return () => {
      isMountedRef.current = false;
    };
  }, [loadFirstPage, reloadKey]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasNextPage,
    isError,
    loadMore,
    reload: loadFirstPage,
  };
}

export { usePagedResource };
export type { PagedResponse };
