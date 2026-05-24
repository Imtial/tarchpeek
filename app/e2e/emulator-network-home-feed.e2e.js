describe('Emulator localhost network to TubeArchivist', () => {
  const serverUrl = process.env.E2E_TA_URL ?? 'http://10.0.2.2:8000';
  const apiToken = process.env.E2E_TA_TOKEN ?? '';
  const TEST_TIMEOUT_MS = 70000;
  const CONNECT_SCREEN_TIMEOUT_MS = 15000;
  const CONNECT_DISMISS_TIMEOUT_MS = 20000;
  const HOME_CARD_TIMEOUT_MS = 45000;

  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
    });
  });

  it(
    'connects and loads first home video card',
    async () => {
      if (!apiToken) {
        throw new Error('E2E_TA_TOKEN is required. Export token before running e2e:test:android.');
      }

      await waitFor(element(by.id('connect-screen'))).toBeVisible().withTimeout(CONNECT_SCREEN_TIMEOUT_MS);
      await element(by.id('connect-server-url-input')).replaceText(serverUrl);
      await element(by.id('connect-api-token-input')).replaceText(apiToken);
      await waitFor(element(by.id('connect-screen'))).not.toExist().withTimeout(CONNECT_DISMISS_TIMEOUT_MS);
      await waitFor(element(by.id('video-card-first'))).toBeVisible().withTimeout(HOME_CARD_TIMEOUT_MS);
    },
    TEST_TIMEOUT_MS,
  );
});
