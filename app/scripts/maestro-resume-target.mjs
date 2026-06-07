import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const redisContainerName = process.env.TA_REDIS_CONTAINER_NAME ?? 'tarchpeek-archivist-redis';

function loadAuthConfig(authConfigPath) {
  const parsed = JSON.parse(readFileSync(authConfigPath, 'utf-8'));
  const baseUrl =
    typeof parsed.baseUrl === 'string' ? parsed.baseUrl.trim().replace(/\/$/, '') : '';
  const apiToken = typeof parsed.apiToken === 'string' ? parsed.apiToken.trim() : '';

  if (!baseUrl || !apiToken) {
    throw new Error(`Auth config is missing baseUrl/apiToken: ${authConfigPath}`);
  }

  return { baseUrl, apiToken };
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}: ${text}`);
  }

  return json;
}

function authHeaders(apiToken) {
  return {
    Authorization: `Token ${apiToken}`,
    Accept: 'application/json',
  };
}

async function fetchVideoDetail(baseUrl, apiToken, videoId) {
  return fetchJson(`${baseUrl}/api/video/${videoId}/`, {
    headers: authHeaders(apiToken),
  });
}

async function fetchVideoList(baseUrl, apiToken, query) {
  const url = new URL('/api/video/', baseUrl);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  return fetchJson(url.toString(), {
    headers: authHeaders(apiToken),
  });
}

function computeResumeTargetSeconds(durationSeconds) {
  const boundedTarget = Math.min(15, durationSeconds - 8);
  return Math.max(12, boundedTarget);
}

function sortWatchedLast(items) {
  const unwatched = items.filter(item => !item.player?.watched);
  const watched = items.filter(item => item.player?.watched);
  return [...unwatched, ...watched];
}

async function resolveHomeCardId(baseUrl, apiToken, videoId) {
  const [continuePage, recentPage, unwatchedPage] = await Promise.all([
    fetchVideoList(baseUrl, apiToken, { page: 1, type: 'videos', watch: 'continue' }),
    fetchVideoList(baseUrl, apiToken, {
      page: 1,
      type: 'videos',
      sort: 'downloaded',
      order: 'desc',
    }),
    fetchVideoList(baseUrl, apiToken, {
      page: 1,
      type: 'videos',
      watch: 'unwatched',
      sort: 'published',
      order: 'desc',
    }),
  ]);

  const merged = [...continuePage.data, ...recentPage.data, ...unwatchedPage.data];
  const seenVideoIds = new Set();
  const uniqueItems = merged.filter(video => {
    if (seenVideoIds.has(video.youtube_id)) {
      return false;
    }

    seenVideoIds.add(video.youtube_id);
    return true;
  });
  const homeItems = sortWatchedLast(uniqueItems).slice(0, 20);
  const cardIndex = homeItems.findIndex(video => video.youtube_id === videoId);

  if (cardIndex < 0) {
    throw new Error(`Seeded resume candidate ${videoId} was not present in Home feed.`);
  }

  return cardIndex === 0 ? 'video-card-first' : `video-card-${videoId}`;
}

async function pickResumeCandidate(baseUrl, apiToken) {
  const recentPage = await fetchVideoList(baseUrl, apiToken, {
    page: 1,
    type: 'videos',
    sort: 'downloaded',
    order: 'desc',
  });

  const candidateIds = recentPage.data.map(video => video.youtube_id);

  for (const videoId of candidateIds) {
    const detail = await fetchVideoDetail(baseUrl, apiToken, videoId);
    const durationSeconds = Math.floor(detail.player?.duration ?? 0);

    if (durationSeconds >= 24) {
      return {
        durationSeconds,
        title: detail.title,
        videoId,
      };
    }
  }

  throw new Error('Could not find a seeded video with enough duration for resume validation.');
}

async function setResumeProgress(baseUrl, apiToken, videoId, positionSeconds) {
  return fetchJson(`${baseUrl}/api/video/${videoId}/progress/`, {
    method: 'POST',
    headers: {
      ...authHeaders(apiToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ position: positionSeconds }),
  });
}

function readRedisProgress(videoId) {
  const keyLookup = spawnSync(
    'docker',
    ['exec', redisContainerName, 'redis-cli', '--raw', 'KEYS', `ta:*:progress:${videoId}`],
    {
      encoding: 'utf-8',
    },
  );

  if (keyLookup.status !== 0) {
    throw new Error(
      `Failed to inspect Redis progress key for ${videoId}: ${keyLookup.stderr || keyLookup.stdout}`,
    );
  }

  const progressKey = keyLookup.stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean);

  if (!progressKey) {
    return null;
  }

  const valueLookup = spawnSync(
    'docker',
    ['exec', redisContainerName, 'redis-cli', '--raw', 'GET', progressKey],
    {
      encoding: 'utf-8',
    },
  );

  if (valueLookup.status !== 0) {
    throw new Error(
      `Failed to read Redis progress value for ${videoId}: ${valueLookup.stderr || valueLookup.stdout}`,
    );
  }

  const rawValue = valueLookup.stdout.trim();
  return rawValue ? JSON.parse(rawValue) : null;
}

async function waitForRedisPosition(videoId, minimumSeconds, attempts = 10) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const progress = readRedisProgress(videoId);
    const confirmedSeconds = Math.floor(progress?.position ?? 0);

    if (confirmedSeconds >= minimumSeconds) {
      return confirmedSeconds;
    }

    await new Promise(resolvePromise => {
      setTimeout(resolvePromise, 1000);
    });
  }

  return 0;
}

async function prepareResumeTarget(authConfigPath) {
  const auth = loadAuthConfig(authConfigPath);
  const candidate = await pickResumeCandidate(auth.baseUrl, auth.apiToken);
  const targetSeconds = computeResumeTargetSeconds(candidate.durationSeconds);

  await setResumeProgress(auth.baseUrl, auth.apiToken, candidate.videoId, targetSeconds);
  const confirmedSeconds = await waitForRedisPosition(candidate.videoId, targetSeconds - 2);

  if (confirmedSeconds < targetSeconds - 2) {
    throw new Error(
      `Failed to seed resume position for ${candidate.videoId}. Expected >= ${targetSeconds - 2}, got ${confirmedSeconds}.`,
    );
  }

  return {
    ...auth,
    resumeTargetSeconds: targetSeconds,
    videoCardId: await resolveHomeCardId(auth.baseUrl, auth.apiToken, candidate.videoId),
    videoId: candidate.videoId,
  };
}

async function verifyResumePreserved(baseUrl, apiToken, videoId, resumeTargetSeconds) {
  const confirmedSeconds = await waitForRedisPosition(videoId, resumeTargetSeconds - 2, 5);

  if (confirmedSeconds < resumeTargetSeconds - 2) {
    throw new Error(
      `Resume validation failed for ${videoId}. Expected post-run position >= ${resumeTargetSeconds - 2}, got ${confirmedSeconds}.`,
    );
  }

  return confirmedSeconds;
}

export { prepareResumeTarget, verifyResumePreserved };
