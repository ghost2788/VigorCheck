import { v } from "convex/values";
import { internalQuery, mutation } from "./_generated/server";
import { starterUsdaFoods } from "../lib/data/starterUsdaFoods";

export const seedStarterCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    let updated = 0;

    for (const food of starterUsdaFoods) {
      const existing = await ctx.db
        .query("usdaFoods")
        .withIndex("by_fdc_id", (query) => query.eq("fdcId", food.fdcId))
        .unique();

      const payload = {
        b12Per100g: food.per100g.b12,
        b6Per100g: food.per100g.b6,
        calciumPer100g: food.per100g.calcium,
        caloriesPer100g: food.per100g.calories,
        carbsPer100g: food.per100g.carbs,
        category: food.category,
        fatPer100g: food.per100g.fat,
        fdcId: food.fdcId,
        fiberPer100g: food.per100g.fiber,
        folatePer100g: food.per100g.folate,
        ironPer100g: food.per100g.iron,
        magnesiumPer100g: food.per100g.magnesium,
        name: food.name,
        niacinPer100g: food.per100g.niacin,
        phosphorusPer100g: food.per100g.phosphorus,
        potassiumPer100g: food.per100g.potassium,
        proteinPer100g: food.per100g.protein,
        riboflavinPer100g: food.per100g.riboflavin,
        sodiumPer100g: food.per100g.sodium,
        sugarPer100g: food.per100g.sugar,
        thiaminPer100g: food.per100g.thiamin,
        vitaminAPer100g: food.per100g.vitaminA,
        vitaminCPer100g: food.per100g.vitaminC,
        vitaminDPer100g: food.per100g.vitaminD,
        vitaminEPer100g: food.per100g.vitaminE,
        vitaminKPer100g: food.per100g.vitaminK,
        zincPer100g: food.per100g.zinc,
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
        updated += 1;
      } else {
        await ctx.db.insert("usdaFoods", payload);
        inserted += 1;
      }
    }

    return {
      inserted,
      total: starterUsdaFoods.length,
      updated,
    };
  },
});

export const searchByName = internalQuery({
  args: {
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const term = args.term.trim();

    if (!term) {
      return [];
    }

    return ctx.db
      .query("usdaFoods")
      .withSearchIndex("by_name", (query) => query.search("name", term))
      .take(8);
  },
});
