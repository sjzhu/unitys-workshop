// Node round-trip harness for the JSON field registry.
//
//   node tools/json-roundtrip.mjs
//
// This does NOT load the whole browser bundle (common-*.js are classic scripts
// full of top-level DOM work, not modules, and there is no jsdom in this repo).
// Instead it slices out the registry literals + the new helper functions and
// runs them against a tiny in-memory "DOM" (a Map of selector -> value). That is
// enough to exercise applyField / readField / applyImageGroup / readImageGroup
// and prove the registry round-trips, and to diff the new per-tool export key
// sets against the hand-written templates on `origin/main`.
//
// Real-browser fidelity (actual jQuery, range-slider clamping, and executing the
// OLD vs NEW parseJSONData/outputJSONData) was covered by the original browser
// prototype; this tracked harness exercises the maintained registry contract.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const before = fs.readFileSync(path.join(ROOT, "common-before.js"), "utf8");
const after = fs.readFileSync(path.join(ROOT, "common-after.js"), "utf8");
// Baseline templates come from origin/main (the working tree no longer has them).
const afterMain = execFileSync("git", ["show", "origin/main:common-after.js"], {
  cwd: ROOT,
  encoding: "utf8",
});

// --- crude but sufficient source slicing --------------------------------------

function sliceBalanced(src, startIdx, open, close) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close) {
      depth--;
      if (depth === 0) return src.slice(startIdx, i + 1);
    }
  }
  throw new Error("unbalanced " + open);
}

function grabConstArray(src, name) {
  const m = src.indexOf(`const ${name} = [`);
  if (m < 0) throw new Error(`${name} not found`);
  return sliceBalanced(src, src.indexOf("[", m), "[", "]");
}

function grabFunction(src, name) {
  const m = src.search(new RegExp(`function ${name}\\s*\\(`));
  if (m < 0) throw new Error(`function ${name} not found`);
  const body = sliceBalanced(src, src.indexOf("{", m), "{", "}");
  const params = src.slice(src.indexOf("(", m) + 1, src.indexOf(")", m));
  return { params, body };
}

// --- fake DOM ----------------------------------------------------------------

class FakeImage {
  set src(v) { this._src = v; }
  get src() { return this._src; }
  set onload(fn) { /* fire synchronously so drawCardCanvas() is exercised */ if (fn) fn(); }
}

function makeContext() {
  const store = new Map(); // selector string -> { value, checked }
  const entry = (sel) => {
    if (!store.has(sel)) store.set(sel, { value: undefined, checked: false });
    return store.get(sel);
  };
  function $(sel) {
    const e = entry(sel);
    const node = { get checked() { return e.checked; }, set checked(v) { e.checked = v; } };
    return {
      length: 1, // pretend every selector matches exactly one element
      0: node,
      val(v) { if (arguments.length === 0) return e.value; e.value = v; return this; },
      attr() { return undefined; },
    };
  }
  const ctx = {
    $, Image: FakeImage, console,
    Number, parseInt, JSON, Object, Array, String, Boolean,
    drawCardCanvas: () => { ctx.__draws = (ctx.__draws || 0) + 1; },
    loadedUserImages: {},
    cardArtImage: null,
    // category + image-purpose constants used by the registry literals
    BASIC: "basic", ENVIRONMENT: "environment", HERO_CHAR: "hero_character",
    VILLAIN_CHAR: "villain_character", PRINCIPLES: "principles",
    FRONT: "front", BACK: "back",
    BACKGROUND_ART: "backgroundArt", FOREGROUND_ART: "foregroundArt",
    NEMESIS_ICON: "nemesisIcon", NAME_LOGO: "nameLogo",
    IMAGE_X: "inputImageOffsetX", IMAGE_Y: "inputImageOffsetY", IMAGE_ZOOM: "inputImageScale",
    // top-level lets the checkbox setState callbacks write to
    suddenly: false, showBorder: true, isVariant: false, variantTextColor: false,
    useHighContrastPhaseLabels: false,
  };
  ctx.__store = store;
  vm.createContext(ctx);
  return ctx;
}

// --- assemble & load --------------------------------------------------------

const helperNames = [
  "getImagePurposeSelector", "extractImageURL",
  "parseZoom", "findFieldValue", "applyField", "readField",
  "imageGroupURLKey", "findImageAdjust", "applyImageGroup", "readImageGroup",
  "registryEntryApplies", "parseJSONData",
];

const ctx = makeContext();

vm.runInContext(
  `var CARD_FIELDS = ${grabConstArray(before, "CARD_FIELDS")};\n` +
  `var IMAGE_FIELD_GROUPS = ${grabConstArray(before, "IMAGE_FIELD_GROUPS")};\n` +
  `var JSON_FIELD_PROFILES = ${grabConstArray(before, "JSON_FIELD_PROFILES")};\n`,
  ctx
);

for (const name of helperNames) {
  const fn = grabFunction(after, name);
  vm.runInContext(`function ${name}(${fn.params}) ${fn.body}`, ctx);
}

// --- OLD outputJSONData template key sets (extracted from source) -----------

function oldTemplateKeys(category, face) {
  const marker = category === "hero_character" && face === "back"
    ? 'category == HERO_CHAR && FACE == "back"'
    : {
      basic: "category == BASIC || category == ENVIRONMENT",
      environment: "category == BASIC || category == ENVIRONMENT",
      hero_character: "category == HERO_CHAR)",
      villain_character: "category == VILLAIN_CHAR",
      principles: "category == PRINCIPLES",
    }[category];
  const i = afterMain.indexOf(marker);
  if (i < 0) throw new Error(`baseline template marker not found: ${marker}`);
  const a = afterMain.indexOf("`", i);
  const b = afterMain.indexOf("`", a + 1); // templates here have no nested/escaped backticks
  const tmpl = afterMain.slice(a, b + 1);
  return [...tmpl.matchAll(/"([A-Za-z]+)":/g)].map((m) => m[1]);
}

// --- sample builder --------------------------------------------------------

function buildSample(category, face, useAliases) {
  const s = {};
  for (const f of ctx.CARD_FIELDS) {
    if (!ctx.registryEntryApplies(f, category, face)) continue;
    if (f.kind === "number") s[f.key] = 88;
    else if (f.kind === "checkbox") s[f.key] = true;
    else if (f.kind === "select") s[f.key] = "play";
    else s[f.key] = f.key + " sample";
  }
  for (const g of ctx.IMAGE_FIELD_GROUPS) {
    if (!ctx.registryEntryApplies(g, category, face)) continue;
    const prefix = useAliases && g.aliasPrefixes ? g.aliasPrefixes[0] : g.keyPrefix;
    const urlKey = prefix === g.keyPrefix ? g.urlKey || g.keyPrefix + "URL" : prefix + "URL";
    s[urlKey] = "https://example.invalid/" + prefix + ".png";
    s[prefix + "X"] = 11;
    s[prefix + "Y"] = -7;
    s[prefix + "Zoom"] = 133;
  }
  return s;
}

function newRoundTrip(category, face, sample) {
  for (const f of ctx.CARD_FIELDS)
    if (ctx.registryEntryApplies(f, category, face)) ctx.applyField(f, sample);
  for (const g of ctx.IMAGE_FIELD_GROUPS)
    if (ctx.registryEntryApplies(g, category, face)) ctx.applyImageGroup(g, sample);
  const obj = {};
  for (const f of ctx.CARD_FIELDS)
    if (ctx.registryEntryApplies(f, category, face)) obj[f.key] = ctx.readField(f);
  for (const g of ctx.IMAGE_FIELD_GROUPS)
    if (ctx.registryEntryApplies(g, category, face)) Object.assign(obj, ctx.readImageGroup(g));
  return obj;
}

function addUnusedFields(category, face, sample) {
  const enriched = {
    ...sample,
    UnknownScalar: "ignored",
    UnknownObject: { nested: true },
    UnknownArray: [1, 2, 3],
    UnknownNull: null,
  };
  const unusedKeys = ["UnknownScalar", "UnknownObject", "UnknownArray", "UnknownNull"];

  for (const f of ctx.CARD_FIELDS) {
    if (ctx.registryEntryApplies(f, category, face)) continue;
    enriched[f.key] = f.kind === "checkbox" ? true : `unused ${f.key}`;
    unusedKeys.push(f.key);
  }
  for (const g of ctx.IMAGE_FIELD_GROUPS) {
    if (ctx.registryEntryApplies(g, category, face)) continue;
    const keys = [
      g.urlKey || g.keyPrefix + "URL",
      g.keyPrefix + "X",
      g.keyPrefix + "Y",
      g.keyPrefix + "Zoom",
    ];
    enriched[keys[0]] = "https://example.invalid/unused.png";
    enriched[keys[1]] = 49;
    enriched[keys[2]] = -49;
    enriched[keys[3]] = 250;
    unusedKeys.push(...keys);
  }

  return { enriched, unusedKeys };
}

// --- run -------------------------------------------------------------------

function pageConstant(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*["']([^"']+)["']`));
  return match && match[1];
}

function discoverCases() {
  const cases = [];
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(ROOT, entry.name, "index.html");
    if (!fs.existsSync(indexPath)) continue;
    const source = fs.readFileSync(indexPath, "utf8");
    const category = pageConstant(source, "CARD_CATEGORY");
    const face = pageConstant(source, "FACE");
    const downloadName = pageConstant(source, "DEFAULT_DOWNLOAD_NAME");
    if (category && face && downloadName) {
      cases.push({ tool: entry.name, category, face, downloadName });
    }
  }
  return cases.sort((a, b) => a.tool.localeCompare(b.tool));
}

const CASES = discoverCases();
let failures = 0;

console.log("CARD_FIELDS:", ctx.CARD_FIELDS.length, " IMAGE_FIELD_GROUPS:", ctx.IMAGE_FIELD_GROUPS.length);
console.log("");

for (const { category, face, tool, downloadName } of CASES) {
  console.log(`=== ${tool} (${category}/${face}, download=${downloadName}) ===`);
  const sample = buildSample(category, face, false);
  const outObj = newRoundTrip(category, face, sample);

  // 1. every sample value round-trips through the new helpers (string-coerced)
  for (const k of Object.keys(sample)) {
    const a = String(sample[k]);
    const b = String(outObj[k]);
    if (a !== b) { console.log(`  MISMATCH ${k}: sample=${JSON.stringify(sample[k])} -> new=${JSON.stringify(outObj[k])}`); failures++; }
  }

  // 2. Unknown JSON properties and registry fields belonging to other tools are
  // accepted without error and do not leak into this tool's exported object.
  const { enriched, unusedKeys } = addUnusedFields(category, face, sample);
  ctx.CARD_CATEGORY = category;
  ctx.FACE = face;
  let ignoredOk = true;
  try {
    ctx.parseJSONData(JSON.parse(JSON.stringify(enriched)));
    const enrichedOut = newRoundTrip(category, face, enriched);
    ignoredOk = unusedKeys.every((key) => !(key in enrichedOut));
  } catch (err) {
    ignoredOk = false;
    console.log(`  unused-field parsing threw: ${err.message}`);
  }
  console.log(`  unknown and unused fields ignored: ${ignoredOk ? "OK" : "FAIL"}`);
  if (!ignoredOk) failures++;

  // 3. new export key set vs the OLD outputJSONData template on main. Intended deltas:
  //    - hero_character: CharacterLogo* -> NameLogo* rename
  //    - HighContrastPhaseLabels: newly persisted, added to every category
  //    - principles: Attribution removed (no #inputAttribution control on that page;
  //      the old template emitted literal `undefined` = invalid JSON)
  const oldKeys = new Set(oldTemplateKeys(category, face));
  const newKeys = new Set(Object.keys(outObj));
  const onlyOld = [...oldKeys].filter((k) => !newKeys.has(k)).sort();
  const onlyNew = [...newKeys].filter((k) => !oldKeys.has(k)).sort();
  const isHeroFront = category === "hero_character" && face === "front";
  const expectedOld = (isHeroFront
    ? ["CharacterLogoURL", "CharacterLogoX", "CharacterLogoY", "CharacterLogoZoom"]
    : category === "principles" ? ["Attribution"] : []
  ).sort();
  const expectedNew = (isHeroFront
    ? ["NameLogoURL", "NameLogoX", "NameLogoY", "NameLogoZoom"] : []
  ).concat("HighContrastPhaseLabels").sort();
  const deltaOk = JSON.stringify(onlyOld) === JSON.stringify(expectedOld) &&
    JSON.stringify(onlyNew) === JSON.stringify(expectedNew);
  console.log(`  key-set delta vs OLD template: only-old=${JSON.stringify(onlyOld)} only-new=${JSON.stringify(onlyNew)} -> ${deltaOk ? "OK (as intended)" : "UNEXPECTED"}`);
  if (!deltaOk) failures++;

  // 4. alias import for character categories
  const aliasGroups = ctx.IMAGE_FIELD_GROUPS.filter((g) =>
    g.aliasPrefixes && ctx.registryEntryApplies(g, category, face));
  if (aliasGroups.length) {
    const aSample = buildSample(category, face, true);
    const aOut = newRoundTrip(category, face, aSample);
    for (const g of aliasGroups) {
      const alias = g.aliasPrefixes[0];
      const canonUrl = g.urlKey || g.keyPrefix + "URL";
      const ok = aOut[canonUrl] === aSample[alias + "URL"] &&
        String(aOut[g.keyPrefix + "X"]) === String(aSample[alias + "X"]) &&
        String(aOut[g.keyPrefix + "Zoom"]) === String(aSample[alias + "Zoom"]);
      console.log(`  alias ${alias}* -> ${g.keyPrefix}*: ${ok ? "OK" : "FAIL"}`);
      if (!ok) failures++;
    }
  }
  console.log("");
}

console.log(failures ? `FAIL (${failures})` : "PASS");
process.exit(failures ? 1 : 0);
