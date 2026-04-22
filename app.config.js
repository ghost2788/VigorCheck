module.exports = ({ config }) => {
  const isDevelopmentBuild = process.env.EAS_BUILD_PROFILE === "development";
  const plugins = [...(config.plugins ?? [])];
  const hasDevClientPlugin = plugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === "expo-dev-client" : plugin === "expo-dev-client"
  );

  // Production builds must not include dev-client modules. Development builds
  // need the plugin so the APK registers the Expo dev launcher scheme.
  if (isDevelopmentBuild && !hasDevClientPlugin) {
    plugins.push([
      "expo-dev-client",
      {
        launchMode: "launcher",
      },
    ]);
  }

  return {
    ...config,
    name: isDevelopmentBuild ? "VigorCheck Dev" : config.name,
    android: {
      ...config.android,
      package: isDevelopmentBuild ? "com.vigorcheck.app.dev" : config.android?.package,
    },
    plugins,
  };
};
