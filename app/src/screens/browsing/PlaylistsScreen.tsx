import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import { BrowsingScreenShell } from './BrowsingScreenShell';

function PlaylistsScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <BrowsingScreenShell subtitle="Browse playlists with explicit entry into playlist details." title="Playlists">
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        Playlist list and playlist detail routes will be added in the next Phase 03 units.
      </Text>
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export { PlaylistsScreen };
