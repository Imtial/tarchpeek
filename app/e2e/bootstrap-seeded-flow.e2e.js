describe('Seeded Android smoke flow', () => {
  const serverUrl = process.env.E2E_TA_URL ?? 'http://10.0.2.2:8000';
  const apiToken = process.env.E2E_TA_TOKEN ?? '';

  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
    });
  });

  it('connects, opens first video, and exits player', async () => {
    if (!apiToken) {
      throw new Error('E2E_TA_TOKEN is required. Export token before running e2e:test:android.');
    }

    await waitFor(element(by.id('connect-screen'))).toBeVisible().withTimeout(60000);
    await element(by.id('connect-server-url-input')).replaceText(serverUrl);
    await element(by.id('connect-api-token-input')).replaceText(apiToken);

    await waitFor(element(by.id('video-card-first'))).toBeVisible().withTimeout(120000);
    await element(by.id('video-card-first')).tap();

    await waitFor(element(by.id('player-screen'))).toBeVisible().withTimeout(120000);
    await device.pressBack();

    await waitFor(element(by.id('video-card-first'))).toBeVisible().withTimeout(120000);
  });
});
