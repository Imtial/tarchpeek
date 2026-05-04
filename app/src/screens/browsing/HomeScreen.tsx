import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import { radii, spacing } from '../../design/tokens';
import { BrowsingScreenShell } from './BrowsingScreenShell';

const rails = ['Continue Watching', 'Recently Added', 'Unwatched'] as const;

function HomeScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <BrowsingScreenShell
      subtitle="Finite rails for intentional retrieval. Continue Watching always leads."
      title="Home">
      {rails.map(rail => (
        <View key={rail} style={[styles.railCard, { borderColor: colors.border }]}>
          <Text style={[styles.railTitle, { color: colors.textPrimary }]}>{rail}</Text>
          <Text style={[styles.railMeta, { color: colors.textSecondary }]}>
            Placeholder rail scaffold for Phase 03 route wiring.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.seeMoreButton,
              { backgroundColor: colors.buttonSecondaryBackground },
              pressed ? styles.buttonPressed : null,
            ]}>
            <Text style={[styles.seeMoreLabel, { color: colors.buttonLabel }]}>See more</Text>
          </Pressable>
        </View>
      ))}
    </BrowsingScreenShell>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.92,
  },
  railCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  railMeta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  railTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  seeMoreButton: {
    alignSelf: 'flex-start',
    borderRadius: radii.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  seeMoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export { HomeScreen };
