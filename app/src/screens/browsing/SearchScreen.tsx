import { useReducer, useState } from 'react';
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
  onOpenVideo: (
    videoId: string,
    queueContext?: { videoIds: string[]; currentIndex: number },
  ) => Promise<void>;
  onOpenChannel: (channelId: string) => void;
  onOpenPlaylist: (playlistId: string) => void;
};

type SearchState = {
  channelResults: SearchChannelResult[];
  isError: boolean;
  isLoading: boolean;
  playlistResults: SearchPlaylistResult[];
  queryInput: string;
  results: SearchVideoResult[];
  submittedQuery: string;
};

type SearchAction =
  | { type: 'query_changed'; queryInput: string }
  | { type: 'search_started'; submittedQuery: string }
  | {
      type: 'search_succeeded';
      channelResults: SearchChannelResult[];
      playlistResults: SearchPlaylistResult[];
      results: SearchVideoResult[];
    }
  | { type: 'search_failed' };

const INITIAL_SEARCH_STATE: SearchState = {
  channelResults: [],
  isError: false,
  isLoading: false,
  playlistResults: [],
  queryInput: '',
  results: [],
  submittedQuery: '',
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'query_changed':
      return {
        ...state,
        queryInput: action.queryInput,
      };
    case 'search_started':
      return {
        ...state,
        isError: false,
        isLoading: true,
        submittedQuery: action.submittedQuery,
      };
    case 'search_succeeded':
      return {
        ...state,
        channelResults: action.channelResults,
        isError: false,
        isLoading: false,
        playlistResults: action.playlistResults,
        results: action.results,
      };
    case 'search_failed':
      return {
        ...state,
        channelResults: [],
        isError: true,
        isLoading: false,
        playlistResults: [],
        results: [],
      };
  }
}

function SearchScreen({ client, onOpenChannel, onOpenPlaylist, onOpenVideo }: SearchScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [searchState, dispatch] = useReducer(searchReducer, INITIAL_SEARCH_STATE);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const {
    channelResults,
    isError,
    isLoading,
    playlistResults,
    queryInput,
    results,
    submittedQuery,
  } = searchState;

  async function submitSearch() {
    const query = queryInput.trim();
    if (!query || isLoading) {
      return;
    }
    Keyboard.dismiss();
    dispatch({ type: 'search_started', submittedQuery: query });
    try {
      const response = await client.searchArchive(query);
      dispatch({
        type: 'search_succeeded',
        channelResults: response.channelResults,
        playlistResults: response.playlistResults,
        results: response.videoResults,
      });
    } catch {
      dispatch({ type: 'search_failed' });
    }
  }

  const hasSubmittedQuery = submittedQuery.length > 0;
  const hasAnyResults =
    results.length > 0 || channelResults.length > 0 || playlistResults.length > 0;

  return (
    <BrowsingScreenShell subtitle="" testID="search-screen" title="Search">
      <View style={styles.formWrap}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={nextQueryInput => {
            dispatch({ type: 'query_changed', queryInput: nextQueryInput });
          }}
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
          testID="search-submit-button"
        >
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
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>No results found.</Text>
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
              style={({ pressed }) => [
                styles.groupRow,
                { borderColor: colors.border },
                pressed ? styles.pressed : null,
              ]}
            >
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
              style={({ pressed }) => [
                styles.groupRow,
                { borderColor: colors.border },
                pressed ? styles.pressed : null,
              ]}
            >
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
