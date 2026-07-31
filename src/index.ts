// stylo: transparent stylometric measurement.
//
// Three things, in the order you would use them:
//   measure(text, lang)        one text, nineteen numbers
//   buildProfile(texts, lang)  a corpus, turned into a distribution
//   compare(text, profile)     one text, placed against that distribution
//
// There is no function that returns a verdict, and adding one would be a
// breaking change to the argument the library makes rather than to its types.

export {
  analyse,
  FEATURES,
  FORMAL_CONNECTORS,
  HEDGES,
  SUBORDINATORS,
  commaPerSent,
  connectorDensity,
  emDashDensity,
  hedgeDensity,
  longSentRatio,
  longWordRatio,
  mattr,
  meanWordLen,
  measure,
  nominalizationDensity,
  paraLenCv,
  passiveDensity,
  punctVariety,
  rhetoricalPairRate,
  sentLenCv,
  sentLenMean,
  sentLenStd,
  sentStartRepetition,
  shortSentRatio,
  subordinationDensity,
} from "./features.js";
export type { Doc, FeatureSpec, FeatureVector } from "./features.js";

export { buildProfile, percentile } from "./profile.js";
export type { Band, CorpusProfile } from "./profile.js";

export { compare, MIN_RELIABLE_SOURCES, MIN_RELIABLE_WORDS } from "./compare.js";
export type { Comparison, FeatureComparison, Warning, WarningCode } from "./compare.js";

export { paragraphs, sentences, words } from "./tokenize.js";
export type { Lang } from "./tokenize.js";

export { PROFILES, profileFor } from "./profiles.js";
