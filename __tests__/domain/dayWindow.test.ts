import { getDayWindowForTimestamp, getLocalDateKey } from "../../lib/domain/dayWindow";

describe("day window helpers", () => {
  it("uses the user's local date near midnight in Honolulu", () => {
    const timestamp = Date.parse("2026-03-30T09:58:00.000Z");

    expect(getLocalDateKey(timestamp, "Pacific/Honolulu")).toBe("2026-03-29");
    expect(getDayWindowForTimestamp(timestamp, "Pacific/Honolulu")).toEqual({
      end: Date.parse("2026-03-30T10:00:00.000Z"),
      start: Date.parse("2026-03-29T10:00:00.000Z"),
    });
  });

  it("does not accidentally use UTC when the local day is still yesterday", () => {
    const timestamp = Date.parse("2026-03-29T06:30:00.000Z");

    expect(getLocalDateKey(timestamp, "America/Los_Angeles")).toBe("2026-03-28");
  });
});
