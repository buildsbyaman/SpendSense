const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

const customEnhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (metroMiddleware, server) => {
  if (customEnhanceMiddleware) {
    metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
  }
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    metroMiddleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
