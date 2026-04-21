import { isClientInternalTestingEnabled } from "../domain/internalTesting";

export function isInternalTestingToolsEnabled() {
  return isClientInternalTestingEnabled({
    explicitFlag: process.env.EXPO_PUBLIC_INTERNAL_TESTING_TOOLS_ENABLED,
    isDev: __DEV__,
  });
}
