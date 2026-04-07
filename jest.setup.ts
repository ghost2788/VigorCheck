// @ts-nocheck

jest.mock("react-native/src/private/animated/NativeAnimatedHelper");

jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock"));

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");

  Reanimated.default.call = () => {};

  return Reanimated;
});

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-secure-store", () => ({
  getItem: jest.fn(() => null),
  getItemAsync: jest.fn(async () => null),
  setItem: jest.fn(),
  setItemAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-web-browser", () => ({
  coolDownAsync: jest.fn(async () => undefined),
  maybeCompleteAuthSession: jest.fn(),
  warmUpAsync: jest.fn(async () => undefined),
}));

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    addCustomerInfoUpdateListener: jest.fn(),
    configure: jest.fn(),
    getCustomerInfo: jest.fn(async () => ({
      activeSubscriptions: [],
      allExpirationDates: {},
      allPurchaseDates: {},
      allPurchasedProductIdentifiers: [],
      entitlements: { active: {}, all: {}, verification: "NOT_REQUESTED" },
      firstSeen: "",
      latestExpirationDate: null,
      managementURL: null,
      nonSubscriptionTransactions: [],
      originalAppUserId: "",
      originalApplicationVersion: null,
      originalPurchaseDate: null,
      requestDate: "",
      subscriptionsByProductIdentifier: {},
    })),
    getOfferings: jest.fn(async () => ({ all: {}, current: null })),
    isConfigured: jest.fn(async () => false),
    logIn: jest.fn(async () => ({ created: false, customerInfo: null })),
    purchasePackage: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
    restorePurchases: jest.fn(async () => ({
      activeSubscriptions: [],
      allExpirationDates: {},
      allPurchaseDates: {},
      allPurchasedProductIdentifiers: [],
      entitlements: { active: {}, all: {}, verification: "NOT_REQUESTED" },
      firstSeen: "",
      latestExpirationDate: null,
      managementURL: null,
      nonSubscriptionTransactions: [],
      originalAppUserId: "",
      originalApplicationVersion: null,
      originalPurchaseDate: null,
      requestDate: "",
      subscriptionsByProductIdentifier: {},
    })),
    setLogLevel: jest.fn(),
    showManageSubscriptions: jest.fn(async () => undefined),
    trackCustomPaywallImpression: jest.fn(async () => undefined),
  },
  LOG_LEVEL: {
    DEBUG: "DEBUG",
  },
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
    }),
  };
});

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockSvg = ({ children, ...props }) => React.createElement(View, props, children);

  return {
    __esModule: true,
    default: MockSvg,
    Circle: MockSvg,
    ClipPath: MockSvg,
    Defs: MockSvg,
    G: MockSvg,
    LinearGradient: MockSvg,
    Line: MockSvg,
    Path: MockSvg,
    RadialGradient: MockSvg,
    Rect: MockSvg,
    Stop: MockSvg,
  };
});

jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    __esModule: true,
    default: ({ name, ...props }) => React.createElement(Text, props, name),
  };
});
