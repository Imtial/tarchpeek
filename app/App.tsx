import {
  StatusBar,
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
    client,
    closePlayer,
    focusedField,
    hasConnection,
    isHydrating,
    isLoadingVideo,
    isSaving,
    loadTestVideo,
    openVideoById,
    playbackStatus,
    saveConnection,
    serverUrl,
    setApiToken,
    setFocusedField,
    setServerUrl,
    setTestVideoInput,
    statusMessage,
    testVideoInput,
    videoDetails,
  } = useAppContentController();

  if (videoDetails) {
    return (
      <PlayerScreen
        client={client}
        key={videoDetails.videoId}
        onBack={closePlayer}
        videoDetails={videoDetails}
      />
    );
  }

  if (hasConnection) {
    return <BrowsingTabs client={client} onOpenVideo={openVideoById} />;
  }

  return (
    <ConnectScreen
      apiToken={apiToken}
      focusedField={focusedField}
      isHydrating={isHydrating}
      isLoadingVideo={isLoadingVideo}
      isSaving={isSaving}
      onApiTokenChange={setApiToken}
      onBlurField={field => {
        setFocusedField(currentField => (currentField === field ? null : currentField));
      }}
      onFocusField={setFocusedField}
      onLoadTestVideo={loadTestVideo}
      onSaveConnection={saveConnection}
      onServerUrlChange={setServerUrl}
      onTestVideoInputChange={setTestVideoInput}
      playbackStatus={playbackStatus}
      serverUrl={serverUrl}
      statusMessage={statusMessage}
      testVideoInput={testVideoInput}
    />
  );
}

export default App;
