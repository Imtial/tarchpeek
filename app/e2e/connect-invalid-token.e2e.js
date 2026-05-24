describe('Connect screen invalid token handling', () => {
  const serverUrl = process.env.E2E_TA_URL ?? 'http://10.0.2.2:8000';
  const validApiToken = process.env.E2E_TA_TOKEN ?? '';
  const TEST_TIMEOUT_MS = 45000;
  const CONNECT_SCREEN_TIMEOUT_MS = 15000;
  const ERROR_BANNER_TIMEOUT_MS = 15000;

  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
    });
  });

  it(
    'keeps connect screen visible and shows an error banner',
    async () => {
      if (!validApiToken) {
        throw new Error('E2E_TA_TOKEN is required. Export token before running e2e:test:android.');
      }

      const invalidToken = `${validApiToken}-invalid`;

      await waitFor(element(by.id('connect-screen'))).toBeVisible().withTimeout(CONNECT_SCREEN_TIMEOUT_MS);
      await element(by.id('connect-server-url-input')).replaceText(serverUrl);
      await element(by.id('connect-api-token-input')).replaceText(invalidToken);
      await element(by.id('connect-save-button')).tap();

      await waitFor(element(by.id('connect-error-banner'))).toBeVisible().withTimeout(ERROR_BANNER_TIMEOUT_MS);
      await expect(element(by.id('connect-screen'))).toBeVisible();
      await expect(element(by.id('video-card-first'))).not.toExist();
    },
    TEST_TIMEOUT_MS,
  );
});
