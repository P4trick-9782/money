const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@craftzdog/react-native-buffer") {
    return context.resolveRequest(context, "buffer", platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
