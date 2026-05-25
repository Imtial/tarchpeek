import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import type { ChannelDetail, TubeArchivistClient } from '../../services/tubeArchivist';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';

type ChannelDetailScreenProps = {
  channelId: string;
  client: TubeArchivistClient;
};

function ChannelDetailScreen({ channelId, client }: ChannelDetailScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [detail, setDetail] = useState<ChannelDetail | null>(null);

  useEffect(() => {
    let isMounted = true;
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
        setDetail(null);
      }
    }
    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [channelId, client]);

  return (
    <BrowsingScreenShell subtitle="" testID="channel-detail-screen" title={detail?.channelName ?? 'Channel'}>
      {detail?.thumbnailUrl ? (
        <Image source={{ uri: detail.thumbnailUrl }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, { backgroundColor: colors.surfacePressed }]} />
      )}
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {`${detail?.subscriberCount.toLocaleString() ?? 0} subscribers`}
      </Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {detail?.subscribed ? 'Subscribed' : 'Not subscribed'}
      </Text>
      <Text style={[styles.description, { color: colors.textPrimary }]}>
        {detail?.description ?? 'No description available.'}
      </Text>
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
  meta: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

export { ChannelDetailScreen };
