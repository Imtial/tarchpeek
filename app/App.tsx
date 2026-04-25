import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>
          Phase 01 - Feasibility Spike
        </Text>
        <Text style={[styles.title, isDarkMode ? styles.textDark : styles.textLight]}>
          TarchPeek
        </Text>
        <Text style={[styles.body, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>
          Minimal Android and Android TV shell ready for server connection and playback experiments.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#f5f7fb',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 16,
  },
  body: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 480,
  },
  textLight: {
    color: '#0f172a',
  },
  textDark: {
    color: '#e2e8f0',
  },
  textMutedLight: {
    color: '#475569',
  },
  textMutedDark: {
    color: '#94a3b8',
  },
});

export default App;
