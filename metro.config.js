const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Disable Watchman to avoid permission issues
  watchFolders: [],
  resolver: {
    // Disable symlink resolution which can cause issues
    enableSymlinks: false,
  },
  // Use polling instead of native file watching
  watchman: {
    deferStates: [],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
