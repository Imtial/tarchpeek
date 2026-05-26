import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import type {
  SearchChannelResult,
  SearchPlaylistResult,
  SearchVideoResult,
  TubeArchivistClient,
} from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { VideoResultsList } from './VideoResultsList';

type SearchScreenProps = {
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string, queueContext?: { videoIds: string[]; currentIndex: number }) => Promise<void>;
  onOpenChannel: (channelId: string) => void;
  onOpenPlaylist: (playlistId: string) => void;
};

function SearchScreen({ client, onOpenChannel, onOpenPlaylist, onOpenVideo }: SearchScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [queryInput, setQueryInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchVideoResult[]>([]);
  const [channelResults, setChannelResults] = useState<SearchChannelResult[]>([]);
  const [playlistResults, setPlaylistResults] = useState<SearchPlaylistResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  async function submitSearch() {
    const query = queryInput.trim();
    if (!query || isLoading) {
      return;
    }
    Keyboard.dismiss();
    setSubmittedQuery(query);
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await client.searchArchive(query);
      setResults(response.videoResults);
      setChannelResults(response.channelResults);
      setPlaylistResults(response.playlistResults);
    } catch {
      setResults([]);
      setChannelResults([]);
      setPlaylistResults([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }

  const hasSubmittedQuery = submittedQuery.length > 0;
  const hasAnyResults = results.length > 0 || channelResults.length > 0 || playlistResults.length > 0;

  return (
    <BrowsingScreenShell subtitle="" testID="search-screen" title="Search">
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
          testID="search-query-input"
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
          ]}
          testID="search-submit-button">
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

      {hasSubmittedQuery && !isLoading && !isError && !hasAnyResults ? (
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          No results found.
        </Text>
      ) : null}
      {channelResults.length > 0 ? (
        <View style={styles.groupWrap}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Channels</Text>
          {channelResults.map(result => (
            <Pressable
              accessibilityRole="button"
              key={result.channelId}
              onPress={() => {
                onOpenChannel(result.channelId);
              }}
              style={({ pressed }) => [styles.groupRow, { borderColor: colors.border }, pressed ? styles.pressed : null]}>
              <Text numberOfLines={1} style={[styles.groupName, { color: colors.textPrimary }]}>
                {result.channelName}
              </Text>
              <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>
                {`${result.subscriberCount.toLocaleString()} subs`}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {playlistResults.length > 0 ? (
        <View style={styles.groupWrap}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Playlists</Text>
          {playlistResults.map(result => (
            <Pressable
              accessibilityRole="button"
              key={result.playlistId}
              onPress={() => {
                onOpenPlaylist(result.playlistId);
              }}
              style={({ pressed }) => [styles.groupRow, { borderColor: colors.border }, pressed ? styles.pressed : null]}>
              <Text numberOfLines={1} style={[styles.groupName, { color: colors.textPrimary }]}>
                {result.playlistName}
              </Text>
              <Text numberOfLines={1} style={[styles.groupMeta, { color: colors.textSecondary }]}>
                {`${result.videoCount.toLocaleString()} videos`}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.resultsWrap}>
        <VideoResultsList
          isLoading={false}
          items={results}
          loadingCount={0}
          onOpenVideo={onOpenVideo}
        />
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
  groupWrap: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  groupRow: {
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '700',
  },
  groupMeta: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  resultsWrap: {
    flex: 1,
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
});

export { SearchScreen };
