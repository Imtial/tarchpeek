import Orientation from 'react-native-orientation-locker';

type FullscreenOrientation = 'portrait' | 'landscape';
type RotationModeContext = {
  autoRotateEnabled: boolean;
  uiOrientation: string | null;
};

function getFullscreenOrientationLock(
  streamWidth?: number,
  streamHeight?: number,
): FullscreenOrientation | null {
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

function captureRotationModeContext(): Promise<RotationModeContext> {
  return new Promise(resolve => {
    Orientation.getAutoRotateState(autoRotateEnabled => {
      Orientation.getOrientation(uiOrientation => {
        resolve({ autoRotateEnabled, uiOrientation });
      });
    });
  });
}

function restoreOrientationAfterFullscreen(context: RotationModeContext | null) {
  if (!context || context.autoRotateEnabled) {
    Orientation.unlockAllOrientations();
    return;
  }

  switch (context.uiOrientation) {
    case 'LANDSCAPE-LEFT':
      Orientation.lockToLandscapeLeft();
      break;
    case 'LANDSCAPE-RIGHT':
      Orientation.lockToLandscapeRight();
      break;
    case 'PORTRAIT-UPSIDEDOWN':
      Orientation.lockToPortraitUpsideDown();
      break;
    case 'PORTRAIT':
    default:
      Orientation.lockToPortrait();
      break;
  }
}

export {
  captureRotationModeContext,
  getFullscreenOrientationLock,
  lockFullscreenOrientation,
  restoreOrientationAfterFullscreen,
  unlockFullscreenOrientation,
};
