const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.resolver.unstable_enablePackageExports = true;

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'jspdf' || moduleName === 'jspdf/dist/jspdf.node.min.js') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/jspdf/dist/jspdf.es.min.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'html2canvas' || moduleName === 'canvg' || moduleName === 'dompurify') {
    return { type: 'empty' };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

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
