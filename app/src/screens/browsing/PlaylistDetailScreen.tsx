import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import type { ContinueWatchingItem, PlaylistDetail, TubeArchivistClient } from '../../services/tubeArchivist';
import { spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';
import { VideoResultsList } from './VideoResultsList';

type PlaylistDetailScreenProps = {
  playlistId: string;
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string) => Promise<void>;
};

function PlaylistDetailScreen({ playlistId, client, onOpenVideo }: PlaylistDetailScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [detail, setDetail] = useState<PlaylistDetail | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      try {
        const response = await client.fetchPlaylistDetail(playlistId);
        if (!isMounted) {
          return;
        }
        setDetail(response);
      } catch {
        if (!isMounted) {
          return;
        }
        setDetail(null);
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [client, playlistId]);

  function renderHeader() {
    return (
      <View>
        {detail?.thumbnailUrl ? (
          <Image source={{ uri: detail.thumbnailUrl }} style={styles.banner} />
        ) : (
          <View style={[styles.banner, { backgroundColor: colors.surfacePressed }]} />
        )}
        <View style={styles.metadataSection}>
          <View style={styles.channelRow}>
            {detail?.channelLogoUrl ? (
              <Image source={{ uri: detail.channelLogoUrl }} style={styles.channelLogo} />
            ) : (
              <View style={[styles.channelLogo, { backgroundColor: colors.surfacePressed }]} />
            )}
            <Text numberOfLines={2} style={[styles.channelName, { color: colors.textSecondary }]}>
              {detail?.channelName ?? 'Unknown channel'}
            </Text>
          </View>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {`${detail?.videoCount.toLocaleString() ?? 0} videos`}
          </Text>
          <Text style={[styles.playlistTitle, { color: colors.textPrimary }]}>
            {detail?.playlistName ?? 'Playlist'}
          </Text>
        </View>
      </View>
    );
  }

  const entryItems: ContinueWatchingItem[] = (detail?.entries ?? []).map(entry => ({
    videoId: entry.videoId,
    title: entry.title,
    published: '',
    channelName: entry.channelName,
    channelLogoUrl: entry.channelLogoUrl,
    viewCount: entry.viewCount,
    watched: entry.watched,
    thumbnailUrl: entry.thumbnailUrl,
    resumePositionSeconds: entry.resumePositionSeconds,
    durationSeconds: entry.durationSeconds,
    durationLabel: entry.durationLabel,
  }));

  return (
    <BrowsingScreenShell subtitle="" title={detail?.playlistName ?? 'Playlist'}>
      {renderHeader()}
      <VideoResultsList isLoading={!detail} items={entryItems} loadingCount={5} onOpenVideo={onOpenVideo} />
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    aspectRatio: 16 / 5,
    borderRadius: 0,
    width: '100%',
  },
  metadataSection: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  channelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  channelLogo: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  channelName: {
    flex: 1,
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});

export { PlaylistDetailScreen };
