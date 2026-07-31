// Every expectation here is arithmetic worked out by hand and written into the
// test, never a value copied back out of a run. A stylometric feature has no
// reference implementation to diff against, so a test that records whatever the
// code produced would only prove the code is deterministic.

import { describe, expect, it } from "vitest";

import {
  analyse,
  commaPerSent,
  connectorDensity,
  emDashDensity,
  FEATURES,
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
} from "../src/features.js";

const en = (t: string) => analyse(t, "en");
const de = (t: string) => analyse(t, "de");

/** n distinct alphabetic words: aa, ab, ac and so on. */
function distinctWords(n: number): string[] {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const out: string[] = [];
  for (let i = 0; out.length < n; i++) {
    out.push(letters[Math.floor(i / 26) % 26]! + letters[i % 26]!);
  }
  return out;
}

describe("sentence shape", () => {
  // Two sentences of 3 and 8 words.
  const doc = en("One two three. Four five six seven eight nine ten eleven.");

  it("means the sentence lengths", () => {
    expect(sentLenMean(doc)).toBeCloseTo(5.5, 10); // (3 + 8) / 2
  });

  it("uses the population standard deviation", () => {
    // sqrt(((3 - 5.5)^2 + (8 - 5.5)^2) / 2) = sqrt(6.25) = 2.5
    expect(sentLenStd(doc)).toBeCloseTo(2.5, 10);
  });

  it("divides the spread by the mean", () => {
    expect(sentLenCv(doc)).toBeCloseTo(2.5 / 5.5, 10);
  });

  it("counts sentences of seven words or fewer", () => {
    expect(shortSentRatio(doc)).toBeCloseTo(0.5, 10); // the 3-word one only
  });

  it("counts sentences of twenty-eight words or more", () => {
    expect(longSentRatio(doc)).toBe(0);

    const long = en(`${Array.from({ length: 30 }, (_, i) => `w${i}`).join(" ")}. Short one.`);
    expect(longSentRatio(long)).toBeCloseTo(0.5, 10);
  });

  it("returns zero rather than NaN on empty input", () => {
    const empty = en("");
    expect(sentLenMean(empty)).toBe(0);
    expect(sentLenStd(empty)).toBe(0);
    expect(sentLenCv(empty)).toBe(0);
    expect(shortSentRatio(empty)).toBe(0);
  });
});

describe("vocabulary", () => {
  it("falls back to plain type-token ratio below the window", () => {
    // 6 words, 5 distinct because "the" repeats.
    expect(mattr(en("the cat sat on the mat"))).toBeCloseTo(5 / 6, 10);
  });

  it("does not fall as a long text repeats itself", () => {
    // 100 distinct words cycled four times. Plain type-token ratio would report
    // 100/400 = 0.25 and keep falling as the text grew; a 50-word window sees 50
    // distinct words wherever it lands, so it reports 1 and stays there.
    //
    // The words are alphabetic on purpose. An earlier version of this fixture
    // used w0, w1, w2, and the tokeniser strips digits by design, so every word
    // collapsed to "w" and the test measured nothing.
    const vocab = distinctWords(100);
    const long = Array.from({ length: 400 }, (_, i) => vocab[i % 100]).join(" ") + ".";
    expect(mattr(en(long))).toBeCloseTo(1, 10);
  });

  it("means the word lengths", () => {
    // one two three four five six seven eight nine ten eleven
    // 3 + 3 + 5 + 4 + 4 + 3 + 5 + 5 + 4 + 3 + 6 = 45 over 11 words
    const doc = en("One two three. Four five six seven eight nine ten eleven.");
    expect(meanWordLen(doc)).toBeCloseTo(45 / 11, 10);
  });

  it("counts words of fourteen characters or more", () => {
    // internationalisation is 20 characters; "is" and "long" are not.
    expect(longWordRatio(en("internationalisation is long"))).toBeCloseTo(1 / 3, 10);
  });
});

describe("word classes", () => {
  it("counts formal connectives per hundred words", () => {
    // moreover, furthermore: 2 hits over 7 words
    const doc = en("Moreover, this is true. Furthermore, it is.");
    expect(connectorDensity(doc)).toBeCloseTo((2 / 7) * 100, 10);
  });

  it("matches whole words only", () => {
    // "Jahr" contains "ja" and "damals" contains "mal". Neither is a particle.
    expect(hedgeDensity(de("Ein Jahr damals gewesen"))).toBe(0);
    // "ja" and "doch" standing alone are.
    expect(hedgeDensity(de("Das ist ja doch"))).toBeCloseTo((2 / 4) * 100, 10);
  });

  it("counts hedges per hundred words", () => {
    // actually, really, quite: 3 hits over 6 words
    expect(hedgeDensity(en("This is actually really quite good."))).toBeCloseTo((3 / 6) * 100, 10);
  });

  it("counts subordinators per hundred words", () => {
    // because, although: 2 hits over 9 words
    const doc = en("I stayed because it rained although it was late.");
    expect(subordinationDensity(doc)).toBeCloseTo((2 / 9) * 100, 10);
  });

  it("counts nominalisations by suffix", () => {
    // organisation, statement, quality, darkness: 4 over 9 words
    const doc = en("The organisation made a statement about quality and darkness.");
    expect(nominalizationDensity(doc)).toBeCloseTo((4 / 9) * 100, 10);
  });

  it("does not count a short word that merely ends in a suffix", () => {
    // "city" ends in "ity" but is below the six-character floor.
    expect(nominalizationDensity(en("the city"))).toBe(0);
  });

  it("counts an English passive", () => {
    // "was written": 1 hit over 7 words
    expect(passiveDensity(en("The report was written by the team."))).toBeCloseTo(
      (1 / 7) * 100,
      10,
    );
  });

  it("counts a German passive and the ist-zu construction", () => {
    // "wurde geprüft" is one, "ist zu" is another: 2 over 8 words
    const doc = de("Der Bericht wurde geprüft. Das ist zu beachten.");
    expect(passiveDensity(doc)).toBeCloseTo((2 / 8) * 100, 10);
  });
});

describe("punctuation and layout", () => {
  it("counts commas per sentence", () => {
    expect(commaPerSent(en("One, two, three. Four."))).toBeCloseTo(2 / 2, 10);
  });

  it("reports the share of ten punctuation marks that appear", () => {
    // comma, semicolon, colon, open bracket, question mark: 5 of 10
    expect(punctVariety(en("Hello, world; this: is (a) test?"))).toBeCloseTo(0.5, 10);
  });

  it("counts em-dashes and en-dashes per hundred words", () => {
    expect(emDashDensity(en("a — b – c"))).toBeCloseTo((2 / 3) * 100, 10);
  });

  it("varies paragraph length against its own mean", () => {
    // paragraphs of 2 and 4 words: mean 3, population sd 1
    expect(paraLenCv(en("one two\n\nthree four five six"))).toBeCloseTo(1 / 3, 10);
  });

  it("counts balanced pairs per thousand words", () => {
    // one "not only ... but also" over 8 words
    const doc = en("This is not only cheap but also fast.");
    expect(rhetoricalPairRate(doc)).toBeCloseTo((1 / 8) * 1000, 10);
  });

  it("does not match a balanced pair across a sentence boundary", () => {
    expect(rhetoricalPairRate(en("This is not only cheap. But also fast."))).toBe(0);
  });

  it("measures repeated sentence openings", () => {
    // the, the, a: 3 openings, 2 distinct
    expect(sentStartRepetition(en("The cat sat. The dog ran. A bird flew."))).toBeCloseTo(
      1 / 3,
      10,
    );
  });
});

describe("the registry", () => {
  it("has nineteen features with unique keys", () => {
    expect(FEATURES).toHaveLength(19);
    expect(new Set(FEATURES.map((f) => f.key)).size).toBe(19);
  });

  it("returns a finite number for every feature, even on empty input", () => {
    for (const lang of ["en", "de"] as const) {
      const vector = measure("", lang);
      for (const f of FEATURES) {
        expect(Number.isFinite(vector[f.key]), `${f.key} on empty ${lang}`).toBe(true);
      }
    }
  });

  it("measures every feature in the registry", () => {
    const vector = measure("A short text, with a comma.", "en");
    expect(Object.keys(vector).sort()).toEqual(FEATURES.map((f) => f.key).sort());
  });
});
