import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  TextInput,
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

const SERVER_URL_KEY = 'serverUrl';
const API_TOKEN_KEY = 'apiToken';
const storage = createAsyncStorage('tarchpeek');

type FieldName = 'serverUrl' | 'apiToken' | null;

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
  const [serverUrl, setServerUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<FieldName>(null);
  const [statusMessage, setStatusMessage] = useState('Enter a TubeArchivist server and API token.');

  useEffect(() => {
    let isMounted = true;

    async function hydrateConnection() {
      try {
        const [storedServerUrl, storedApiToken] = await Promise.all([
          storage.getItem(SERVER_URL_KEY),
          storage.getItem(API_TOKEN_KEY),
        ]);

        if (!isMounted) {
          return;
        }

        if (storedServerUrl) {
          setServerUrl(storedServerUrl);
        }

        if (storedApiToken) {
          setApiToken(storedApiToken);
        }

        if (storedServerUrl || storedApiToken) {
          setStatusMessage('Loaded saved server settings for this device.');
        }
      } catch {
        if (isMounted) {
          setStatusMessage('Could not load saved settings on this device.');
        }
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }

    hydrateConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveConnection() {
    const normalizedServerUrl = serverUrl.trim().replace(/\/$/, '');
    const normalizedApiToken = apiToken.trim();

    if (!normalizedServerUrl || !normalizedApiToken) {
      setStatusMessage('Server URL and API token are both required.');
      return;
    }

    setIsSaving(true);
    setStatusMessage('Saving connection...');

    try {
      await Promise.all([
        storage.setItem(SERVER_URL_KEY, normalizedServerUrl),
        storage.setItem(API_TOKEN_KEY, normalizedApiToken),
      ]);
      setServerUrl(normalizedServerUrl);
      setApiToken(normalizedApiToken);
      setStatusMessage('Saved locally. Playback validation can use this connection next.');
    } catch {
      setStatusMessage('Saving failed. Check local storage availability and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}>
      <View style={styles.content}>
        <Text
          style={[
            styles.eyebrow,
            isDarkMode ? styles.textMutedDark : styles.textMutedLight,
          ]}>
          Phase 01 - Feasibility Spike
        </Text>
        <Text style={[styles.title, isDarkMode ? styles.textDark : styles.textLight]}>
          TarchPeek
        </Text>
        <Text
          style={[
            styles.body,
            styles.bodySpacing,
            isDarkMode ? styles.textMutedDark : styles.textMutedLight,
          ]}>
          Minimal Android and Android TV shell ready for TubeArchivist connection and playback experiments.
        </Text>
        <View style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}>
          <Text style={[styles.label, isDarkMode ? styles.textDark : styles.textLight]}>
            Server URL
          </Text>
          <TextInput
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            editable={!isSaving}
            focusable
            hasTVPreferredFocus={isHydrating}
            keyboardType="url"
            onFocus={() => {
              setFocusedField('serverUrl');
            }}
            onBlur={() => {
              setFocusedField(currentField =>
                currentField === 'serverUrl' ? null : currentField,
              );
            }}
            onChangeText={setServerUrl}
            placeholder="https://archive.local"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            returnKeyType="next"
            selectTextOnFocus
            style={[
              styles.input,
              focusedField === 'serverUrl' ? styles.inputFocused : null,
              isDarkMode ? styles.inputDark : styles.inputLight,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
            value={serverUrl}
          />
          <Text style={[styles.label, isDarkMode ? styles.textDark : styles.textLight]}>
            API token
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSaving}
            focusable
            onFocus={() => {
              setFocusedField('apiToken');
            }}
            onBlur={() => {
              setFocusedField(currentField =>
                currentField === 'apiToken' ? null : currentField,
              );
            }}
            onChangeText={setApiToken}
            placeholder="Paste API token"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            returnKeyType="done"
            selectTextOnFocus
            secureTextEntry
            style={[
              styles.input,
              focusedField === 'apiToken' ? styles.inputFocused : null,
              isDarkMode ? styles.inputDark : styles.inputLight,
              isDarkMode ? styles.textDark : styles.textLight,
            ]}
            value={apiToken}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isSaving, disabled: isSaving }}
            disabled={isSaving}
            focusable
            onPress={saveConnection}
            style={({ pressed }) => [
              styles.button,
              isSaving ? styles.buttonDisabled : styles.buttonEnabled,
              pressed && !isSaving ? styles.buttonPressed : null,
            ]}>
            {isSaving ? (
              <ActivityIndicator color="#e2e8f0" />
            ) : (
              <Text style={styles.buttonText}>Save connection</Text>
            )}
          </Pressable>
          <Text
            style={[
              styles.status,
              isDarkMode ? styles.textMutedDark : styles.textMutedLight,
            ]}>
            {statusMessage}
          </Text>
        </View>
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
  bodySpacing: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    gap: 10,
    maxWidth: 520,
    padding: 20,
  },
  cardLight: {
    backgroundColor: '#ffffff',
  },
  cardDark: {
    backgroundColor: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  inputDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  inputFocused: {
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonEnabled: {
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    backgroundColor: '#64748b',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
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
