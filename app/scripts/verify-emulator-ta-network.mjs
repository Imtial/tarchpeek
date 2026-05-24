import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const authConfigPath = process.env.TA_AUTH_CONFIG_FILE ?? resolve(appRoot, 'e2e/.runtime/tubearchivist-auth.json');
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

function emulatorUrlFor(baseUrl) {
  const parsed = new URL(baseUrl);
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
    parsed.hostname = '10.0.2.2';
  }
  parsed.pathname = '/api/video/';
  parsed.search = '?page=1&type=videos&watch=continue';
  return parsed;
}

function requestUrlFor(url) {
  const parsed = new URL(url);
  if (parsed.hostname === '10.0.2.2') {
    parsed.hostname = 'localhost';
  }
  return parsed;
}

function runEmulatorHttpCheck(url, apiToken) {
  if (url.protocol !== 'http:') {
    fail(`[emu-net-check] Unsupported protocol ${url.protocol}. Use an HTTP reverse proxy endpoint for emulator checks.`);
  }

  const requestUrl = requestUrlFor(url);
  const hostHeader = `${url.hostname}:${url.port || '80'}`;
  const result = spawnSync(
    'curl',
    [
      '--silent',
      '--show-error',
      '--include',
      '--header',
      `Host: ${hostHeader}`,
      '--header',
      `Authorization: Token ${apiToken}`,
      '--header',
      'Accept: application/json',
      requestUrl.toString(),
    ],
    {
    cwd: appRoot,
    encoding: 'utf-8',
    },
  );

  if (result.status !== 0) {
    fail(`[emu-net-check] curl request failed: ${result.stderr || result.stdout}`);
  }

  const firstLine = result.stdout.split('\n').map(line => line.trim()).find(Boolean) ?? '';
  if (!firstLine.startsWith('HTTP/')) {
    fail(`[emu-net-check] Unexpected response from emulator network check: ${firstLine || '<empty>'}`);
  }

  const statusCode = Number(firstLine.split(' ')[1] ?? 0);
  if (statusCode < 200 || statusCode >= 300) {
    fail(`[emu-net-check] Emulator request failed with ${firstLine}`);
  }

  console.log(`[emu-net-check] Passed with ${firstLine}`);
}

const auth = loadAuthConfig();
const emuUrl = emulatorUrlFor(auth.baseUrl);
console.log(`[emu-net-check] Checking ${emuUrl.toString()}`);
runEmulatorHttpCheck(emuUrl, auth.apiToken);
