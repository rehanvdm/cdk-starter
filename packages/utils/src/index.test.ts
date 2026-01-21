import { describe, expect, it } from "vitest";
import { getRandomNumberBetween } from "./index";

describe("getRandomNumberBetween", () => {
  it("should return a number within the given range", () => {
    const min = 1;
    const max = 100;

    for (let i = 0; i < 100; i++) {
      const result = getRandomNumberBetween(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    }
  });

  it("should return the same number when min equals max", () => {
    const result = getRandomNumberBetween(5, 5);
    expect(result).toBe(5);
  });

  it("should return an integer", () => {
    const result = getRandomNumberBetween(1, 100);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("should work with negative numbers", () => {
    const min = -50;
    const max = -10;

    for (let i = 0; i < 50; i++) {
      const result = getRandomNumberBetween(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    }
  });

  it("should work with range spanning negative and positive", () => {
    const min = -10;
    const max = 10;

    for (let i = 0; i < 50; i++) {
      const result = getRandomNumberBetween(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    }
  });
});
