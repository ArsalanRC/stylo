// Placing one text against a profile.
//
// The output is deliberately shaped so the summary number cannot travel without
// the breakdown. `compare` returns one object holding both, and there is no
// function that returns the distance alone. That is not a stylistic preference:
// a single number detached from its reasoning is precisely the thing this
// library exists as an alternative to, and an API that makes it easy to extract
// one would get used that way.

import { FEATURES, measure } from "./features.js";
import type { Band, CorpusProfile } from "./profile.js";
import type { Lang } from "./tokenize.js";

export interface FeatureComparison {
  readonly key: string;
  readonly label: string;
  /** What this text measured. */
  readonly value: number;
  /** What the corpus does on this feature. */
  readonly band: Band;
  /**
   * Standard scores away from the corpus mean, signed.
   *
   * Negative is below the corpus, positive is above. Neither is better. A text
   * with shorter sentences than a dissertation corpus is not worse writing, it
   * is a text with shorter sentences than a dissertation corpus.
   */
  readonly z: number;
  /** Whether the value falls between the corpus tenth and ninetieth percentiles. */
  readonly insideBand: boolean;
}

export interface Comparison {
  readonly lang: Lang;
  /**
   * Root mean square of the nineteen z scores.
   *
   * Scaled so that 1 is the expected value for a text drawn from the same
   * distribution as the corpus. A text scoring near 1 sits where corpus members
   * sit. Distances above roughly 2 mean the text is unusual against this corpus
   * on several features at once, and the `features` array says which.
   *
   * It is not a probability and it is not a verdict. It is a distance, and a
   * large one is a reason to look at the breakdown rather than a conclusion.
   */
  readonly distance: number;
  /** Every feature, ordered by how far it sits from the corpus, furthest first. */
  readonly features: readonly FeatureComparison[];
}

/** Measure a text and place each feature against the profile. */
export function compare(text: string, profile: CorpusProfile): Comparison {
  const vector = measure(text, profile.lang);
  const comparisons: FeatureComparison[] = [];

  for (const f of FEATURES) {
    const band = profile.bands[f.key];
    if (!band) continue;

    const value = vector[f.key] ?? 0;
    comparisons.push({
      key: f.key,
      label: f.label,
      value,
      band,
      z: zScore(value, band),
      insideBand: value >= band.p10 && value <= band.p90,
    });
  }

  const distance = Math.sqrt(
    comparisons.reduce((sum, c) => sum + c.z ** 2, 0) / Math.max(comparisons.length, 1),
  );

  return {
    lang: profile.lang,
    distance,
    features: [...comparisons].sort((a, b) => Math.abs(b.z) - Math.abs(a.z)),
  };
}

/**
 * Standard score, with the degenerate case handled honestly.
 *
 * A feature can have zero spread across the corpus: every German source here
 * uses no em-dashes at all, so its standard deviation is zero and the usual
 * formula divides by it. Returning 0 in that case would claim the text is
 * typical when the corpus in fact has nothing to say. Returning Infinity would
 * let one feature swamp the distance. So the rule is: identical to the corpus
 * means 0, different from a corpus that never varies means 1, which reads as
 * "outside, by one unit of nothing" and keeps the aggregate finite.
 */
function zScore(value: number, band: Band): number {
  if (band.sd === 0) return value === band.mean ? 0 : 1;
  return (value - band.mean) / band.sd;
}
