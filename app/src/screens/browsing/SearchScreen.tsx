import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import { BrowsingScreenShell } from './BrowsingScreenShell';

function SearchScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <BrowsingScreenShell subtitle="Explicit search only. No recommendation-driven discovery." title="Search">
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        Search input and result list routes will be added in the next Phase 03 units.
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

export { SearchScreen };
