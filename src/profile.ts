// Building a corpus profile, and what a profile is.
//
// A profile is the *distribution* of each feature across a set of reference
// texts: mean, spread, and the tenth, fiftieth and ninetieth percentiles. It is
// not the texts. That distinction is the main design decision in this library
// and it is worth stating plainly, because it is the reason a profile can be
// published at all.
//
// The reference texts here are published academic papers and dissertations.
// Redistributing them is not ours to do. Redistributing the mean sentence length
// of thirteen dissertations is a different object entirely: nineteen numbers per
// text, aggregated, from which no sentence can be recovered.
//
// It is also the better engineering unit. A profile is a few kilobytes of JSON
// that loads in a browser, and anyone can rebuild it from their own corpus with
// buildProfile to measure against their own register instead of this one.

import { FEATURES, type FeatureVector, measure } from "./features.js";
import type { Lang } from "./tokenize.js";

export interface Band {
  /** Arithmetic mean across the corpus texts. */
  readonly mean: number;
  /** Population standard deviation across the corpus texts. */
  readonly sd: number;
  readonly p10: number;
  readonly p50: number;
  readonly p90: number;
  readonly min: number;
  readonly max: number;
}

export interface CorpusProfile {
  readonly lang: Lang;
  /** How many texts the distribution was measured over. Small n widens every band. */
  readonly sources: number;
  /** Total words across the corpus, so a reader can judge whether n is thin. */
  readonly words: number;
  readonly bands: Readonly<Record<string, Band>>;
}

/**
 * Measure every text, then describe the spread of each feature across them.
 *
 * The unit is the text, not the sentence. Ten dissertations give ten
 * observations per feature, and that is what makes the spread meaningful: it is
 * the variation *between authors*, which is the thing a new text is being placed
 * against. Pooling every sentence instead would measure variation within a
 * document and produce far tighter bands that mean something else entirely.
 */
export function buildProfile(texts: readonly string[], lang: Lang): CorpusProfile {
  if (texts.length < 2) {
    throw new Error(`a profile needs at least 2 texts to have a spread, got ${texts.length}`);
  }

  const vectors: FeatureVector[] = texts.map((t) => measure(t, lang));
  const bands: Record<string, Band> = {};

  for (const f of FEATURES) {
    const values = vectors.map((v) => v[f.key] ?? 0).sort((a, b) => a - b);
    bands[f.key] = {
      mean: mean(values),
      sd: stdev(values),
      p10: percentile(values, 0.1),
      p50: percentile(values, 0.5),
      p90: percentile(values, 0.9),
      min: values[0]!,
      max: values[values.length - 1]!,
    };
  }

  const words = texts.reduce((n, t) => n + (t.match(/[\p{L}\p{M}]+/gu)?.length ?? 0), 0);

  return { lang, sources: texts.length, words, bands };
}

/**
 * Linear-interpolated percentile over an already-sorted array.
 *
 * There are nine recognised ways to define a sample percentile and they disagree
 * on small n, which is exactly the case here. This is the linear interpolation
 * method, the same one NumPy uses by default, named so the numbers can be
 * reproduced rather than merely trusted.
 */
export function percentile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;

  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) return sorted[lower]!;

  return sorted[lower]! + (pos - lower) * (sorted[upper]! - sorted[lower]!);
}

function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}
