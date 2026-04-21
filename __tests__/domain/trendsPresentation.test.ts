import { getWeeklyWellnessBandColor } from "../../lib/domain/trendsPresentation";

describe("trends presentation helpers", () => {
  it("maps weekly wellness scores to exact dark-mode band colors", () => {
    expect(getWeeklyWellnessBandColor({ mode: "dark", score: 0 })).toBe("#B86A62");
    expect(getWeeklyWellnessBandColor({ mode: "dark", score: 25 })).toBe("#B86A62");
    expect(getWeeklyWellnessBandColor({ mode: "dark", score: 26 })).toBe("#C98A4A");
    expect(getWeeklyWellnessBandColor({ mode: "dark", score: 50 })).toBe("#C98A4A");
    expect(getWeeklyWellnessBandColor({ mode: "dark", score: 51 })).toBe("#D2B46A");
    expect(getWeeklyWellnessBandColor({ mode: "dark", score: 75 })).toBe("#D2B46A");
    expect(getWeeklyWellnessBandColor({ mode: "dark", score: 76 })).toBe("#63AF88");
    expect(getWeeklyWellnessBandColor({ mode: "dark", score: 100 })).toBe("#63AF88");
  });

  it("maps weekly wellness scores to exact light-mode band colors", () => {
    expect(getWeeklyWellnessBandColor({ mode: "light", score: 0 })).toBe("#A85B52");
    expect(getWeeklyWellnessBandColor({ mode: "light", score: 25 })).toBe("#A85B52");
    expect(getWeeklyWellnessBandColor({ mode: "light", score: 26 })).toBe("#B87534");
    expect(getWeeklyWellnessBandColor({ mode: "light", score: 50 })).toBe("#B87534");
    expect(getWeeklyWellnessBandColor({ mode: "light", score: 51 })).toBe("#A98A42");
    expect(getWeeklyWellnessBandColor({ mode: "light", score: 75 })).toBe("#A98A42");
    expect(getWeeklyWellnessBandColor({ mode: "light", score: 76 })).toBe("#468766");
    expect(getWeeklyWellnessBandColor({ mode: "light", score: 100 })).toBe("#468766");
  });
});
