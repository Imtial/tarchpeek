import {
  StyleSheet,
  StatusBar,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppContentController } from './src/app/useAppContentController';
import { ThemeProvider, useTheme } from './src/design/ThemeProvider';
import { BrowsingTabs } from './src/navigation/BrowsingTabs';
import { ConnectScreen } from './src/screens/ConnectScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';

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
    focusedField,
    hasConnection,
    isHydrating,
    isSaving,
    openVideoById,
    saveConnection,
    serverUrl,
    setApiToken,
    setFocusedField,
    setServerUrl,
    statusMessage,
    videoDetails,
  } = useAppContentController();

  if (videoDetails) {
    if (!hasConnection) {
      return (
        <PlayerScreen
          client={client}
          key={videoDetails.videoId}
          onBack={closePlayer}
          videoDetails={videoDetails}
        />
      );
    }
  }

  if (hasConnection) {
    return (
      <View style={styles.connectedRoot}>
        <BrowsingTabs browseRefreshKey={browseRefreshKey} client={client} onOpenVideo={openVideoById} />
        {videoDetails ? (
          <View style={styles.playerOverlay}>
            <PlayerScreen client={client} key={videoDetails.videoId} onBack={closePlayer} videoDetails={videoDetails} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ConnectScreen
      apiToken={apiToken}
      focusedField={focusedField}
      isHydrating={isHydrating}
      isSaving={isSaving}
      onApiTokenChange={setApiToken}
      onBlurField={field => {
        setFocusedField(currentField => (currentField === field ? null : currentField));
      }}
      onFocusField={setFocusedField}
      onSaveConnection={saveConnection}
      onServerUrlChange={setServerUrl}
      serverUrl={serverUrl}
      statusMessage={statusMessage}
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
