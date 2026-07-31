import { describe, expect, it } from "vitest";

import { paragraphs, sentences, words } from "../src/tokenize.js";

describe("sentences", () => {
  it("splits on terminal punctuation", () => {
    expect(sentences("One. Two! Three?", "en")).toEqual(["One.", "Two!", "Three?"]);
  });

  it("keeps a trailing fragment that has no terminal punctuation", () => {
    expect(sentences("Done. And then this", "en")).toEqual(["Done.", "And then this"]);
  });

  it("does not split inside a known abbreviation", () => {
    expect(sentences("Dr. Smith went home. He slept.", "en")).toEqual([
      "Dr. Smith went home.",
      "He slept.",
    ]);
  });

  it("does not split inside the German z. B.", () => {
    expect(sentences("Etwa z. B. hier. Danach mehr.", "de")).toEqual([
      "Etwa z. B. hier.",
      "Danach mehr.",
    ]);
  });

  it("does not treat an enumerated list number as a sentence end", () => {
    expect(sentences("1. First point. 2. Second point.", "en")).toEqual([
      "1. First point.",
      "2. Second point.",
    ]);
  });

  // Regression: a contents page with dot leaders reported one sentence per dot,
  // which pulled one corpus text down to a mean of 5.5 words against a corpus
  // mean of 20. A full stop preceded by whitespace never ends a sentence.
  it("ignores dot leaders in a table of contents", () => {
    const toc = "Corpus composition . . . . . . 40";
    expect(sentences(toc, "en")).toEqual([toc]);
  });

  // Regression: extracting German academic text from a PDF flattens superscript
  // footnote markers onto the full stop, so no whitespace follows it and every
  // sentence after the citation merged into one. Measured a 457-word sentence.
  it("splits when a footnote marker is glued to the full stop", () => {
    expect(sentences("Ein erster Satz.82 Der nächste Satz.", "de")).toEqual([
      "Ein erster Satz.82",
      "Der nächste Satz.",
    ]);
  });

  it("does not split a decimal section number", () => {
    expect(sentences("Abschnitt 1.2 zeigt das.", "de")).toEqual(["Abschnitt 1.2 zeigt das."]);
  });

  it("does not treat a footnote marker as a boundary before a lowercase word", () => {
    expect(sentences("Das Modell.3 zeigt nichts.", "de")).toEqual(["Das Modell.3 zeigt nichts."]);
  });
});

describe("words", () => {
  it("excludes punctuation and digits", () => {
    expect(words("Two words, 42 times!")).toEqual(["Two", "words", "times"]);
  });

  it("keeps German letters together", () => {
    expect(words("Größe Straße Übung")).toEqual(["Größe", "Straße", "Übung"]);
  });

  it("keeps an English contraction as one word", () => {
    expect(words("it doesn't matter")).toEqual(["it", "doesn't", "matter"]);
  });
});

describe("paragraphs", () => {
  it("splits on blank lines and drops empties", () => {
    expect(paragraphs("First para.\n\n\n  \n\nSecond para.\n")).toEqual([
      "First para.",
      "Second para.",
    ]);
  });

  it("treats a single newline as the same paragraph", () => {
    expect(paragraphs("One line\nand the next")).toEqual(["One line\nand the next"]);
  });
});
