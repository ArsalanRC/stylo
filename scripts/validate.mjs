// Leave-one-out validation of the distance scale.
//
//   node scripts/validate.mjs <corpus-dir> <de|en>
//
// compare() claims that a distance near 1 means "sits where corpus texts sit".
// That claim is checkable: hold out each corpus text in turn, build the profile
// from the rest, and measure the held-out text against it. Every one of them is
// genuine human academic prose, so their distances are what "typical" actually
// looks like on this scale.
//
// Without this the scale would be an assertion. The README quotes its output,
// and the numbers there should be reproducible by running this.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { compare } from "../dist/compare.js";
import { buildProfile } from "../dist/profile.js";

const [dir, lang] = process.argv.slice(2);

if (!dir || (lang !== "de" && lang !== "en")) {
  console.error("usage: node scripts/validate.mjs <corpus-dir> <de|en>");
  process.exit(2);
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith(".txt"))
  .sort();
const texts = files.map((f) => readFileSync(join(dir, f), "utf8"));

const rows = texts.map((text, i) => {
  const profile = buildProfile(
    texts.filter((_, j) => j !== i),
    lang,
  );
  return { file: files[i], distance: compare(text, profile).distance };
});

for (const r of [...rows].sort((a, b) => a.distance - b.distance)) {
  console.log(`  ${r.distance.toFixed(2).padStart(5)}  ${r.file}`);
}

const ds = rows.map((r) => r.distance).sort((a, b) => a - b);
const median = ds[Math.floor(ds.length / 2)];
const mean = ds.reduce((a, b) => a + b, 0) / ds.length;

console.log(
  `\n${lang}: ${ds.length} held out. min ${ds[0].toFixed(2)}, ` +
    `median ${median.toFixed(2)}, mean ${mean.toFixed(2)}, max ${ds[ds.length - 1].toFixed(2)}`,
);
