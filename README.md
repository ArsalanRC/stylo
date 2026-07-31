# stylo

**English** · [Deutsch](./README.de.md)

Measures nineteen things about a text and shows you where each one sits against a corpus of human academic writing. It does not tell you who wrote it.

TypeScript, **zero runtime dependencies**, English and German.

**[Try it in the browser](https://arsalanrc.github.io/stylo/)**: paste a text, see every feature against its corpus band. Nothing to install.

```bash
pnpm add github:ArsalanRC/stylo
```

## What this cannot tell you

Worth putting first, because the answer people want from a tool like this is one it cannot give.

**It cannot tell you whether a text was written by a machine.** There is no output that says so. What it reports is a distance from a measured distribution and the nineteen numbers that distance is made of. Human writing that is unusual scores far from the corpus. Machine writing that is ordinary scores close to it. Those are both correct results and neither is an authorship finding.

**A large distance is not evidence of anything.** Stylometric detectors produce false positives, and they produce them unevenly: writing by non-native speakers is flagged far more often, and students have been accused on the strength of exactly this kind of number. If you are holding a number from this library and thinking about confronting someone with it, the number does not support that and neither does its author.

**The corpus is small and specific.** Ten English papers and thirteen German dissertations. It describes academic prose in those two registers and nothing else. A novel measured against it will look strange because it is a novel.

**Several features cannot mean much on a short passage.** Repeated sentence openings can only rise as sentences accumulate; one formal connective in forty words is a rate no full paper could reach. Below 300 words `compare` attaches a warning saying so, and the warning is the part to read.

What it is good for is editing your own writing. "Your sentences are all the same length and you use *moreover* four times more than any paper in the corpus" is useful and checkable. "This is 87% AI" is neither.

## The three calls

```ts
import { compare, measure, profileFor } from "@arsalanrc/stylo";

// One text, nineteen numbers.
measure("Your text here.", "en");
// → { sent_len_mean: 3, sent_len_std: 0, mattr: 1, ... }

// One text, placed against the bundled corpus.
const result = compare(longText, profileFor("en"));

result.distance; // 1.24
result.warnings; // [] when the text is long enough to mean something

for (const f of result.features) {
  // Sorted by how far each sits from the corpus, furthest first.
  console.log(f.label, f.value, f.band.p10, f.band.p90, f.insideBand);
}
```

There is no function that returns the distance on its own. That is deliberate rather than an omission: a summary number travelling without its breakdown is the thing this library is an alternative to, and an API that made it convenient would get used that way.

## Reading a distance

The distance is the root mean square of the nineteen standard scores. On that scale 1 is what a text drawn from the same distribution as the corpus looks like.

That is a checkable claim, so it is checked. `scripts/validate.mjs` holds out each corpus text in turn, builds the profile from the rest, and measures the held-out text against it. Every one is genuine human academic prose, so their distances are what typical actually looks like:

| | min | median | mean | max |
|---|---|---|---|---|
| English, 10 held out | 0.98 | 1.30 | 1.29 | 1.96 |
| German, 13 held out | 0.54 | 1.14 | 1.29 | 2.54 |

So: around 1 is unremarkable, and past about 2.5 a text is unusual against this corpus on several features at once. The `features` array says which, and that is the answer, not the distance.

## What it measures

Nineteen features, each a plain descriptive statistic, each its own exported function.

| | |
|---|---|
| Sentence shape | mean length, spread, variation, share of sentences under 7 words and over 28 |
| Vocabulary | lexical diversity (MATTR-50), mean word length, share of words over 14 characters |
| Word classes | formal connectives, hedges, passive constructions, nominalisations, subordinators |
| Punctuation | commas per sentence, punctuation range, dashes |
| Layout | paragraph-length variation, balanced pairs, repeated sentence openings |

None of them carries a direction or a weight. A feature that knows which way is bad has an argument built into it that the caller cannot see, and the argument here belongs to the reader.

The word lists are exported (`FORMAL_CONNECTORS`, `HEDGES`, `SUBORDINATORS`) so anyone reading a result can see exactly what was counted. The passive and nominalisation counts are approximations, documented as such in the source: they are suffix and lexicon matches, not a parser. That bias is roughly constant across texts in a language, and since a text is compared against a corpus measured by the same functions, a constant bias cancels.

## The profile is statistics, not texts

A profile holds the mean, standard deviation and the tenth, fiftieth and ninetieth percentiles of each feature across a set of reference texts. It does not hold the texts.

That is the main design decision here and it does three things at once. The reference texts are published papers and dissertations, so redistributing them is not mine to do, while nineteen aggregated numbers per text carry no recoverable prose. It is a few kilobytes of JSON, so the browser demo loads it without a fetch. And it makes the tool retargetable: point `scripts/build-profile.mjs` at ten of your own reports and you are measuring the eleventh against your own register instead of against dissertations, which is almost always the more useful question.

```bash
node scripts/build-profile.mjs ./my-corpus en
```

The unit is the text, not the sentence. Ten papers give ten observations per feature, and the spread that matters is the variation between authors, because that is what a new text is being placed against. Pooling every sentence instead would measure variation inside a document and produce far tighter bands that mean something else.

## Two bugs the corpus found

Both were found by measuring the reference corpus and looking at the outliers, not by a unit test. Both are regression-tested now.

**A contents page read as fifty one-word sentences.** One English source reported a mean sentence length of 5.5 words against a corpus mean of 20. It was a table of contents with dot leaders: `Corpus composition . . . . . . 40`. Each `. ` looked like a sentence boundary. The rule that fixes it is that a full stop with whitespace in front of it never ends a sentence.

**German footnotes merged sentences into one.** A German source reported a mean of 46 words and a single sentence of 457. Extracting German academic text from a PDF flattens superscript footnote markers onto the full stop, so `Phänomens.82 Aus der` has no whitespace after the stop and no boundary is found until the next uncited sentence. Handling it needs two guards, or `Abschnitt 1.2 zeigt` starts splitting too: a footnote marker follows a letter, and the next sentence opens with a capital.

Both are the same kind of bug and the reason to write them down is that neither one throws. They return a plausible number, and a plausible number in a measurement tool is worse than a crash.

## Tests

61 tests, on Node 18, 20 and 22.

```bash
pnpm install
pnpm test
```

Every expected value in the feature tests is arithmetic written out by hand in the test, never a value copied back out of a run. A stylometric feature has no reference implementation to diff against, so a test recording whatever the code produced would prove only that the code is deterministic.

## Licence

MIT

Built by [Arsalan Khadim](https://www.linkedin.com/in/muhammad-arsalan-khadim-b87550259/) · [GitHub](https://github.com/ArsalanRC)
