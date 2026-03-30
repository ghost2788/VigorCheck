import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async () => {
    return {
      connected: true,
      checkedAt: Date.now(),
      environment: "development",
    };
  },
});
