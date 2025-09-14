module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        android: null, // disable autolinking for manual linking
        ios: null,
      },
    },
  },
  assets: ['./assets/fonts/'],
  project: {
    android: {
      sourceDir: 'android',
      appName: 'app',
    },
  },
};
