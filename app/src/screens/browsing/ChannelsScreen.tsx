import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import { BrowsingScreenShell } from './BrowsingScreenShell';

function ChannelsScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <BrowsingScreenShell subtitle="Browse channels as first-class navigation objects." title="Channels">
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        Channel list and channel detail routes will be added in the next Phase 03 units.
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

export { ChannelsScreen };
