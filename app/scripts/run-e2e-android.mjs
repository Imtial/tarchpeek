import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const authConfigPath = process.env.TA_AUTH_CONFIG_FILE ?? resolve(appRoot, 'e2e/.runtime/tubearchivist-auth.json');
const detoxConfig = process.argv[2] ?? 'android.emu.debug';

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
  const response = await fetch(`${baseUrl}/api/video/?page=1`, {
    headers: { Authorization: `Token ${apiToken}` },
  });

  if (!response.ok) {
    const detail = await response.text();
    fail(`Persisted token is not accepted (HTTP ${response.status}). Re-run ta:seed:bootstrap. Detail: ${detail}`);
  }
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

const auth = loadAuthConfig();
await verifyToken(auth);
runDetox({ E2E_TA_URL: auth.baseUrl, E2E_TA_TOKEN: auth.apiToken });
