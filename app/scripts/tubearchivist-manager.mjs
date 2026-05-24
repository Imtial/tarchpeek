import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..', '..');

const command = process.argv[2];
const composeFile = process.env.COMPOSE_FILE ?? resolve(repoRoot, 'project/fixtures/tubearchivist-compose.yml');
const projectName = process.env.PROJECT_NAME ?? 'tarchpeek';
const taVolumes = (process.env.TA_VOLUMES ?? '').trim();
const taBaseUrl = (process.env.TA_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const taUsername = process.env.TA_USERNAME ?? 'tarchpeek';
const taPassword = process.env.TA_PASSWORD ?? 'tarchpeek-local';
const taApiToken = (process.env.TA_API_TOKEN ?? '').trim();
const seedFilePath = process.env.TA_SEED_FILE ?? resolve(repoRoot, 'project/fixtures/tubearchivist-seed-videos.txt');
const taAuthConfigPath =
  process.env.TA_AUTH_CONFIG_FILE ?? resolve(repoRoot, 'app/maestro/.runtime/tubearchivist-auth.json');
const bootPollIntervalMs = Number(process.env.TA_BOOTSTRAP_POLL_MS ?? 5000);
const bootPollAttempts = Number(process.env.TA_BOOTSTRAP_ATTEMPTS ?? 120);
const seedStuckWindowMs = Number(process.env.TA_SEED_STUCK_WINDOW_MS ?? 120000);

function run(cmd, args, options) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if ((result.status ?? 1) !== 0 && !options?.allowFailure) {
    process.exit(result.status ?? 1);
  }
}

function volumeExists(volumeName) {
  const result = spawnSync('docker', ['volume', 'inspect', volumeName], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  return (result.status ?? 1) === 0;
}

function requireVolumes() {
  if (!taVolumes) {
    console.error(
      "TA_VOLUMES is required. Example: TA_VOLUMES='tarchpeek_ta_media tarchpeek_ta_cache tarchpeek_ta_redis tarchpeek_ta_es'",
    );
    process.exit(1);
  }
  return taVolumes.split(/\s+/).filter(Boolean);
}

function requireComposeFile() {
  if (!existsSync(composeFile)) {
    console.error(`Compose file not found: ${composeFile}`);
    console.error('Set COMPOSE_FILE to your TubeArchivist docker compose path.');
    process.exit(1);
  }
}

function copyVolume(from, to) {
  run('docker', [
    'run',
    '--rm',
    '-v',
    `${from}:/from`,
    '-v',
    `${to}:/to`,
    'alpine:3.20',
    'sh',
    '-c',
    'cd /from && cp -a . /to',
  ]);
}

function captureSeed() {
  const volumes = requireVolumes();
  for (const volume of volumes) {
    const seedVolume = `${volume}_seed`;
    console.log(`Capturing ${volume} -> ${seedVolume}`);
    run('docker', ['volume', 'rm', '-f', seedVolume], { allowFailure: true });
    run('docker', ['volume', 'create', seedVolume]);
    copyVolume(volume, seedVolume);
  }
  console.log('Seed capture complete.');
}

function resetAndStart() {
  requireComposeFile();
  const volumes = requireVolumes();
  console.log('Stopping stack if running...');
  run('docker', ['compose', '-p', projectName, '-f', composeFile, 'down'], { allowFailure: true });

  for (const volume of volumes) {
    const seedVolume = `${volume}_seed`;
    console.log(`Restoring ${volume} from ${seedVolume}`);
    if (!volumeExists(seedVolume)) {
      console.error(`Missing seed volume: ${seedVolume}`);
      console.error('Run ta:seed:capture after initial seeding to create *_seed volumes.');
      process.exit(1);
    }
    run('docker', ['volume', 'rm', '-f', volume], { allowFailure: true });
    run('docker', ['volume', 'create', volume]);
    copyVolume(seedVolume, volume);
  }

  console.log('Starting stack from deterministic seed state...');
  run('docker', ['compose', '-p', projectName, '-f', composeFile, 'up', '-d']);
}

function stopStack() {
  requireComposeFile();
  run('docker', ['compose', '-p', projectName, '-f', composeFile, 'down']);
}

function startStack() {
  requireComposeFile();
  run('docker', ['compose', '-p', projectName, '-f', composeFile, 'up', '-d']);
}

function sleep(ms) {
  return new Promise(resolvePromise => {
    setTimeout(resolvePromise, ms);
  });
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let json = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!response.ok) {
    const detail = typeof json === 'string' ? json : JSON.stringify(json);
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}: ${detail}`);
  }

  return json;
}

async function waitForHealth() {
  for (let attempt = 1; attempt <= bootPollAttempts; attempt += 1) {
    try {
      await fetchJson(`${taBaseUrl}/api/health/`);
      console.log('TubeArchivist health endpoint is ready.');
      return;
    } catch {
      process.stdout.write(`Waiting for TubeArchivist health (${attempt}/${bootPollAttempts})...\r`);
      await sleep(bootPollIntervalMs);
    }
  }

  throw new Error('TubeArchivist did not become healthy in time.');
}

function readSeedUrls() {
  if (!existsSync(seedFilePath)) {
    throw new Error(`Seed file not found: ${seedFilePath}`);
  }

  return readFileSync(seedFilePath, 'utf-8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

function extractYouTubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace(/^\//, '').trim();
    }

    const queryId = parsed.searchParams.get('v');
    if (queryId) {
      return queryId.trim();
    }

    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts.at(-1)?.trim() ?? '';
  } catch {
    return '';
  }
}

function getUniqueSeedVideoIds(urls) {
  return [...new Set(urls.map(extractYouTubeId).filter(Boolean))];
}

function parseAuthCookies(loginResponse) {
  const getSetCookie = loginResponse.headers.getSetCookie;
  const rawSetCookies =
    typeof getSetCookie === 'function'
      ? getSetCookie.call(loginResponse.headers)
      : (() => {
          const merged = loginResponse.headers.get('set-cookie');
          return merged ? [merged] : [];
        })();

  if (!rawSetCookies.length) {
    return null;
  }

  const cookiePairs = rawSetCookies.map(rawCookie => rawCookie.split(';', 1)[0]?.trim()).filter(Boolean);
  if (!cookiePairs.length) {
    return null;
  }

  return cookiePairs.join('; ');
}

async function getApiToken() {
  if (taApiToken) {
    return taApiToken;
  }

  const loginResponse = await fetch(`${taBaseUrl}/api/user/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: taUsername, password: taPassword }),
  });

  if (!loginResponse.ok) {
    const detail = await loginResponse.text();
    throw new Error(`Login failed: HTTP ${loginResponse.status} ${detail}`);
  }

  const authCookies = parseAuthCookies(loginResponse);
  if (!authCookies) {
    throw new Error('Login succeeded but no session cookie was returned.');
  }

  const tokenResponse = await fetchJson(`${taBaseUrl}/api/appsettings/token/`, {
    headers: { Cookie: authCookies },
  });
  const token = tokenResponse?.token;
  if (!token) {
    throw new Error('Token response did not include token value.');
  }

  return token;
}

async function enqueueSeeds(token, urls) {
  const payload = {
    data: urls.map(url => ({ youtube_id: url, status: 'pending' })),
  };

  await fetchJson(`${taBaseUrl}/api/download/?autostart=true`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function waitForQueueToDrain(token) {
  for (let attempt = 1; attempt <= bootPollAttempts; attempt += 1) {
    const pending = await fetchJson(`${taBaseUrl}/api/download/?filter=pending`, {
      headers: { Authorization: `Token ${token}` },
    });

    const pendingCount = pending?.data?.length ?? 0;
    if (pendingCount === 0) {
      console.log('Download queue is drained.');
      return;
    }

    process.stdout.write(
      `Waiting for download queue to drain (${pendingCount} pending, ${attempt}/${bootPollAttempts})...\r`,
    );
    await sleep(bootPollIntervalMs);
  }

  throw new Error('Download queue did not drain in time.');
}

async function runManualImport(token) {
  await fetchJson(`${taBaseUrl}/api/appsettings/manual-import/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ignore_error: true,
      prefer_local: true,
    }),
  });
}

async function fetchVideoTotalHits(token) {
  const response = await fetchJson(`${taBaseUrl}/api/video/?page=1`, {
    headers: { Authorization: `Token ${token}` },
  });

  return Number(response?.paginate?.total_hits ?? 0);
}

async function waitForSeededVideos(token, expectedMinimumTotal) {
  let lastCount = await fetchVideoTotalHits(token);
  let lastProgressAt = Date.now();

  if (lastCount >= expectedMinimumTotal) {
    console.log(`Seeded video target reached immediately (${lastCount}/${expectedMinimumTotal}).`);
    return { reachedTarget: true, currentCount: lastCount, expectedMinimumTotal };
  }

  for (let attempt = 1; attempt <= bootPollAttempts; attempt += 1) {
    await sleep(bootPollIntervalMs);
    const currentCount = await fetchVideoTotalHits(token);

    if (currentCount > lastCount) {
      lastCount = currentCount;
      lastProgressAt = Date.now();
    }

    if (currentCount >= expectedMinimumTotal) {
      console.log(`Seeded video target reached (${currentCount}/${expectedMinimumTotal}).`);
      return { reachedTarget: true, currentCount, expectedMinimumTotal };
    }

    const stuckMs = Date.now() - lastProgressAt;
    process.stdout.write(
      `Waiting for library growth (${currentCount}/${expectedMinimumTotal}, ${attempt}/${bootPollAttempts})...\r`,
    );

    if (stuckMs >= seedStuckWindowMs) {
      console.warn(
        `Seeding appears stuck: library count has not increased for ${Math.floor(stuckMs / 1000)}s (current ${currentCount}, expected ${expectedMinimumTotal}).`,
      );
      return { reachedTarget: false, currentCount, expectedMinimumTotal };
    }
  }

  return {
    reachedTarget: false,
    currentCount: await fetchVideoTotalHits(token),
    expectedMinimumTotal,
  };
}

async function persistAuthConfig(token) {
  const authConfigDir = dirname(taAuthConfigPath);
  mkdirSync(authConfigDir, { recursive: true });
  writeFileSync(
    taAuthConfigPath,
    JSON.stringify(
      {
        baseUrl: taBaseUrl,
        apiToken: token,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
    'utf-8',
  );
  console.log(`Persisted TubeArchivist auth config: ${taAuthConfigPath}`);
}

async function bootstrapSeed() {
  const volumes = requireVolumes();
  console.log('Starting stack for seed bootstrap...');
  startStack();
  console.log('Waiting for API health...');
  await waitForHealth();

  const urls = readSeedUrls();
  if (urls.length === 0) {
    throw new Error('Seed URL file has no entries.');
  }
  const uniqueSeedIds = getUniqueSeedVideoIds(urls);
  const expectedSeedCount = uniqueSeedIds.length;

  console.log(`Loaded ${urls.length} seed URLs (${expectedSeedCount} unique IDs).`);
  const token = await getApiToken();
  console.log('Acquired API token.');
  const baselineVideoCount = await fetchVideoTotalHits(token);
  const expectedMinimumTotal = baselineVideoCount + expectedSeedCount;
  await enqueueSeeds(token, urls);
  console.log('Seed URLs queued with autostart.');
  await waitForQueueToDrain(token);
  await runManualImport(token);
  console.log('Triggered manual import.');
  const seedResult = await waitForSeededVideos(token, expectedMinimumTotal);
  if (!seedResult.reachedTarget) {
    console.warn(
      `Proceeding after stalled seed progress (${seedResult.currentCount}/${seedResult.expectedMinimumTotal}).`,
    );
  }
  await persistAuthConfig(token);

  for (const volume of volumes) {
    const seedVolume = `${volume}_seed`;
    console.log(`Capturing ${volume} -> ${seedVolume}`);
    run('docker', ['volume', 'rm', '-f', seedVolume], { allowFailure: true });
    run('docker', ['volume', 'create', seedVolume]);
    copyVolume(volume, seedVolume);
  }

  console.log('Bootstrap complete. Deterministic seed volumes are ready.');
}

if (!command) {
  console.error('Usage: tubearchivist-manager.mjs <bootstrap-seed|capture-seed|reset-and-start|stop>');
  process.exit(1);
}

async function main() {
  if (command === 'bootstrap-seed') {
    await bootstrapSeed();
    return;
  }

  if (command === 'capture-seed') {
    captureSeed();
    return;
  }

  if (command === 'reset-and-start') {
    resetAndStart();
    return;
  }

  if (command === 'stop') {
    stopStack();
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
