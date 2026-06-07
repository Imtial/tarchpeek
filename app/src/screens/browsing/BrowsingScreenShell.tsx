import { type ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../design/ThemeProvider';

type BrowsingScreenShellProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  testID?: string;
};

function BrowsingScreenShell({ children, testID }: BrowsingScreenShellProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.pageBackground }]}
      testID={testID}
    >
      <View style={styles.content}>
        <View style={[styles.bodyCard, { backgroundColor: colors.surfaceBackground }]}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bodyCard: {
    flex: 1,
    minHeight: 0,
    borderRadius: 0,
    marginTop: 0,
    padding: 0,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});

export { BrowsingScreenShell };
