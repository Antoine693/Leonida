import { describe, expect, it } from "vitest";
import { computeAge, computeSeniority, formatSeniority } from "./hr";

const today = new Date(2026, 10, 17); // 17/11/2026

describe("calculs RH", () => {
  it("computes age in full years (birthday not yet reached)", () => {
    expect(computeAge("1981-11-24", today)).toBe(44);
  });

  it("computes age in full years (birthday passed)", () => {
    expect(computeAge("1991-06-09", today)).toBe(35);
  });

  it("computes seniority in years and months since hire date", () => {
    expect(computeSeniority("2022-02-01", today)).toEqual({ years: 4, months: 9 });
    expect(formatSeniority({ years: 4, months: 9 })).toBe("4 ans et 9 mois");
  });
});
