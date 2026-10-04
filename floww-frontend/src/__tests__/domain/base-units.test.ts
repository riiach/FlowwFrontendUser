import { describe, it, expect } from "vitest";
import { toBaseUnits, fromBaseUnits } from "@/lib/utils/base-units";
describe("base units", () => {
  it("converts decimal amounts exactly, including values beyond Number precision", () => {
    expect(toBaseUnits("23.5")).toBe("23500000");
    expect(toBaseUnits("9007199254740993.000001")).toBe(
      "9007199254740993000001",
    );
    expect(fromBaseUnits("23500000")).toBe("23.5");
    expect(fromBaseUnits("1")).toBe("0.000001");
    expect(toBaseUnits("0", 0)).toBe("0");
  });
  it.each(["-1", "1e3", "1.0000001", "NaN", "1,000", "01", "1."])(
    "rejects invalid or lossy input %s",
    (value) => {
      expect(() => toBaseUnits(value)).toThrow();
    },
  );
});
