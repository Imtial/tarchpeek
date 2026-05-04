import { type ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';
import { radii, spacing } from '../../design/tokens';

type BrowsingScreenShellProps = {
  title: string;
  subtitle: string;
  children?: ReactNode;
  useScrollView?: boolean;
};

function BrowsingScreenShell({
  children,
  subtitle,
  title,
  useScrollView = true,
}: BrowsingScreenShellProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const header = (
    <>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      <View
        style={[
          styles.bodyCard,
          { backgroundColor: colors.surfaceBackground },
          !useScrollView ? styles.bodyCardFill : null,
        ]}>
        {children}
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
      {useScrollView ? (
        <ScrollView contentContainerStyle={styles.content}>{header}</ScrollView>
      ) : (
        <View style={[styles.content, styles.contentFill]}>{header}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bodyCard: {
    borderRadius: radii.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  bodyCardFill: {
    flex: 1,
    minHeight: 0,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  contentFill: {
    flex: 1,
    minHeight: 0,
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
