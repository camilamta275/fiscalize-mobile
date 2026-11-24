// Created by AI.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Updated by AI.
module.exports = withNativeWind(config, {
  input: './global.css',
  configPath: './tailwind.config.ts',
});
