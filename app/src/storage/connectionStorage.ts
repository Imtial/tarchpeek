import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { TARCHPEEK_CONSTANTS } from '../constants/tarchpeekConstants';

const SERVER_URL_KEY = TARCHPEEK_CONSTANTS.storageKeys.serverUrl;
const API_TOKEN_KEY = TARCHPEEK_CONSTANTS.storageKeys.apiToken;
const VIDEO_INPUT_KEY = TARCHPEEK_CONSTANTS.storageKeys.testVideoInput;

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
