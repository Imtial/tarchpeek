import { StyleSheet, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppContentController } from './src/app/useAppContentController';
import { ThemeProvider, useTheme } from './src/design/ThemeProvider';
import { BrowsingTabs } from './src/navigation/BrowsingTabs';
import { ConnectScreen } from './src/screens/ConnectScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { StartupScreen } from './src/screens/StartupScreen';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar barStyle={theme.statusBarStyle} />
      <AppContent />
    </>
  );
}

function AppContent() {
  const {
    apiToken,
    browseRefreshKey,
    client,
    closePlayer,
    connectionError,
    connectionFieldErrors,
    connectionStatus,
    focusedField,
    hasConnection,
    isSaving,
    openVideoById,
    playNextInQueue,
    saveConnection,
    serverUrl,
    setApiToken,
    setFocusedField,
    setServerUrl,
    videoDetails,
  } = useAppContentController();

  if (connectionStatus === 'bootstrapping') {
    return <StartupScreen />;
  }

  return hasConnection ? (
    <View style={styles.connectedRoot}>
      <BrowsingTabs
        browseRefreshKey={browseRefreshKey}
        client={client}
        onOpenVideo={openVideoById}
      />
      {videoDetails ? (
        <View style={styles.playerOverlay}>
          <PlayerScreen
            client={client}
            key={videoDetails.videoId}
            onBack={closePlayer}
            onPlayNextInQueue={playNextInQueue}
            videoDetails={videoDetails}
          />
        </View>
      ) : null}
    </View>
  ) : (
    <ConnectScreen
      apiToken={apiToken}
      connectionError={connectionError}
      connectionFieldErrors={connectionFieldErrors}
      focusedField={focusedField}
      isSaving={isSaving}
      onApiTokenChange={value => {
        setApiToken(value);
      }}
      onBlurField={field => {
        setFocusedField(currentField => (currentField === field ? null : currentField));
      }}
      onFocusField={setFocusedField}
      onSaveConnection={saveConnection}
      onServerUrlChange={value => {
        setServerUrl(value);
      }}
      serverUrl={serverUrl}
    />
  );
}

const styles = StyleSheet.create({
  connectedRoot: {
    flex: 1,
  },
  playerOverlay: {
    ...StyleSheet.absoluteFill,
  },
});

export default App;
