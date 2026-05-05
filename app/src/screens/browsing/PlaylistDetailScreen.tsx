import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import type { PlaylistDetail, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';

type PlaylistDetailScreenProps = {
  playlistId: string;
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string) => Promise<void>;
};

function PlaylistDetailScreen({ playlistId, client, onOpenVideo }: PlaylistDetailScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [detail, setDetail] = useState<PlaylistDetail | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

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
  }, [playlistId, client]);

  async function handleOpenVideo(videoId: string) {
    setActiveVideoId(videoId);
    try {
      await onOpenVideo(videoId);
    } finally {
      setActiveVideoId(null);
    }
  }

  return (
    <BrowsingScreenShell subtitle="" title={detail?.playlistName ?? 'Playlist'}>
      {detail?.thumbnailUrl ? (
        <Image source={{ uri: detail.thumbnailUrl }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, { backgroundColor: colors.surfacePressed }]} />
      )}
      <Text numberOfLines={1} style={[styles.meta, { color: colors.textSecondary }]}>
        {detail?.channelName ?? 'Unknown channel'}
      </Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {`${detail?.videoCount.toLocaleString() ?? 0} videos`}
      </Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {detail?.subscribed ? 'Subscribed' : 'Not subscribed'}
      </Text>
      <Text style={[styles.description, { color: colors.textPrimary }]}>
        {detail?.description ?? 'No description available.'}
      </Text>

      <View style={styles.entriesSection}>
        {detail?.entries.map(entry => (
          <Pressable
            accessibilityRole="button"
            disabled={activeVideoId === entry.videoId}
            key={entry.videoId}
            onPress={() => {
              handleOpenVideo(entry.videoId).catch(() => {
                setActiveVideoId(null);
              });
            }}
            style={({ pressed }) => [
              styles.entryRow,
              { borderColor: colors.border },
              pressed ? styles.pressed : null,
            ]}>
            <View style={styles.entryTextWrap}>
              <Text numberOfLines={1} style={[styles.entryTitle, { color: colors.textPrimary }]}>
                {entry.title}
              </Text>
              <Text numberOfLines={1} style={[styles.entryMeta, { color: colors.textSecondary }]}>
                {entry.uploader ?? 'Unknown uploader'}
              </Text>
            </View>
            <Text style={[styles.entryMeta, { color: colors.textSecondary }]}>
              {entry.downloaded ? 'Downloaded' : 'Not downloaded'}
            </Text>
          </Pressable>
        ))}
      </View>
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    aspectRatio: 16 / 5,
    borderRadius: radii.md,
    width: '100%',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  entriesSection: {
    marginTop: spacing.md,
  },
  entryMeta: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  entryRow: {
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  entryTextWrap: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.92,
  },
});

export { PlaylistDetailScreen };
