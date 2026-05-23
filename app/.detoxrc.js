/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'android.detox': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/detox/app-detox.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/detox/app-detox-androidTest.apk',
      build:
        'cd android && ./gradlew assembleDetox assembleDetoxAndroidTest -DtestBuildType=detox && cd ..',
      reversePorts: [8081],
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7a_API_34',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: 'emulator-.*',
      },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.detox',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.detox',
    },
  },
};
