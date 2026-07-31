import { describe, expect, it } from "vitest";

import { compare, MIN_RELIABLE_WORDS } from "../src/compare.js";
import { FEATURES } from "../src/features.js";
import { buildProfile, percentile } from "../src/profile.js";
import { PROFILES } from "../src/profiles.js";

describe("percentile", () => {
  // Linear interpolation, the NumPy default. On five points the position for a
  // quantile q is 4q, so p10 sits four tenths of the way from the first value to
  // the second: 1 + 0.4 * (2 - 1) = 1.4.
  const sorted = [1, 2, 3, 4, 5];

  it("interpolates between neighbours", () => {
    expect(percentile(sorted, 0.1)).toBeCloseTo(1.4, 10);
    expect(percentile(sorted, 0.9)).toBeCloseTo(4.6, 10);
  });

  it("hits the exact value when the position lands on an index", () => {
    expect(percentile(sorted, 0.5)).toBe(3);
    expect(percentile(sorted, 0)).toBe(1);
    expect(percentile(sorted, 1)).toBe(5);
  });

  it("handles degenerate inputs", () => {
    expect(percentile([], 0.5)).toBe(0);
    expect(percentile([7], 0.5)).toBe(7);
  });
});

describe("buildProfile", () => {
  const a = "The cat sat on the mat. It was warm there, and quiet.";
  const b = "A dog ran through the long grass. Nobody saw it go, which was lucky.";

  it("refuses to build a distribution from one text", () => {
    // One observation has no spread, so every band would claim sd 0 and every
    // later comparison would read as either identical or one unit away. Failing
    // loudly beats returning a profile that is quietly meaningless.
    expect(() => buildProfile([a], "en")).toThrow(/at least 2/);
  });

  it("describes every feature", () => {
    const profile = buildProfile([a, b], "en");
    expect(Object.keys(profile.bands).sort()).toEqual(FEATURES.map((f) => f.key).sort());
    expect(profile.sources).toBe(2);
    expect(profile.lang).toBe("en");
  });

  it("counts the corpus words", () => {
    // 12 words in a, 14 in b.
    expect(buildProfile([a, b], "en").words).toBe(26);
  });

  it("orders each band and keeps the percentiles inside the extremes", () => {
    const profile = buildProfile([a, b, `${a} ${b}`], "en");
    for (const f of FEATURES) {
      const band = profile.bands[f.key]!;
      expect(band.min, f.key).toBeLessThanOrEqual(band.p10);
      expect(band.p10, f.key).toBeLessThanOrEqual(band.p50);
      expect(band.p50, f.key).toBeLessThanOrEqual(band.p90);
      expect(band.p90, f.key).toBeLessThanOrEqual(band.max);
    }
  });
});

describe("compare", () => {
  const a = "The cat sat on the mat. It was warm there, and quiet.";
  const b = "A dog ran through the long grass. Nobody saw it go, which was lucky.";

  it("puts a text identical to a zero-spread corpus at distance zero", () => {
    // Both corpus texts are the same, so every band has sd 0. The same text
    // again must land at 0 rather than at the fallback of 1.
    const profile = buildProfile([a, a], "en");
    const result = compare(a, profile);
    expect(result.distance).toBeCloseTo(0, 10);
    expect(result.features.every((f) => f.z === 0)).toBe(true);
  });

  it("keeps the distance finite when the corpus never varies", () => {
    // The degenerate case that would otherwise divide by zero: a corpus with no
    // spread and a text that differs from it anyway.
    const profile = buildProfile([a, a], "en");
    const result = compare(b, profile);
    expect(Number.isFinite(result.distance)).toBe(true);
    expect(result.distance).toBeGreaterThan(0);
  });

  it("reports every feature, sorted by distance from the corpus", () => {
    const profile = buildProfile([a, b], "en");
    const result = compare(a, profile);

    expect(result.features).toHaveLength(FEATURES.length);
    const magnitudes = result.features.map((f) => Math.abs(f.z));
    expect(magnitudes).toEqual([...magnitudes].sort((x, y) => y - x));
  });

  it("marks a value outside the tenth to ninetieth percentiles", () => {
    const profile = buildProfile([a, b], "en");
    const result = compare(a, profile);
    for (const f of result.features) {
      expect(f.insideBand).toBe(f.value >= f.band.p10 && f.value <= f.band.p90);
    }
  });

  it("warns when the text is too short for the bands to mean anything", () => {
    const result = compare(a, buildProfile([a, b], "en"));
    expect(result.words).toBe(12);
    expect(result.warnings.join(" ")).toMatch(/short/);
  });

  it("warns when the profile is built from few sources", () => {
    const result = compare(a, buildProfile([a, b], "en"));
    expect(result.warnings.join(" ")).toMatch(/2 texts/);
  });

  it("does not warn about length on a text past the threshold", () => {
    const long = Array.from({ length: 40 }, () => a).join(" ");
    const result = compare(long, PROFILES.en);
    expect(result.words).toBeGreaterThanOrEqual(MIN_RELIABLE_WORDS);
    expect(result.warnings.join(" ")).not.toMatch(/short/);
  });

  it("carries the breakdown alongside the distance, always", () => {
    // The API guarantee the library exists to make: there is no way to get the
    // number without the reasoning.
    const result = compare(a, buildProfile([a, b], "en"));
    expect(result).toHaveProperty("distance");
    expect(result.features.length).toBeGreaterThan(0);
  });
});

describe("the bundled profiles", () => {
  it("ships a profile for both languages", () => {
    expect(PROFILES.en.lang).toBe("en");
    expect(PROFILES.de.lang).toBe("de");
    expect(PROFILES.en.sources).toBeGreaterThanOrEqual(10);
    expect(PROFILES.de.sources).toBeGreaterThanOrEqual(10);
  });

  it("describes every feature in both languages", () => {
    for (const lang of ["en", "de"] as const) {
      expect(Object.keys(PROFILES[lang].bands).sort()).toEqual(
        FEATURES.map((f) => f.key).sort(),
      );
    }
  });

  it("places a corpus-typical text near distance 1", () => {
    // The scale claim in compare.ts: root mean square z is 1 for a text drawn
    // from the same distribution as the corpus. This checks the claim holds for
    // a synthetic text sitting exactly on every corpus median, which must land
    // well inside 1 rather than merely finite.
    const profile = PROFILES.en;
    const median = Object.fromEntries(
      FEATURES.map((f) => [f.key, profile.bands[f.key]!.p50]),
    );
    let sumSq = 0;
    for (const f of FEATURES) {
      const band = profile.bands[f.key]!;
      const z = band.sd === 0 ? 0 : (median[f.key]! - band.mean) / band.sd;
      sumSq += z ** 2;
    }
    expect(Math.sqrt(sumSq / FEATURES.length)).toBeLessThan(1);
  });
});
