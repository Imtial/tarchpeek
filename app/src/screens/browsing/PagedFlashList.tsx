import { FlashList } from '@shopify/flash-list';
import { type ReactElement, useCallback } from 'react';
import { PagedListFooter } from './PagedListFooter';

type PagedFlashListProps<TItem> = {
  data: TItem[];
  drawDistance?: number;
  footerAlign?: 'center' | 'start';
  hasNextPage: boolean;
  isLoadingMore: boolean;
  keyExtractor: (item: TItem) => string;
  onLoadMore?: () => Promise<void>;
  renderItem: (info: { item: TItem; index: number }) => ReactElement | null;
  testID?: string;
};

function PagedFlashList<TItem>({
  data,
  drawDistance,
  footerAlign = 'center',
  hasNextPage,
  isLoadingMore,
  keyExtractor,
  onLoadMore,
  renderItem,
  testID,
}: PagedFlashListProps<TItem>) {
  const shouldShowFooter = Boolean(onLoadMore) && data.length > 0;
  const footerMode = hasNextPage || isLoadingMore ? 'load_more' : 'end_indicator';

  const handleEndReached = useCallback(() => {
    if (onLoadMore && hasNextPage && !isLoadingMore) {
      onLoadMore().catch(() => undefined);
    }
  }, [hasNextPage, isLoadingMore, onLoadMore]);
  const renderFlashListItem = useCallback(
    ({ item, index }: { item: TItem; index: number }) => renderItem({ item, index }),
    [renderItem],
  );

  return (
    <FlashList
      data={data}
      drawDistance={drawDistance}
      keyExtractor={keyExtractor}
      ListFooterComponent={
        shouldShowFooter ? (
          <PagedListFooter
            align={footerAlign}
            isLoadingMore={isLoadingMore}
            isLoadMoreEnabled={hasNextPage}
            mode={footerMode}
            onLoadMore={onLoadMore}
          />
        ) : null
      }
      maintainVisibleContentPosition={{ disabled: true }}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.65}
      removeClippedSubviews
      renderItem={renderFlashListItem}
      showsVerticalScrollIndicator={false}
      testID={testID}
    />
  );
}

export { PagedFlashList };
