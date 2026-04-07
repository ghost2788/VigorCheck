import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { api } from "../../convex/_generated/api";
import { render } from "../../lib/test-utils";
import SupplementsScreen from "../../app/supplements";

const mockPush = jest.fn();
const mockUseAction = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockPrepareSupplementPhoto = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: mockPush,
  }),
}));

jest.mock("convex/react", () => ({
  useAction: (...args: unknown[]) => mockUseAction(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../lib/supplements/prepareSupplementPhoto", () => ({
  prepareSupplementPhoto: (...args: unknown[]) => mockPrepareSupplementPhoto(...args),
}));

describe("SupplementsScreen", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUseAction.mockReset();
    mockUseMutation.mockReset();
    mockUseQuery.mockReset();
    mockPrepareSupplementPhoto.mockReset();
    mockPrepareSupplementPhoto.mockResolvedValue({
      base64: "front-base64",
      mimeType: "image/jpeg",
      uri: "file://front.jpg",
    });

    const ensureReadyMutation = jest.fn().mockResolvedValue(undefined);
    const createCustomSupplementMutation = jest.fn().mockResolvedValue(undefined);
    const updateStackItemMutation = jest.fn().mockResolvedValue(undefined);
    const saveScannedSupplementMutation = jest.fn().mockResolvedValue({
      alreadyLoggedToday: false,
    });
    const archiveStackItemMutation = jest.fn().mockResolvedValue(undefined);
    const analyzeSupplementAction = jest.fn().mockResolvedValue({
      activeIngredients: [{ name: "Iron", amount: 65, unit: "mg" }],
      brand: "Nature Made",
      displayName: "Iron 65 mg",
      frequency: "daily",
      nutritionProfile: { iron: 65 },
      overallConfidence: "high",
      servingLabel: "1 tablet",
    });

    mockUseAction.mockReturnValue(analyzeSupplementAction);

    mockUseMutation.mockImplementation((reference: unknown) => {
      if (reference === api.supplements.ensureReady) {
        return ensureReadyMutation;
      }

      if (reference === api.supplements.createCustomSupplement) {
        return createCustomSupplementMutation;
      }

      if (reference === api.supplements.updateStackItem) {
        return updateStackItemMutation;
      }

      if (reference === api.supplements.saveScannedSupplement) {
        return saveScannedSupplementMutation;
      }

      if (reference === api.supplements.archiveStackItem) {
        return archiveStackItemMutation;
      }

      return jest.fn();
    });

    let queryCall = 0;
    mockUseQuery.mockImplementation(() => {
      queryCall += 1;

      if (queryCall === 1) {
        return {
          archived: [],
          asNeeded: [
            {
              id: "supplement-2",
              isLoggedToday: false,
              label: "Protein powder",
              servingLabel: "1 scoop",
              status: "active",
            },
          ],
          daily: [
            {
              id: "supplement-1",
              isLoggedToday: true,
              label: "Vitamin D3",
              servingLabel: "1 softgel",
              status: "active",
            },
          ],
        };
      }

      return [];
    });
  });

  it("renders the supplement stack manager with daily and as-needed sections", () => {
    const { getByText, queryByPlaceholderText } = render(<SupplementsScreen />);

    expect(getByText("Manage supplements")).toBeTruthy();
    expect(getByText("Scan supplement")).toBeTruthy();
    expect(getByText("Create custom supplement")).toBeTruthy();
    expect(queryByPlaceholderText("Search supplements")).toBeNull();
    expect(getByText("Daily stack")).toBeTruthy();
    expect(getByText("Vitamin D3")).toBeTruthy();
    expect(getByText("As needed")).toBeTruthy();
    expect(getByText("Protein powder")).toBeTruthy();
  });

  it("opens a widened custom editor that includes active ingredients", () => {
    const { getByPlaceholderText, getByText } = render(<SupplementsScreen />);

    fireEvent.press(getByText("Create custom supplement"));

    expect(getByText("Add custom supplement")).toBeTruthy();
    expect(getByPlaceholderText("Nature Made")).toBeTruthy();
    expect(getByPlaceholderText("Ferrous sulfate")).toBeTruthy();
  });

  it("opens a dedicated scan-first supplement flow", () => {
    const { getByText } = render(<SupplementsScreen />);

    fireEvent.press(getByText("Scan supplement"));

    expect(getByText("Front label")).toBeTruthy();
    expect(getByText("Supplement facts")).toBeTruthy();
    expect(getByText("Skip second photo")).toBeTruthy();
  });

  it("shows a ready-state checkmark after a supplement photo is selected", async () => {
    const { getAllByText, getByText } = render(<SupplementsScreen />);

    fireEvent.press(getByText("Scan supplement"));
    fireEvent.press(getAllByText("Choose photo")[0]);

    await waitFor(() => {
      expect(getByText("Photo ready")).toBeTruthy();
      expect(getByText("✓")).toBeTruthy();
    });
  });

  it("passes both prepared supplement photos into the analyze action", async () => {
    const analyzeSupplementAction = jest.fn().mockResolvedValue({
      activeIngredients: [{ name: "Iron", amount: 65, unit: "mg" }],
      brand: "Nature Made",
      displayName: "Iron 65 mg",
      frequency: "daily",
      nutritionProfile: { iron: 65 },
      overallConfidence: "high",
      servingLabel: "1 tablet",
    });

    mockUseAction.mockReturnValue(analyzeSupplementAction);
    mockUseMutation.mockReturnValue(jest.fn().mockResolvedValue(undefined));

    mockPrepareSupplementPhoto
      .mockResolvedValueOnce({
        base64: "front-base64",
        mimeType: "image/jpeg",
        uri: "file://front.jpg",
      })
      .mockResolvedValueOnce({
        base64: "facts-base64",
        mimeType: "image/jpeg",
        uri: "file://facts.jpg",
      });

    const { getAllByText, getByText } = render(<SupplementsScreen />);

    fireEvent.press(getByText("Scan supplement"));
    fireEvent.press(getAllByText("Choose photo")[0]);
    fireEvent.press(getAllByText("Choose photo")[1]);
    await waitFor(() => {
      expect(getAllByText("Photo ready")).toHaveLength(2);
    });
    fireEvent.press(getByText("Analyze supplement"));

    await waitFor(() => {
      expect(analyzeSupplementAction).toHaveBeenCalledWith({
        factsPhotoBase64: "facts-base64",
        factsPhotoMimeType: "image/jpeg",
        frontPhotoBase64: "front-base64",
        frontPhotoMimeType: "image/jpeg",
      });
    });
  });
});
