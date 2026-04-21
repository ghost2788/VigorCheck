import { normalizeSupplementNutritionProfile, SupplementNutritionProfile } from "../domain/supplements";

export type StarterSupplement = {
  brand?: string;
  category: string;
  name: string;
  nutritionProfile: SupplementNutritionProfile;
  servingLabel: string;
};

function nutrition(values: SupplementNutritionProfile) {
  return normalizeSupplementNutritionProfile(values);
}

export const starterSupplements: StarterSupplement[] = [
  {
    category: "vitamin",
    name: "Vitamin D3",
    nutritionProfile: nutrition({
      vitaminD: 25,
    }),
    servingLabel: "1 softgel",
  },
  {
    category: "mineral",
    name: "Magnesium glycinate",
    nutritionProfile: nutrition({
      magnesium: 200,
    }),
    servingLabel: "2 capsules",
  },
  {
    category: "mineral",
    name: "Zinc",
    nutritionProfile: nutrition({
      zinc: 15,
    }),
    servingLabel: "1 capsule",
  },
  {
    category: "vitamin",
    name: "Vitamin C",
    nutritionProfile: nutrition({
      vitaminC: 500,
    }),
    servingLabel: "1 tablet",
  },
  {
    category: "vitamin",
    name: "Methyl B12",
    nutritionProfile: nutrition({
      b12: 1000,
    }),
    servingLabel: "1 lozenge",
  },
  {
    category: "omega",
    name: "Fish oil",
    nutritionProfile: nutrition({
      calories: 10,
      fat: 1,
      omega3: 1.2,
    }),
    servingLabel: "2 softgels",
  },
  {
    brand: "Whey",
    category: "protein",
    name: "Protein powder",
    nutritionProfile: nutrition({
      calories: 130,
      carbs: 4,
      calcium: 90,
      fat: 2,
      potassium: 120,
      protein: 25,
      sodium: 95,
      sugar: 2,
      vitaminD: 4,
    }),
    servingLabel: "1 scoop",
  },
  {
    category: "multivitamin",
    name: "Daily multivitamin",
    nutritionProfile: nutrition({
      b12: 2.4,
      calcium: 200,
      folate: 400,
      iron: 8,
      magnesium: 50,
      vitaminA: 900,
      vitaminC: 90,
      vitaminD: 15,
      vitaminE: 15,
      zinc: 11,
    }),
    servingLabel: "1 tablet",
  },
];
