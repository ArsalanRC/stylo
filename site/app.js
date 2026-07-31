/**
 * The page.
 *
 * It imports the library's compiled output directly, with no bundler, which is
 * the second job this demo does: if the published ES modules did not run
 * unmodified in a browser, this page would not load.
 */

import { compare, FEATURES, profileFor, words } from "./lib/index.js";

import { initChrome, prefersReduced, sleep } from "./chrome.js";
import { FEATURE_LABELS, SAMPLES, STRINGS, WARNINGS } from "./i18n.js";

const chrome = initChrome(STRINGS, { prefix: "stylo" });
const dict = () => STRINGS[chrome.lang()] ?? STRINGS.en;

/** Feature labels and warnings live on the page, not in the library. */
const labels = () => FEATURE_LABELS[chrome.lang()] ?? FEATURE_LABELS.en;
const warningText = (w) => {
  const render = (WARNINGS[chrome.lang()] ?? WARNINGS.en)[w.code];
  return render ? render(w) : w.message;
};

/**
 * Leave-one-out distances, measured by scripts/validate.mjs and pasted here.
 *
 * Computed rather than recomputed in the browser, because recomputing them
 * would mean shipping the corpus texts, and the whole point of a profile being
 * statistics rather than sources is that the texts stay where they are.
 */
const HELD_OUT = {
  en: [1.03, 0.99, 0.98, 1.05, 1.3, 1.7, 1.32, 1.33, 1.96, 1.23],
  de: [0.54, 0.88, 1.14, 2.03, 1.5, 0.74, 2.54, 1.08, 1.59, 1.24, 1.45, 1.1, 0.97],
};

// ---------------------------------------------------------------------------
// The instrument
// ---------------------------------------------------------------------------

const input = document.getElementById("input");
const wordCount = document.getElementById("wordcount");
const rows = document.getElementById("rows");
const distanceEl = document.getElementById("distance");

const noteEl = document.getElementById("verdict-note");
const warnEl = document.getElementById("warnings");

/** Last result, kept so a language switch can re-render without re-measuring. */
let current = null;

/**
 * Which sample is loaded, if any, so a language switch can swap it.
 *
 * Without this, switching to English leaves the German sample in the box and
 * measures it against the English corpus. The numbers that come back are
 * enormous and they mean "wrong profile", not "unusual writing", which is the
 * opposite of what this page is trying to teach.
 */
let loadedSample = null;

function countWords() {
  const n = words(input.value).length;
  wordCount.textContent = dict()["try.words"](n);
}

/**
 * Placeholders, which the shared chrome does not handle.
 *
 * It translates textContent and innerHTML, and a placeholder is neither. Kept
 * here rather than pushed into chrome.js because this is the only page so far
 * with a text field, and a shared file should grow when the second caller
 * appears, not the first.
 */
function applyPlaceholders() {
  const d = dict();
  for (const node of document.querySelectorAll("[data-i18n-placeholder]")) {
    const value = d[node.dataset.i18nPlaceholder];
    if (value !== undefined) node.placeholder = value;
  }
}

/**
 * Where a value sits on its row, as a percentage.
 *
 * Each feature gets its own axis, because they are in different units and a
 * shared one would be meaningless. The axis spans the corpus range and the
 * measured value together, padded, so a value far outside the corpus still
 * lands on the track instead of off the end of it.
 */
function axis(band, value) {
  const lo = Math.min(band.min, value);
  const hi = Math.max(band.max, value);
  const pad = (hi - lo) * 0.12 || 1;
  const from = lo - pad;
  const span = hi - lo + pad * 2;
  return (x) => `${(((x - from) / span) * 100).toFixed(2)}%`;
}

function render(result) {
  const d = dict();

  distanceEl.firstChild.nodeValue = result.distance.toFixed(2);

  const outside = result.features.filter((f) => !f.insideBand).length;
  noteEl.textContent = d["try.note"](outside, result.features.length);

  warnEl.textContent = result.warnings.map(warningText).join(" ");

  // Ordered by the registry rather than by deviation, so a row does not jump to
  // a different place on the page every time the text changes. The rank is
  // already carried by the marker's position and the colour.
  const order = new Map(FEATURES.map((f, i) => [f.key, i]));
  const sorted = [...result.features].sort(
    (a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0),
  );

  rows.replaceChildren(
    ...sorted.map((f) => {
      const at = axis(f.band, f.value);

      const row = el("div", `row${f.insideBand ? "" : " is-out"}`);
      row.append(el("div", "row-label", labels()[f.key] ?? f.label));

      const track = el("div", "track");
      const band = el("div", "track-band");
      band.style.left = at(f.band.p10);
      band.style.width = `calc(${at(f.band.p90)} - ${at(f.band.p10)})`;
      const median = el("div", "track-median");
      median.style.left = at(f.band.p50);
      const mark = el("div", "track-mark");
      // Start every marker at the corpus median, then move it to the measured
      // value on the next frame. The travel is the point: the row shows a value
      // arriving somewhere relative to the band, not a static bar.
      mark.style.left = at(f.band.p50);
      track.append(band, median, mark);
      row.append(track);

      row.append(el("div", "row-z", `${f.z >= 0 ? "+" : ""}${f.z.toFixed(1)}`));

      requestAnimationFrame(() => {
        mark.style.left = at(f.value);
      });
      return row;
    }),
  );
}

function measure() {
  const text = input.value.trim();
  if (!text) return;
  current = compare(text, profileFor(chrome.lang()));
  render(current);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function loadSample(which) {
  loadedSample = which;
  input.value = (SAMPLES[chrome.lang()] ?? SAMPLES.en)[which];
  countWords();
  measure();
}

input.addEventListener("input", () => {
  // Anything typed is the visitor's own text, so a language switch must stop
  // replacing it.
  loadedSample = null;
  countWords();
});

document.getElementById("measure").addEventListener("click", measure);
document.getElementById("sample-even").addEventListener("click", () => loadSample("even"));
document.getElementById("sample-uniform").addEventListener("click", () => loadSample("uniform"));

document.getElementById("clear").addEventListener("click", () => {
  input.value = "";
  current = null;
  loadedSample = null;
  countWords();
  rows.replaceChildren();
  warnEl.textContent = "";
  distanceEl.firstChild.nodeValue = "0.00";
  noteEl.textContent = dict()["try.awaiting"];
});

// ---------------------------------------------------------------------------
// The scale
// ---------------------------------------------------------------------------

const SCALE_MAX = 3;
const axisEl = document.getElementById("scale-axis");

function buildScale() {
  const at = (d) => `${((d / SCALE_MAX) * 100).toFixed(2)}%`;
  const parts = [];

  for (const tick of [0, 1, 2, 3]) {
    const t = el("i", "scale-tick");
    t.style.left = at(tick);
    const label = document.createElement("b");
    label.textContent = String(tick);
    t.append(label);
    parts.push(t);
  }

  for (const [lang, values] of Object.entries(HELD_OUT)) {
    for (const v of values) {
      const dot = el("i", `dot lang-${lang}`);
      dot.style.left = at(Math.min(v, SCALE_MAX));
      dot.title = v.toFixed(2);
      parts.push(dot);
    }
  }

  axisEl.replaceChildren(...parts);
  return parts.filter((p) => p.classList.contains("dot"));
}

const dots = buildScale();

/** Deal the dots in one at a time, once, when the section is first seen. */
async function dealDots() {
  for (const dot of dots) {
    dot.classList.add("is-on");
    await sleep(45);
  }
}

if (prefersReduced) {
  for (const dot of dots) dot.classList.add("is-on");
} else {
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        seen.disconnect();
        dealDots();
      }
    },
    { threshold: 0.35 },
  );
  seen.observe(document.getElementById("scale"));
}

// ---------------------------------------------------------------------------

// Feature labels come out of the library, so a language switch has to re-measure
// rather than merely re-translate: the profile itself is per language.
chrome.onLangChange(() => {
  applyPlaceholders();
  if (loadedSample) {
    loadSample(loadedSample);
    return;
  }
  countWords();
  if (current) measure();
  else noteEl.textContent = dict()["try.awaiting"];
});

applyPlaceholders();
countWords();
noteEl.textContent = dict()["try.awaiting"];
