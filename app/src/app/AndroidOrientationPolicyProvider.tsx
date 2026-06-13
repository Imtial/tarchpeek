import { AppState, Platform, type AppStateStatus } from 'react-native';
import Orientation, {
  LANDSCAPE,
  OrientationLocker,
  PORTRAIT,
  UNLOCK,
} from 'react-native-orientation-locker';
import { type PropsWithChildren, createContext, use, useEffect, useMemo, useState } from 'react';

type FullscreenOrientationLock = 'portrait' | 'landscape';

type AndroidOrientationPolicyContextValue = {
  setOrientationOverride: (lock: FullscreenOrientationLock | null) => void;
};

const AndroidOrientationPolicyContext = createContext<AndroidOrientationPolicyContextValue | null>(
  null,
);

function AndroidOrientationPolicyProvider({ children }: PropsWithChildren) {
  const [orientationOverride, setOrientationOverride] = useState<FullscreenOrientationLock | null>(
    null,
  );
  const [isAutoRotateEnabled, setIsAutoRotateEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || Platform.isTV) {
      return;
    }

    let isActive = true;

    function syncAutoRotateState() {
      Orientation.getAutoRotateState((nextIsAutoRotateEnabled: boolean) => {
        if (!isActive) {
          return;
        }

        setIsAutoRotateEnabled(nextIsAutoRotateEnabled);
      });
    }

    function handleAppStateChange(nextAppState: AppStateStatus) {
      if (nextAppState === 'active') {
        syncAutoRotateState();
      }
    }

    syncAutoRotateState();
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isActive = false;
      appStateSubscription.remove();
    };
  }, []);

  const orientation = Platform.isTV
    ? LANDSCAPE
    : orientationOverride === 'landscape'
      ? LANDSCAPE
      : orientationOverride === 'portrait'
        ? PORTRAIT
        : isAutoRotateEnabled
          ? UNLOCK
          : PORTRAIT;
  const contextValue = useMemo(() => ({ setOrientationOverride }), [setOrientationOverride]);

  return (
    <AndroidOrientationPolicyContext.Provider value={contextValue}>
      <OrientationLocker orientation={orientation} />
      {children}
    </AndroidOrientationPolicyContext.Provider>
  );
}

type AndroidOrientationOverrideProps = {
  enabled: boolean;
  orientation: FullscreenOrientationLock | null;
};

function AndroidOrientationOverride({ enabled, orientation }: AndroidOrientationOverrideProps) {
  const context = use(AndroidOrientationPolicyContext);

  useEffect(() => {
    if (!context || Platform.OS !== 'android') {
      return;
    }

    context.setOrientationOverride(enabled ? orientation : null);

    return () => {
      context.setOrientationOverride(null);
    };
  }, [context, enabled, orientation]);

  return null;
}

export { AndroidOrientationOverride, AndroidOrientationPolicyProvider };
