import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const authConfigPath = process.env.TA_AUTH_CONFIG_FILE ?? resolve(appRoot, 'maestro/.runtime/tubearchivist-auth.json');
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadAuthConfig() {
  if (!existsSync(authConfigPath)) {
    fail(`Missing auth config at ${authConfigPath}. Run npm --prefix app run ta:seed:bootstrap first.`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(authConfigPath, 'utf-8'));
  } catch (error) {
    fail(`Failed to parse auth config ${authConfigPath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const baseUrl = typeof parsed.baseUrl === 'string' ? parsed.baseUrl.trim().replace(/\/$/, '') : '';
  const apiToken = typeof parsed.apiToken === 'string' ? parsed.apiToken.trim() : '';
  if (!baseUrl || !apiToken) {
    fail(`Auth config is missing baseUrl/apiToken: ${authConfigPath}`);
  }

  return { baseUrl, apiToken };
}

function emulatorHostHeader(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    if (LOOPBACK_HOSTS.has(parsed.hostname)) {
      return `10.0.2.2:${port}`;
    }
  } catch {
    // skip header override
  }

  return null;
}

async function fetchFeedSegment(baseUrl, apiToken, label, query, hostHeader) {
  const url = new URL('/api/video/', baseUrl);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Token ${apiToken}`,
      Accept: 'application/json',
      ...(hostHeader ? { Host: hostHeader } : {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    fail(`[home-feed-check] ${label} failed ${response.status} ${response.statusText} at ${url.toString()} :: ${detail}`);
  }

  let json;
  try {
    json = await response.json();
  } catch (error) {
    fail(`[home-feed-check] ${label} returned non-JSON payload at ${url.toString()}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const items = Array.isArray(json?.data) ? json.data.length : 0;
  console.log(`[home-feed-check] ${label} ok (${items} items)`);
  return items;
}

async function main() {
  const auth = loadAuthConfig();
  const hostHeader = emulatorHostHeader(auth.baseUrl);
  console.log(`[home-feed-check] Using ${auth.baseUrl}`);
  if (hostHeader) {
    console.log(`[home-feed-check] Emulating emulator Host header: ${hostHeader}`);
  }

  const checks = [
    ['continue', { page: 1, type: 'videos', watch: 'continue' }],
    ['recent', { page: 1, type: 'videos', sort: 'downloaded', order: 'desc' }],
    ['unwatched', { page: 1, type: 'videos', watch: 'unwatched', sort: 'published', order: 'desc' }],
  ];

  const counts = await Promise.all(
    checks.map(([label, query]) => fetchFeedSegment(auth.baseUrl, auth.apiToken, label, query, hostHeader)),
  );
  const total = counts.reduce((sum, count) => sum + count, 0);

  if (total < 1) {
    fail('[home-feed-check] API calls succeeded but returned no videos across home-feed segments.');
  }

  console.log(`[home-feed-check] passed with ${total} combined items`);
}

await main();
