import { query } from "./_generated/server";
import { findCurrentUser } from "./lib/devIdentity";
import { getDetailedNutrientTargets } from "../lib/domain/nutrients";
import { resolveEffectiveTargets } from "../lib/domain/targets";

export const getContext = query({
  args: {},
  handler: async (ctx) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return null;
    }

    return {
      detailedNutritionTargets: getDetailedNutrientTargets({
        age: user.age,
        sex: user.sex,
        targetFiber: user.targetFiber,
      }),
      macroTargets: resolveEffectiveTargets(user),
    };
  },
});
