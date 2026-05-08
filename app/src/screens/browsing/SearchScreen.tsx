import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import type { SearchVideoResult, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';

type SearchScreenProps = {
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string) => Promise<void>;
};

function SearchScreen({ client, onOpenVideo }: SearchScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [queryInput, setQueryInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchVideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  async function submitSearch() {
    const query = queryInput.trim();
    if (!query || isLoading) {
      return;
    }
    setSubmittedQuery(query);
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await client.searchArchive(query);
      setResults(response.videoResults);
    } catch {
      setResults([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpenVideo(videoId: string) {
    setActiveVideoId(videoId);
    try {
      await onOpenVideo(videoId);
    } finally {
      setActiveVideoId(null);
    }
  }

  function renderResultCard(item: SearchVideoResult) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={activeVideoId === item.videoId}
        key={item.videoId}
        onBlur={() => {
          setFocusedElementId(current => (current === item.videoId ? null : current));
        }}
        onFocus={() => {
          setFocusedElementId(item.videoId);
        }}
        onPress={() => {
          handleOpenVideo(item.videoId).catch(() => {
            setActiveVideoId(null);
          });
        }}
        style={({ pressed }) => [
          styles.resultCard,
          { borderColor: focusedElementId === item.videoId ? colors.accent : colors.border },
          pressed ? styles.pressed : null,
        ]}>
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnailImage} />
        </View>
        <Text numberOfLines={1} style={[styles.videoTitle, { color: colors.textPrimary }]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.videoMeta, { color: colors.textSecondary }]}>
          {item.channelName}
        </Text>
      </Pressable>
    );
  }

  const hasSubmittedQuery = submittedQuery.length > 0;

  return (
    <BrowsingScreenShell subtitle="" title="Search">
      <View style={styles.formWrap}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQueryInput}
          onSubmitEditing={() => {
            submitSearch().catch(() => undefined);
          }}
          placeholder="Search your archive"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surfacePressed,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          value={queryInput}
        />
        <Pressable
          accessibilityRole="button"
          disabled={isLoading || !queryInput.trim()}
          onBlur={() => {
            setFocusedElementId(current => (current === 'search-submit' ? null : current));
          }}
          onFocus={() => {
            setFocusedElementId('search-submit');
          }}
          onPress={() => {
            submitSearch().catch(() => undefined);
          }}
          style={({ pressed }) => [
            styles.searchButton,
            {
              backgroundColor:
                isLoading || !queryInput.trim()
                  ? colors.buttonDisabledBackground
                  : colors.buttonSecondaryBackground,
            },
            focusedElementId === 'search-submit' ? styles.focused : null,
            pressed && !isLoading && queryInput.trim() ? styles.pressed : null,
          ]}>
          <Text style={[styles.searchButtonLabel, { color: colors.buttonLabel }]}>
            {isLoading ? 'Searching...' : 'Search'}
          </Text>
        </Pressable>
      </View>

      {isError ? (
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          Search failed. Try again.
        </Text>
      ) : null}

      {hasSubmittedQuery && !isLoading && !isError && results.length === 0 ? (
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          No video results found.
        </Text>
      ) : null}

      {!hasSubmittedQuery && !isLoading && !isError ? (
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          Submit a query to search videos.
        </Text>
      ) : null}

      <View style={styles.resultsWrap}>
        {results.map(item => renderResultCard(item))}
      </View>
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  formWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  focused: {
    transform: [{ scale: 1.02 }],
  },
  resultCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  resultsWrap: {
    paddingBottom: spacing.sm,
  },
  searchButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  searchButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  searchInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  stateText: {
    fontSize: 13,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  thumbnailImage: {
    aspectRatio: 16 / 9,
    width: '100%',
  },
  thumbnailWrap: {
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  videoMeta: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export { SearchScreen };
