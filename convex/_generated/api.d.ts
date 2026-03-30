/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as dashboard from "../dashboard.js";
import type * as drinkShortcuts from "../drinkShortcuts.js";
import type * as hydration from "../hydration.js";
import type * as hydrationShortcuts from "../hydrationShortcuts.js";
import type * as lib_devIdentity from "../lib/devIdentity.js";
import type * as lib_validators from "../lib/validators.js";
import type * as meals from "../meals.js";
import type * as scanAnalysis from "../scanAnalysis.js";
import type * as scans from "../scans.js";
import type * as status from "../status.js";
import type * as textAnalysis from "../textAnalysis.js";
import type * as trends from "../trends.js";
import type * as usda from "../usda.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  dashboard: typeof dashboard;
  drinkShortcuts: typeof drinkShortcuts;
  hydration: typeof hydration;
  hydrationShortcuts: typeof hydrationShortcuts;
  "lib/devIdentity": typeof lib_devIdentity;
  "lib/validators": typeof lib_validators;
  meals: typeof meals;
  scanAnalysis: typeof scanAnalysis;
  scans: typeof scans;
  status: typeof status;
  textAnalysis: typeof textAnalysis;
  trends: typeof trends;
  usda: typeof usda;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
