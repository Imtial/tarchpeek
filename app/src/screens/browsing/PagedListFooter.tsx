import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../design/ThemeProvider';
import { radii, spacing } from '../../design/tokens';

type PagedListFooterProps = {
  mode: 'load_more' | 'end_indicator';
  isLoadingMore?: boolean;
  isLoadMoreEnabled?: boolean;
  onLoadMore?: () => Promise<void>;
  align?: 'center' | 'start';
};

function PagedListFooter({
  align = 'center',
  isLoadingMore = false,
  isLoadMoreEnabled = false,
  mode,
  onLoadMore,
}: PagedListFooterProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [isFocused, setIsFocused] = useState(false);

  if (mode === 'end_indicator') {
    return (
      <View style={styles.endOfListWrap}>
        <View style={[styles.endOfListLine, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!isLoadMoreEnabled || isLoadingMore || !onLoadMore}
      onBlur={() => {
        setIsFocused(false);
      }}
      onFocus={() => {
        setIsFocused(true);
      }}
      onPress={() => {
        onLoadMore?.().catch(() => undefined);
      }}
      style={({ pressed }) => [
        styles.loadMoreButton,
        align === 'start' ? styles.loadMoreButtonStart : null,
        {
          backgroundColor:
            isLoadMoreEnabled && !isLoadingMore
              ? colors.buttonSecondaryBackground
              : colors.buttonDisabledBackground,
        },
        isFocused ? styles.buttonFocused : null,
        pressed && isLoadMoreEnabled && !isLoadingMore ? styles.buttonPressed : null,
      ]}>
      {isLoadingMore ? (
        <View style={[styles.loadingDot, { borderColor: colors.buttonLabel }]} />
      ) : (
        <MaterialCommunityIcons color={colors.buttonLabel} name="chevron-down" size={20} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.92,
  },
  buttonFocused: {
    transform: [{ scale: 1.02 }],
  },
  endOfListWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingBottom: spacing.md,
  },
  endOfListLine: {
    borderRadius: 999,
    height: 5,
    width: 64,
  },
  loadingDot: {
    borderRadius: 999,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  loadMoreButton: {
    alignSelf: 'center',
    borderRadius: radii.md,
    height: 36,
    justifyContent: 'center',
    marginTop: spacing.md,
    width: 40,
  },
  loadMoreButtonStart: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
});

export { PagedListFooter };
