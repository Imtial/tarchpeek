import { type ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import { radii, spacing } from '../../design/tokens';

type BrowsingScreenShellProps = {
  title: string;
  subtitle: string;
  children?: ReactNode;
};

function BrowsingScreenShell({ children, subtitle, title }: BrowsingScreenShellProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        <View style={[styles.bodyCard, { backgroundColor: colors.surfaceBackground }]}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bodyCard: {
    borderRadius: radii.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
});

export { BrowsingScreenShell };
