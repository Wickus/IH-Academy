const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    alias: {
      '@': './src',
      '@assets': './app-store',
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);