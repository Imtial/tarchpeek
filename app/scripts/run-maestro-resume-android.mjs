import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { prepareResumeTarget, verifyResumePreserved } from './maestro-resume-target.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const authConfigPath = process.env.TA_AUTH_CONFIG_FILE ?? resolve(appRoot, 'maestro/.runtime/tubearchivist-auth.json');
const emulatorNetworkCheckScriptPath = resolve(scriptDir, 'verify-emulator-ta-network.mjs');
const maestroBinaryPath = process.env.MAESTRO_PATH ?? resolve(process.env.HOME ?? '', '.maestro/bin/maestro');
const maestroApkPath = resolve(appRoot, 'android/app/build/outputs/apk/maestro/app-maestro.apk');
const adbPath = process.env.ADB_PATH ?? `${process.env.HOME}/Library/Android/sdk/platform-tools/adb`;
const maestroFlowPath = resolve(appRoot, 'maestro/scenarios/resume-playback.yaml');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function verifyMaestroInstalled() {
  const result = spawnSync(maestroBinaryPath, ['--version'], {
    cwd: appRoot,
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    fail(
      `Maestro CLI is not installed at ${maestroBinaryPath}. Install it with \`curl -fsSL "https://get.maestro.mobile.dev" | bash\` or \`brew install mobile-dev-inc/tap/maestro\`.`,
    );
  }
}

function verifyMaestroApkBuilt() {
  if (!existsSync(maestroApkPath)) {
    fail(`Maestro APK not found at ${maestroApkPath}. Run npm --prefix app run e2e:build:android first.`);
  }
}

function installMaestroApk() {
  const result = spawnSync(adbPath, ['install', '-r', '-t', maestroApkPath], {
    cwd: appRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
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
  const parsed = new URL(baseUrl);
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
    parsed.hostname = '10.0.2.2';
  }
  return parsed.toString().replace(/\/$/, '');
}

function runMaestro(env) {
  const result = spawnSync(
    maestroBinaryPath,
    [
      'test',
      maestroFlowPath,
      '-e',
      `E2E_TA_URL=${env.E2E_TA_URL}`,
      '-e',
      `E2E_TA_TOKEN=${env.E2E_TA_TOKEN}`,
      '-e',
      `E2E_RESUME_VIDEO_CARD_ID=${env.E2E_RESUME_VIDEO_CARD_ID}`,
    ],
    {
      cwd: appRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...env,
      },
    },
  );

  return result.status ?? 1;
}

verifyMaestroInstalled();
verifyMaestroApkBuilt();
installMaestroApk();
verifyEmulatorNetwork();

const prepared = await prepareResumeTarget(authConfigPath);
const env = {
  E2E_RESUME_VIDEO_CARD_ID: prepared.videoCardId,
  E2E_TA_TOKEN: prepared.apiToken,
  E2E_TA_URL: normalizeBaseUrlForEmulator(prepared.baseUrl),
};

const maestroExitCode = runMaestro(env);
if (maestroExitCode !== 0) {
  process.exit(maestroExitCode);
}

const confirmedSeconds = await verifyResumePreserved(
  prepared.baseUrl,
  prepared.apiToken,
  prepared.videoId,
  prepared.resumeTargetSeconds,
);
console.log(
  `[resume-check] Passed for ${prepared.videoId} with stored position ${confirmedSeconds}s (target ${prepared.resumeTargetSeconds}s).`,
);
