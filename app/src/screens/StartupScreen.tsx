import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../design/ThemeProvider';
import { spacing } from '../design/tokens';

function StartupScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.pageBackground }]}
      testID="startup-screen"
    >
      <View style={styles.content}>
        <Image source={require('../../assets/tarchpeek.png')} style={styles.logo} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>TarchPeek</Text>
        <ActivityIndicator color={colors.textPrimary} size="large" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logo: {
    height: 72,
    width: 72,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
  },
});

export { StartupScreen };
