// The nineteen measurements.
//
// One exported function per feature, each taking a prepared Doc and returning a
// single number. They are separate functions rather than one big loop so that
// each can be unit-tested against a value worked out by hand, which is the only
// way to know a stylometric feature is right: there is no reference output to
// diff against, so the test has to encode the arithmetic independently.
//
// Every feature is a plain descriptive statistic. None of them carries a
// direction, a weight or a judgement, and that is deliberate. A feature that
// knows which way is "bad" has an argument baked into it that the caller cannot
// see. Here the numbers are reported and the reader supplies the argument.

import { type Lang, paragraphs, sentences, words } from "./tokenize.js";

export interface Doc {
  readonly lang: Lang;
  readonly paragraphs: readonly string[];
  readonly sentences: readonly string[];
  /** Words of each sentence, index-aligned with `sentences`. */
  readonly sentenceWords: readonly (readonly string[])[];
  /** Every word in the text, lowercased. */
  readonly words: readonly string[];
  /** The original text, needed by the features that count punctuation. */
  readonly text: string;
}

/** Tokenise once, so nineteen features do not each re-split the same text. */
export function analyse(text: string, lang: Lang): Doc {
  const sents = sentences(text, lang);
  const sentenceWords = sents.map((s) => words(s).map((w) => w.toLowerCase()));
  return {
    lang,
    text,
    paragraphs: paragraphs(text),
    sentences: sents,
    sentenceWords,
    words: sentenceWords.flat(),
  };
}

// ---------------------------------------------------------------------------
// Sentence shape
// ---------------------------------------------------------------------------

/** Mean sentence length in words. */
export function sentLenMean(doc: Doc): number {
  const lengths = doc.sentenceWords.map((s) => s.length);
  return mean(lengths);
}

/**
 * Population standard deviation of sentence length, often called burstiness.
 *
 * Population rather than sample: the sentences of this text are the whole
 * population being described, not a sample drawn from a larger set of sentences
 * the text might have had.
 */
export function sentLenStd(doc: Doc): number {
  return stdev(doc.sentenceWords.map((s) => s.length));
}

/** Sentence-length standard deviation over the mean. Scale-free, so comparable across registers. */
export function sentLenCv(doc: Doc): number {
  const m = sentLenMean(doc);
  return m === 0 ? 0 : sentLenStd(doc) / m;
}

/** Share of sentences of seven words or fewer. */
export function shortSentRatio(doc: Doc): number {
  return ratio(doc.sentenceWords.filter((s) => s.length <= 7).length, doc.sentenceWords.length);
}

/** Share of sentences of twenty-eight words or more. */
export function longSentRatio(doc: Doc): number {
  return ratio(doc.sentenceWords.filter((s) => s.length >= 28).length, doc.sentenceWords.length);
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

const MATTR_WINDOW = 50;

/**
 * Moving-average type-token ratio: lexical diversity that does not depend on length.
 *
 * A plain type-token ratio falls as a text grows, purely because words repeat,
 * so comparing a 200-word text to a 20,000-word corpus on plain TTR compares
 * their lengths rather than their vocabularies. Averaging the ratio over a fixed
 * window removes that. Texts shorter than the window are measured whole, which
 * makes them slightly less comparable, and that is reported rather than hidden.
 */
export function mattr(doc: Doc): number {
  const w = doc.words;
  if (w.length === 0) return 0;
  if (w.length <= MATTR_WINDOW) return new Set(w).size / w.length;

  let total = 0;
  let windows = 0;
  for (let i = 0; i + MATTR_WINDOW <= w.length; i++) {
    total += new Set(w.slice(i, i + MATTR_WINDOW)).size / MATTR_WINDOW;
    windows++;
  }
  return total / windows;
}

/** Mean word length in characters. */
export function meanWordLen(doc: Doc): number {
  return mean(doc.words.map((w) => w.length));
}

/** Share of words of fourteen characters or more. In German this mostly counts compounds. */
export function longWordRatio(doc: Doc): number {
  return ratio(doc.words.filter((w) => w.length >= 14).length, doc.words.length);
}

// ---------------------------------------------------------------------------
// Word classes
//
// These are lexicon matches, not a parser. A word list cannot tell a
// subordinating "since" from a temporal one, and does not try to. The lists are
// exported so anyone reading a result can see exactly what was counted, which is
// the whole reason this tool exists rather than a percentage.
// ---------------------------------------------------------------------------

export const FORMAL_CONNECTORS: Record<Lang, readonly string[]> = {
  de: [
    "zudem",
    "darüber hinaus",
    "ferner",
    "hierzu",
    "hierdurch",
    "hieran",
    "insbesondere",
    "grundsätzlich",
    "im wesentlichen",
    "in der regel",
    "im folgenden",
    "vor diesem hintergrund",
    "demgegenüber",
    "folglich",
    "somit",
    "letztlich",
    "hierbei",
    "diesbezüglich",
    "dementsprechend",
  ],
  en: [
    "moreover",
    "furthermore",
    "additionally",
    "in addition",
    "consequently",
    "notably",
    "importantly",
    "that said",
    "indeed",
    "in conclusion",
    "in summary",
    "to sum up",
    "overall",
    "as a result",
    "thus",
    "hence",
    "therefore",
  ],
};

export const HEDGES: Record<Lang, readonly string[]> = {
  de: [
    "ja",
    "doch",
    "eben",
    "halt",
    "schon",
    "etwa",
    "wohl",
    "mal",
    "denn",
    "eigentlich",
    "durchaus",
    "ohnehin",
  ],
  en: ["actually", "really", "just", "quite", "rather", "after all", "of course", "anyway"],
};

export const SUBORDINATORS: Record<Lang, readonly string[]> = {
  de: [
    "dass",
    "weil",
    "obwohl",
    "damit",
    "indem",
    "sofern",
    "sobald",
    "während",
    "wenn",
    "falls",
    "obgleich",
    "sodass",
    "zumal",
    "wohingegen",
  ],
  en: [
    "because",
    "although",
    "though",
    "while",
    "whereas",
    "since",
    "unless",
    "whenever",
    "so that",
    "even though",
  ],
};

/** Formal connectives per hundred words. */
export function connectorDensity(doc: Doc): number {
  return per100(countPhrases(doc, FORMAL_CONNECTORS[doc.lang]), doc.words.length);
}

/** Hedges and, in German, Modalpartikeln, per hundred words. */
export function hedgeDensity(doc: Doc): number {
  return per100(countPhrases(doc, HEDGES[doc.lang]), doc.words.length);
}

/** Subordinating conjunctions per hundred words. */
export function subordinationDensity(doc: Doc): number {
  return per100(countPhrases(doc, SUBORDINATORS[doc.lang]), doc.words.length);
}

const NOMINAL_SUFFIXES: Record<Lang, readonly string[]> = {
  de: ["ung", "heit", "keit", "tät", "ion", "ismus", "nis"],
  en: ["tion", "sion", "ment", "ness", "ity", "ance", "ence", "ism"],
};

/**
 * Nominalisations per hundred words, matched by suffix.
 *
 * Suffix matching over-counts: "Ding" ends in no suffix but "jung" ends in one
 * that looks like "-ung". A minimum length of six characters removes most of
 * those without needing a dictionary, and the residue is a known and bounded
 * error rather than a hidden one.
 */
export function nominalizationDensity(doc: Doc): number {
  const suffixes = NOMINAL_SUFFIXES[doc.lang];
  const hits = doc.words.filter(
    (w) => w.length >= 6 && suffixes.some((s) => w.endsWith(s)),
  ).length;
  return per100(hits, doc.words.length);
}

const BE_FORMS = ["is", "are", "was", "were", "be", "been", "being"];
const WERDEN_FORMS = ["wird", "werden", "wurde", "wurden", "worden"];

/**
 * Passive constructions per hundred words.
 *
 * This is an approximation and the README says so. German counts a form of
 * "werden" followed within three words by a participle-shaped word, plus the
 * "ist zu" construction. English counts a form of "be" followed within three
 * words by a word ending "-ed" or "-en".
 *
 * It misses irregular English participles ("was written") and it catches the
 * occasional adjective ("is red" is safe, "was tired" is not). Both errors are
 * roughly constant across texts of the same language, which is what matters
 * here: the number is compared against a corpus measured by this same function,
 * so a consistent bias cancels and only the difference is read.
 */
export function passiveDensity(doc: Doc): number {
  let hits = 0;

  for (const sentence of doc.sentenceWords) {
    for (let i = 0; i < sentence.length; i++) {
      const w = sentence[i]!;

      if (doc.lang === "en") {
        if (BE_FORMS.includes(w) && hasParticipleNearby(sentence, i, enParticiple)) hits++;
      } else {
        if (WERDEN_FORMS.includes(w) && hasParticipleNearby(sentence, i, deParticiple)) hits++;
        if (w === "ist" && sentence[i + 1] === "zu") hits++;
      }
    }
  }

  return per100(hits, doc.words.length);
}

function hasParticipleNearby(
  sentence: readonly string[],
  from: number,
  test: (w: string) => boolean,
): boolean {
  for (let j = from + 1; j <= from + 3 && j < sentence.length; j++) {
    if (test(sentence[j]!)) return true;
  }
  return false;
}

function enParticiple(w: string): boolean {
  return w.length >= 4 && (w.endsWith("ed") || w.endsWith("en"));
}

function deParticiple(w: string): boolean {
  return w.length >= 5 && (w.startsWith("ge") || w.endsWith("iert") || w.endsWith("isiert"));
}

// ---------------------------------------------------------------------------
// Punctuation and layout
// ---------------------------------------------------------------------------

/** Commas per sentence. */
export function commaPerSent(doc: Doc): number {
  const commas = (doc.text.match(/,/g) ?? []).length;
  return ratio(commas, doc.sentences.length);
}

const PUNCT_MARKS = [",", ";", ":", "(", "?", "!", "'", '"', "-", "…"] as const;

/** Share of a fixed set of ten punctuation marks that the text uses at least once. */
export function punctVariety(doc: Doc): number {
  const used = PUNCT_MARKS.filter((m) => doc.text.includes(m)).length;
  return used / PUNCT_MARKS.length;
}

/** Em-dashes and en-dashes per hundred words. */
export function emDashDensity(doc: Doc): number {
  const dashes = (doc.text.match(/[—–]/g) ?? []).length;
  return per100(dashes, doc.words.length);
}

/** Coefficient of variation of paragraph length, in words. */
export function paraLenCv(doc: Doc): number {
  const lengths = doc.paragraphs.map((p) => words(p).length);
  const m = mean(lengths);
  return m === 0 ? 0 : stdev(lengths) / m;
}

const RHETORICAL_PAIRS: Record<Lang, readonly RegExp[]> = {
  de: [
    /\bzum einen\b[^.?!]*\bzum anderen\b/i,
    /\bsowohl\b[^.?!]*\bals auch\b/i,
    /\bnicht nur\b[^.?!]*\bsondern auch\b/i,
    /\beinerseits\b[^.?!]*\bandererseits\b/i,
    /\bweder\b[^.?!]*\bnoch\b/i,
  ],
  en: [
    /\bnot only\b[^.?!]*\bbut also\b/i,
    /\bon the one hand\b[^.?!]*\bon the other hand\b/i,
    /\bboth\b[^.?!]*\band\b[^.?!]*\balike\b/i,
    /\bneither\b[^.?!]*\bnor\b/i,
    /\bit is not\b[^.?!]*\bit is\b/i,
  ],
};

/** Balanced two-part constructions per thousand words, counted per sentence. */
export function rhetoricalPairRate(doc: Doc): number {
  const patterns = RHETORICAL_PAIRS[doc.lang];
  let hits = 0;
  for (const sentence of doc.sentences) {
    for (const p of patterns) if (p.test(sentence)) hits++;
  }
  return doc.words.length === 0 ? 0 : (hits / doc.words.length) * 1000;
}

/**
 * Share of sentence openings that repeat a word already used to open a sentence.
 *
 * Measured over first words only. A text that starts six sentences with "The"
 * scores high; whether that reads as rhythm or as monotony is the reader's call,
 * which is the general principle of this library applied to one feature.
 */
export function sentStartRepetition(doc: Doc): number {
  const firsts = doc.sentenceWords.map((s) => s[0]).filter((w): w is string => w !== undefined);
  if (firsts.length === 0) return 0;
  const distinct = new Set(firsts).size;
  return (firsts.length - distinct) / firsts.length;
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

export interface FeatureSpec {
  readonly key: string;
  readonly label: string;
  readonly compute: (doc: Doc) => number;
}

/** Order is fixed: the vector is emitted in this order everywhere. */
export const FEATURES: readonly FeatureSpec[] = [
  { key: "sent_len_mean", label: "mean sentence length (words)", compute: sentLenMean },
  { key: "sent_len_std", label: "sentence-length spread", compute: sentLenStd },
  { key: "sent_len_cv", label: "sentence-length variation", compute: sentLenCv },
  { key: "short_sent_ratio", label: "sentences of 7 words or fewer", compute: shortSentRatio },
  { key: "long_sent_ratio", label: "sentences of 28 words or more", compute: longSentRatio },
  { key: "mattr", label: "lexical diversity (MATTR-50)", compute: mattr },
  { key: "comma_per_sent", label: "commas per sentence", compute: commaPerSent },
  { key: "connector_density", label: "formal connectives per 100 words", compute: connectorDensity },
  { key: "hedge_density", label: "hedges per 100 words", compute: hedgeDensity },
  { key: "passive_density", label: "passive constructions per 100 words", compute: passiveDensity },
  {
    key: "nominalization_density",
    label: "nominalisations per 100 words",
    compute: nominalizationDensity,
  },
  {
    key: "subordination_density",
    label: "subordinators per 100 words",
    compute: subordinationDensity,
  },
  { key: "mean_word_len", label: "mean word length (characters)", compute: meanWordLen },
  { key: "long_word_ratio", label: "words of 14 characters or more", compute: longWordRatio },
  { key: "punct_variety", label: "punctuation range used", compute: punctVariety },
  { key: "em_dash_density", label: "dashes per 100 words", compute: emDashDensity },
  { key: "para_len_cv", label: "paragraph-length variation", compute: paraLenCv },
  { key: "rhetorical_pair_rate", label: "balanced pairs per 1000 words", compute: rhetoricalPairRate },
  { key: "sent_start_repetition", label: "repeated sentence openings", compute: sentStartRepetition },
];

export type FeatureVector = Readonly<Record<string, number>>;

/** Measure every feature of one text. */
export function measure(text: string, lang: Lang): FeatureVector {
  const doc = analyse(text, lang);
  const out: Record<string, number> = {};
  for (const f of FEATURES) out[f.key] = f.compute(doc);
  return out;
}

// ---------------------------------------------------------------------------

function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function ratio(hits: number, total: number): number {
  return total === 0 ? 0 : hits / total;
}

function per100(hits: number, totalWords: number): number {
  return totalWords === 0 ? 0 : (hits / totalWords) * 100;
}

/**
 * Count occurrences of each phrase, matching whole words only.
 *
 * Whole-word matching is what stops "so that" being found inside "also that" and
 * stops the German "ja" being counted inside "Jahr". Substring matching here was
 * the first bug this module had.
 */
function countPhrases(doc: Doc, phrases: readonly string[]): number {
  let hits = 0;
  const joined = doc.words.join(" ");
  for (const phrase of phrases) {
    const re = new RegExp(`(?<![\\p{L}])${escapeRe(phrase)}(?![\\p{L}])`, "gu");
    hits += (joined.match(re) ?? []).length;
  }
  return hits;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
