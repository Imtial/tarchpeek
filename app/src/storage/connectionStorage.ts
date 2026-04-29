import { createAsyncStorage } from '@react-native-async-storage/async-storage';

const SERVER_URL_KEY = 'serverUrl';
const API_TOKEN_KEY = 'apiToken';
const VIDEO_INPUT_KEY = 'testVideoInput';

const storage = createAsyncStorage('tarchpeek');

type StoredConnection = {
  serverUrl: string;
  apiToken: string;
  testVideoInput: string;
};

function normalizeStoredConnection(connection: StoredConnection): StoredConnection {
  const trimmedServerUrl = connection.serverUrl.trim();
  const normalizedServerUrl = trimmedServerUrl ? new URL(trimmedServerUrl).toString() : '';

  return {
    serverUrl: normalizedServerUrl,
    apiToken: connection.apiToken.trim(),
    testVideoInput: connection.testVideoInput.trim(),
  };
}

async function loadStoredConnection(): Promise<StoredConnection> {
  const [serverUrl, apiToken, testVideoInput] = await Promise.all([
    storage.getItem(SERVER_URL_KEY),
    storage.getItem(API_TOKEN_KEY),
    storage.getItem(VIDEO_INPUT_KEY),
  ]);

  return normalizeStoredConnection({
    serverUrl: serverUrl ?? '',
    apiToken: apiToken ?? '',
    testVideoInput: testVideoInput ?? '',
  });
}

async function saveStoredConnection(connection: StoredConnection): Promise<void> {
  const normalizedConnection = normalizeStoredConnection(connection);

  await Promise.all([
    storage.setItem(SERVER_URL_KEY, normalizedConnection.serverUrl),
    storage.setItem(API_TOKEN_KEY, normalizedConnection.apiToken),
    storage.setItem(VIDEO_INPUT_KEY, normalizedConnection.testVideoInput),
  ]);
}

export { loadStoredConnection, saveStoredConnection };
export type { StoredConnection };
