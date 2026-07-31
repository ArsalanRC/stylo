/**
 * stylo, the instrument.
 *
 * Imports the library's own compiled ES modules with no bundler, so the deploy
 * also proves the published output runs unmodified in a browser. If the ESM
 * build were broken this page would not load at all.
 *
 * Three things happen here: the readout, the scroll-linked statement in the
 * light section, and translation. Everything else is CSS.
 */

import { compare, FEATURES, profileFor, words } from "./lib/index.js";
import { FEATURE_LABELS, SAMPLES, STRINGS, WARNINGS } from "./i18n.js";

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const dict = () => STRINGS[root.lang] ?? STRINGS.en;
const labels = () => FEATURE_LABELS[root.lang] ?? FEATURE_LABELS.en;
const warningText = (w) => {
  const render = (WARNINGS[root.lang] ?? WARNINGS.en)[w.code];
  return render ? render(w) : w.message;
};

/**
 * Leave-one-out distances, measured by scripts/validate.mjs and pasted here.
 *
 * Not recomputed in the browser, because recomputing would mean shipping the
 * corpus texts, and the whole point of a profile being statistics rather than
 * sources is that the texts stay where they are.
 */
const HELD_OUT = {
  en: [1.03, 0.99, 0.98, 1.05, 1.3, 1.7, 1.32, 1.33, 1.96, 1.23],
  de: [0.54, 0.88, 1.14, 2.03, 1.5, 0.74, 2.54, 1.08, 1.59, 1.24, 1.45, 1.1, 0.97],
};

/* ------------------------------------------------------------ translation -- */

function applyLang(lang) {
  root.lang = lang;
  const d = dict();

  for (const el of document.querySelectorAll("[data-i18n]")) {
    const v = d[el.dataset.i18n];
    if (v !== undefined) el.textContent = v;
  }
  /* A separate attribute for the few strings that legitimately carry markup,
     so the common path never assigns innerHTML. */
  for (const el of document.querySelectorAll("[data-i18n-html]")) {
    const v = d[el.dataset.i18nHtml];
    if (v !== undefined) el.innerHTML = v;
  }
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
    const v = d[el.dataset.i18nPlaceholder];
    if (v !== undefined) el.placeholder = v;
  }
  if (d["meta.title"]) document.title = d["meta.title"];

  buildStatement();
  try { localStorage.setItem("stylo-lang", lang); } catch { /* private mode */ }
}

document.getElementById("lang-btn")?.addEventListener("click", () => {
  applyLang(root.lang === "de" ? "en" : "de");
  if (loaded) loadSample(loaded);
  else if (current) measure();
  countWords();
});

/* ---------------------------------------------------------------- readout -- */

const input = document.getElementById("input");
const rows = document.getElementById("rows");
const distanceEl = document.getElementById("distance");
const noteEl = document.getElementById("note");
const warnEl = document.getElementById("warn");
const countEl = document.getElementById("count");

let current = null;
let loaded = null;

function countWords() {
  countEl.textContent = dict()["try.words"](words(input.value).length);
}

/**
 * How many of the five bars are lit.
 *
 * Capped at five deliberately. Past about three standard deviations the exact
 * number stops carrying information a reader can use, and an uncapped meter
 * would make one wild feature dwarf the rest of the column.
 */
const lit = (z) => Math.min(5, Math.max(1, Math.ceil(Math.abs(z))));

function render(result) {
  const d = dict();

  distanceEl.textContent = result.distance.toFixed(2);
  const outside = result.features.filter((f) => !f.insideBand).length;
  noteEl.textContent = d["try.note"](outside, result.features.length);
  warnEl.textContent = result.warnings.map(warningText).join(" ");

  /* Registry order, not sorted by deviation. A row that jumps to a different
     place every time the text changes cannot be watched, and this is a meter
     you are meant to watch. */
  const order = new Map(FEATURES.map((f, i) => [f.key, i]));
  const sorted = [...result.features].sort(
    (a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0),
  );

  rows.replaceChildren(...sorted.map((f) => {
    const mag = Math.abs(f.z);
    const state = f.insideBand ? "" : mag < 2 ? " is-near" : " is-out";

    const row = document.createElement("div");
    row.className = `row${state}`;

    const label = document.createElement("span");
    label.className = "row-label";
    label.textContent = labels()[f.key] ?? f.label;

    const meter = document.createElement("span");
    meter.className = "meter";
    const on = lit(f.z);
    for (let i = 0; i < 5; i++) {
      const bar = document.createElement("i");
      /* Bars fill from the bottom, like a level. */
      if (i >= 5 - on) bar.className = "on";
      meter.append(bar);
    }

    const val = document.createElement("span");
    val.className = "row-val";
    val.textContent = f.value.toFixed(2);

    const z = document.createElement("span");
    z.className = "row-z";
    z.textContent = `${f.z >= 0 ? "+" : ""}${f.z.toFixed(1)}`;

    row.append(label, meter, val, z);
    return row;
  }));
}

function measure() {
  const text = input.value.trim();
  if (!text) return;
  current = compare(text, profileFor(root.lang));
  render(current);
}

function loadSample(which) {
  loaded = which;
  input.value = (SAMPLES[root.lang] ?? SAMPLES.en)[which];
  countWords();
  measure();
}

input.addEventListener("input", () => { loaded = null; countWords(); });
document.getElementById("measure").addEventListener("click", measure);
document.getElementById("sample-even").addEventListener("click", () => loadSample("even"));
document.getElementById("sample-uniform").addEventListener("click", () => loadSample("uniform"));
document.getElementById("clear").addEventListener("click", () => {
  input.value = ""; current = null; loaded = null;
  countWords();
  rows.replaceChildren();
  warnEl.textContent = "";
  distanceEl.textContent = "0.00";
  noteEl.textContent = dict()["try.awaiting"];
});

/* ------------------------------------------------------ the statement --- */
/* The light section's sentence darkens word by word as it passes up the
   viewport, so the one paragraph on this page that must not be skimmed is
   physically slow to read. It is the limitations, which is the part every
   detector buries and the part this project leads with. */

const revealEl = document.getElementById("reveal");

function buildStatement() {
  if (!revealEl) return;
  const spec = dict()[revealEl.dataset.reveal];
  if (!spec) return;

  revealEl.replaceChildren(...spec.flatMap((chunk) => {
    const [text, accent] = Array.isArray(chunk) ? chunk : [chunk, false];
    return text.split(" ").map((word) => {
      const s = document.createElement("span");
      s.className = `w${accent ? " accent" : ""}`;
      s.textContent = word + " ";
      return s;
    });
  }));

  if (reduced) for (const w of revealEl.querySelectorAll(".w")) w.classList.add("on");
  else paintStatement();
}

function paintStatement() {
  if (!revealEl || reduced) return;
  const wordsEls = revealEl.querySelectorAll(".w");
  if (!wordsEls.length) return;

  const box = revealEl.getBoundingClientRect();
  /* Progress runs from the block entering the lower third to it leaving the
     upper third, so the sentence finishes before it scrolls off. */
  const start = innerHeight * 0.78;
  const end = innerHeight * 0.28;
  const p = (start - box.top) / (start - end + box.height);
  const upto = Math.round(Math.min(1, Math.max(0, p)) * wordsEls.length);

  wordsEls.forEach((w, i) => w.classList.toggle("on", i < upto));
}

/* ---------------------------------------------------------------- scale -- */

const axis = document.getElementById("axis");
const MAX = 3;

function buildScale() {
  if (!axis) return [];
  const at = (d) => `${((d / MAX) * 100).toFixed(2)}%`;
  const parts = [];

  for (const t of [0, 1, 2, 3]) {
    const tick = document.createElement("i");
    tick.className = "tick";
    tick.style.left = at(t);
    const b = document.createElement("b");
    b.textContent = String(t);
    tick.append(b);
    parts.push(tick);
  }

  for (const [lang, values] of Object.entries(HELD_OUT)) {
    for (const v of values) {
      const dot = document.createElement("i");
      dot.className = `dot${lang === "de" ? " de" : ""}`;
      dot.style.left = at(Math.min(v, MAX));
      dot.title = v.toFixed(2);
      parts.push(dot);
    }
  }

  axis.replaceChildren(...parts);
  return [...axis.querySelectorAll(".dot")];
}

const dots = buildScale();
let dealt = reduced;
if (reduced) dots.forEach((d) => d.classList.add("is-on"));

/* --------------------------------------------------------------- scroll -- */
/* One rAF-throttled handler for everything that depends on scroll position.
 *
 * Deliberately a position check rather than an IntersectionObserver: the
 * observer coalesces callbacks, so anything entering and leaving between two
 * ticks never reports and stays invisible forever. That bug cost a third of
 * the portfolio page before it was caught. A position cannot be missed. */

const rises = reduced ? [] : [...document.querySelectorAll(".rise")];
if (reduced) for (const el of document.querySelectorAll(".rise")) el.classList.add("is-in");

let queued = false;

function onScroll() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;

    const limit = innerHeight * 0.9;
    for (let i = rises.length - 1; i >= 0; i--) {
      if (rises[i].getBoundingClientRect().top >= limit) continue;
      rises[i].style.transitionDelay = `${Math.min(i, 4) * 60}ms`;
      rises[i].classList.add("is-in");
      rises.splice(i, 1);
    }

    paintStatement();

    if (!dealt && axis && axis.getBoundingClientRect().top < innerHeight * 0.85) {
      dealt = true;
      dots.forEach((d, i) => setTimeout(() => d.classList.add("is-on"), i * 45));
    }
  });
}

addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll, { passive: true });
addEventListener("load", onScroll);
document.fonts?.ready.then(onScroll);

/* ------------------------------------------------------------------------ */

applyLang(root.lang === "de" ? "de" : "en");
countWords();
noteEl.textContent = dict()["try.awaiting"];
onScroll();
