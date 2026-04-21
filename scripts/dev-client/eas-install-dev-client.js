const { installDevClient } = require("./install-dev-client");

if (process.env.EAS_BUILD_PROFILE !== "development") {
  console.log("Skipping expo-dev-client install outside the EAS development profile.");
  process.exit(0);
}

installDevClient();
