module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];
  const hasDevClientPlugin = plugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === "expo-dev-client" : plugin === "expo-dev-client"
  );

  // Production builds must not include dev-client modules. Development builds
  // need the plugin so the APK registers the Expo dev launcher scheme.
  if (process.env.EAS_BUILD_PROFILE === "development" && !hasDevClientPlugin) {
    plugins.push([
      "expo-dev-client",
      {
        launchMode: "launcher",
      },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};
