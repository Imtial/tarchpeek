import Orientation from 'react-native-orientation-locker';

type FullscreenOrientation = 'portrait' | 'landscape';

function getFullscreenOrientationLock(streamWidth?: number, streamHeight?: number): FullscreenOrientation | null {
  if (!streamWidth || !streamHeight) {
    return null;
  }

  if (streamWidth > streamHeight) {
    return 'landscape';
  }

  if (streamHeight > streamWidth) {
    return 'portrait';
  }

  return null;
}

function lockFullscreenOrientation(lock: FullscreenOrientation | null) {
  if (!lock) {
    return;
  }

  if (lock === 'portrait') {
    Orientation.lockToPortrait();
    return;
  }

  Orientation.lockToLandscape();
}

function unlockFullscreenOrientation() {
  Orientation.unlockAllOrientations();
}

export { getFullscreenOrientationLock, lockFullscreenOrientation, unlockFullscreenOrientation };
