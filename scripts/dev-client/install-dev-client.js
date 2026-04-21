const { spawnSync } = require("node:child_process");

const DEV_CLIENT_SPEC = "expo-dev-client@~55.0.27";

function isDevClientInstalled() {
  try {
    require.resolve("expo-dev-client/package.json", { paths: [process.cwd()] });
    return true;
  } catch {
    return false;
  }
}

function installDevClient() {
  if (isDevClientInstalled()) {
    console.log("expo-dev-client is already available in node_modules.");
    return;
  }

  const npmCommand = "npm";
  const result = spawnSync(
    npmCommand,
    ["install", DEV_CLIENT_SPEC, "--no-save", "--package-lock=false", "--legacy-peer-deps"],
    {
      cwd: process.cwd(),
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    }
  );

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (require.main === module) {
  installDevClient();
}

module.exports = { installDevClient };
