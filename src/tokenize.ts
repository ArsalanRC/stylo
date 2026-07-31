// Splitting text into paragraphs, sentences and words.
//
// Every feature in features.ts is a ratio over one of these three units, so a
// bug here moves every number at once and moves them quietly. That is the reason
// this lives in its own module with its own tests rather than inline: a wrong
// sentence count does not throw, it just reports prose as choppier than it is.

export type Lang = "de" | "en";

/**
 * Abbreviations that end in a full stop and do not end a sentence.
 *
 * Without this list a German text using "z. B." reports two sentences where a
 * reader sees one, which deflates mean sentence length and inflates the share of
 * very short sentences. Both of those are features we report, so the error would
 * show up as a stylistic finding rather than as a parsing failure. That is the
 * worst kind of bug in a measurement tool: it produces a plausible number.
 *
 * The list is deliberately short. It covers what actually appears in academic
 * prose rather than trying to be exhaustive, because every entry is also a way
 * to miss a real sentence boundary when a sentence genuinely ends in "no."
 */
const ABBREVIATIONS: Record<Lang, readonly string[]> = {
  de: [
    "z",
    "b",
    "d",
    "h",
    "bzw",
    "ca",
    "vgl",
    "ggf",
    "evtl",
    "inkl",
    "exkl",
    "sog",
    "u",
    "a",
    "s",
    "nr",
    "abb",
    "tab",
    "bspw",
    "insb",
    "dr",
    "prof",
  ],
  en: [
    "e",
    "g",
    "i",
    "cf",
    "vs",
    "etc",
    "fig",
    "tab",
    "no",
    "approx",
    "dr",
    "prof",
    "st",
    "mr",
    "mrs",
    "ms",
  ],
};

/** Letters, including the German set and the apostrophes English contracts on. */
const WORD_RE = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;

/**
 * Paragraphs, split on blank lines.
 *
 * Markdown headings and list bullets are left in place on purpose. Stripping
 * them would mean guessing at a markup language the caller never said it was
 * using, and the caller can strip what it knows about before calling.
 */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Sentences, split on terminal punctuation followed by whitespace.
 *
 * A boundary is rejected when the token before the full stop is a known
 * abbreviation, or when it is a single digit, which is what an enumerated list
 * ("1. The first point") looks like to a splitter.
 */
export function sentences(text: string, lang: Lang): string[] {
  const abbrevs = new Set(ABBREVIATIONS[lang]);
  const out: string[] = [];
  let start = 0;

  // Terminal punctuation, optionally carrying a footnote marker. See below for
  // why the digits are part of the pattern rather than something to skip past.
  const boundary = /[.!?]+(\d{1,3})?/g;
  let match: RegExpExecArray | null;

  while ((match = boundary.exec(text)) !== null) {
    const end = match.index + match[0].length;
    const preceding = text.slice(start, match.index);
    const following = text.slice(end);
    const footnote = match[1];

    // A full stop with whitespace in front of it is not ending anything. That is
    // what dot leaders in a table of contents look like ("Chapter one . . . . 40"),
    // and treating each one as a boundary turns a contents page into fifty
    // one-word sentences. Found in a real corpus text, where it dragged the
    // measured mean sentence length down to 5.5 words against a corpus mean of 20.
    if (preceding.length === 0 || /\s$/.test(preceding)) continue;

    if (footnote !== undefined) {
      // German academic prose cites in superscript footnotes, and extracting the
      // text from a PDF flattens them onto the full stop: "Phänomens.82 Aus der".
      // Without this branch there is no whitespace after the stop, so no boundary
      // is found and sentences merge until the next uncited one. One corpus text
      // reported a 457-word sentence and a mean of 46 against a corpus mean of 21.
      //
      // The two guards are what keep "Abschnitt 1.2 zeigt" from splitting: a
      // footnote marker follows a letter, and the next sentence opens uppercase.
      if (!/[\p{L}\p{M}]$/u.test(preceding)) continue;
      if (!/^\s+[\p{Lu}]/u.test(following)) continue;
    } else {
      if (!/^(\s|$)/.test(following)) continue;
      if (match[0] === "." && endsInNonBoundary(preceding, abbrevs)) continue;
    }

    const sentence = text.slice(start, end).trim();
    if (sentence.length > 0) out.push(sentence);
    start = end;
  }

  const tail = text.slice(start).trim();
  if (tail.length > 0) out.push(tail);

  return out;
}

/** True when the full stop after this text is an abbreviation or a list number. */
function endsInNonBoundary(preceding: string, abbrevs: ReadonlySet<string>): boolean {
  const lastToken = /([\p{L}\p{M}\d]+)$/u.exec(preceding);
  if (!lastToken) return false;

  const token = lastToken[1]!.toLowerCase();

  // "1." and "12." open a list item rather than closing a sentence.
  if (/^\d{1,2}$/.test(token)) return true;

  return abbrevs.has(token);
}

/** Words, punctuation and digits excluded. */
export function words(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}
