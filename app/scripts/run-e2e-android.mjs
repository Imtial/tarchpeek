import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const authConfigPath = process.env.TA_AUTH_CONFIG_FILE ?? resolve(appRoot, 'e2e/.runtime/tubearchivist-auth.json');
const emulatorNetworkCheckScriptPath = resolve(scriptDir, 'verify-emulator-ta-network.mjs');
const detoxConfig = process.argv[2] ?? 'android.emu.debug';
const healthPollMs = Number(process.env.TA_E2E_HEALTH_POLL_MS ?? 3000);
const healthPollAttempts = Number(process.env.TA_E2E_HEALTH_ATTEMPTS ?? 40);
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadAuthConfig() {
  if (!existsSync(authConfigPath)) {
    fail(
      `Missing auth config at ${authConfigPath}. Run npm --prefix app run ta:seed:bootstrap first to seed and persist the token.`,
    );
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

async function verifyToken({ baseUrl, apiToken }) {
  for (let attempt = 1; attempt <= healthPollAttempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/video/?page=1`, {
        headers: { Authorization: `Token ${apiToken}` },
      });

      if (response.ok) {
        return;
      }

      const detail = await response.text();
      if (response.status === 401 || response.status === 403) {
        fail(`Persisted token is not accepted (HTTP ${response.status}). Re-run ta:seed:bootstrap. Detail: ${detail}`);
      }
    } catch {
      // service may still be booting
    }

    await new Promise(resolvePromise => {
      setTimeout(resolvePromise, healthPollMs);
    });
  }

  fail(`TubeArchivist API did not become reachable at ${baseUrl}.`);
}

function runDetox(env) {
  const result = spawnSync('npx', ['detox', 'test', '-c', detoxConfig, '--cleanup'], {
    cwd: appRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
    },
    shell: process.platform === 'win32',
  });

  process.exit(result.status ?? 1);
}

function verifyEmulatorNetwork() {
  const result = spawnSync(process.execPath, [emulatorNetworkCheckScriptPath], {
    cwd: appRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      TA_AUTH_CONFIG_FILE: authConfigPath,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function normalizeBaseUrlForEmulator(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    if (LOOPBACK_HOSTS.has(parsed.hostname)) {
      parsed.hostname = '10.0.2.2';
      return parsed.toString().replace(/\/$/, '');
    }
  } catch {
    // keep original value; verifyToken handles invalid URL failures
  }

  return baseUrl;
}

const auth = loadAuthConfig();
await verifyToken(auth);
verifyEmulatorNetwork();
runDetox({
  E2E_TA_URL: normalizeBaseUrlForEmulator(auth.baseUrl),
  E2E_TA_TOKEN: auth.apiToken,
});
