"use strict";

/*
 * Tests for the sizing maths in ../index.html.
 *
 * The calculator script is extracted from index.html and run in a Node vm
 * with a minimal DOM stub (the script wires up DOM elements at load; the
 * stub absorbs those calls). The pure maths (compute, makeRow, buildVerdicts)
 * is then exercised directly against hand-computed expectations.
 *
 * Run: node test/calculator.test.js
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const src = blocks.find((b) => b.includes("var CATALOG"));
if (!src) {
  console.error("FAIL: could not find the calculator script in index.html");
  process.exit(1);
}

/* Minimal DOM stub: every element is a callable proxy that absorbs
   property reads, writes, and method calls. */
function makeEl() {
  const fn = function () { return el; };
  const el = new Proxy(fn, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => "";
      if (p === "style") return {};
      if (p === "dataset") return {};
      return el;
    },
    set() { return true; },
    apply() { return el; }
  });
  return el;
}

const sandbox = {
  console,
  document: {
    getElementById: () => makeEl(),
    createElement: () => makeEl(),
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    addEventListener: () => {}
  }
};
vm.createContext(sandbox);
vm.runInContext(
  src + "\n;globalThis.__api = { compute: compute, makeRow: makeRow, buildVerdicts: buildVerdicts, state: state, USABLE: USABLE };",
  sandbox
);
const api = sandbox.__api;

/* ---------- assertion helpers ---------- */
let failures = 0;
function check(caseName, field, actual, expected, tol) {
  const t = tol === undefined ? 0 : tol;
  const ok = typeof expected === "number"
    ? Math.abs(actual - expected) <= t
    : actual === expected;
  if (!ok) failures += 1;
  console.log(
    "  [" + (ok ? "PASS" : "FAIL") + "] " + field +
    ": expected " + expected + ", actual " +
    (typeof actual === "number" ? Math.round(actual * 100) / 100 : actual)
  );
}

function runCase(name, items, duration, expected) {
  console.log("Case: " + name);
  api.state.rows = items.map((pair) => api.makeRow(pair[0], pair[1]));
  api.state.durationHours = duration;
  const r = api.compute();
  Object.keys(expected).forEach((field) => {
    const tol = Number.isInteger(expected[field]) ? 0 : 0.01;
    check(name, field, r[field], expected[field], tol);
  });
  return r;
}

/* ---------- Case 1: fridge plus lights, overnight ----------
   Fridge: 150 W at 50% duty, hours capped at the 12 h window: 150 x 0.5 x 12 = 900 Wh
   Lights x5: 10 W each, 6 h: 10 x 1 x 6 x 5 = 300 Wh
   Total 1,200 Wh. Daily: 150 x 0.5 x 24 + 300 = 2,100 Wh, avg draw 87.5 W.
   Running 150 + 50 = 200 W; fridge surge extra 800 - 150 = 650; peak 850 W.
   Nameplate need 1,200 x 1.25 / 0.85 = 1,764.71, so the 2,000 Wh class.
   Inverter: smallest step clearing 850 W is 1,000 W. */
runCase("Fridge plus lights overnight (12 h)",
  [["fridge", 1], ["lights", 5]], 12,
  { totalWh: 1200, dailyWh: 2100, avgDraw: 87.5, running: 200, surgeExtra: 650,
    peak: 850, needNameplate: 1764.71, recClass: 2000, inverter: 1000 });

/* ---------- Case 2: CPAP night ----------
   CPAP 60 W x 8 h = 480; WiFi 15 W x 12 h (capped) = 180;
   lights 10 W x 6 h = 60; phones 10 W x 3 h = 30. Total 750 Wh.
   Daily: 480 + 360 + 60 + 30 = 930 Wh, avg draw 38.75 W.
   No device surges, so peak = running = 95 W.
   Nameplate need 750 x 1.25 / 0.85 = 1,102.94, so the 1,500 Wh class.
   Inverter: smallest step clearing 95 W is 300 W. */
const cpapResult = runCase("CPAP night (12 h)",
  [["cpap", 1], ["wifi", 1], ["lights", 1], ["phones", 1]], 12,
  { totalWh: 750, dailyWh: 930, avgDraw: 38.75, running: 95, surgeExtra: 0,
    peak: 95, needNameplate: 1102.94, recClass: 1500, inverter: 300 });

/* CPAP verdict cross-check: a 1,000 Wh station runs a 60 W CPAP for
   floor((1000 x 0.85) / 60) = floor(14.17) = 14 hours of sleep. */
console.log("Case: CPAP verdict text");
const verdicts = api.buildVerdicts(cpapResult);
const cpapLine = verdicts.map((v) => v.text).find((t) => t.includes("hours of sleep"));
check("CPAP verdict", "verdict mentions 14 hours of sleep",
  typeof cpapLine === "string" && cpapLine.includes("roughly 14 hours of sleep"), true);

/* ---------- Case 3: well pump, high surge ----------
   Well pump: 1,000 W at 10% duty x 24 h = 2,400 Wh. Fridge: 1,800 Wh.
   Total 4,200 Wh, daily the same, avg draw 175 W.
   Running 1,000 + 150 = 1,150 W; biggest surge extra is the well pump's
   2,000 - 1,000 = 1,000 W, so peak = 2,150 W.
   Nameplate need 4,200 x 1.25 / 0.85 = 6,176.47, so the 7,200 Wh class.
   Inverter: smallest step clearing 2,150 W is 2,400 W. */
runCase("Well pump plus fridge (24 h)",
  [["well", 1], ["fridge", 1]], 24,
  { totalWh: 4200, dailyWh: 4200, avgDraw: 175, running: 1150, surgeExtra: 1000,
    peak: 2150, needNameplate: 6176.47, recClass: 7200, inverter: 2400 });

/* ---------- Case 4: fridge only, verification cross-check ----------
   Fridge alone for 24 h: 150 x 0.5 x 24 = 1,800 Wh, avg draw 75 W.
   Nameplate need 1,800 x 1.25 / 0.85 = 2,647.06, so the 3,600 Wh class.
   Runtime on a 1,000 Wh class station: (1,000 x 0.85) / 75 = 11.33 h.
   Runtime on a 1,024 Wh station: (1,024 x 0.85) / 75 = 11.61 h, matching the
   published 11 to 12 hour figure for 1,024 Wh stations running this fridge. */
const fridge = runCase("Fridge only (24 h)",
  [["fridge", 1]], 24,
  { totalWh: 1800, dailyWh: 1800, avgDraw: 75, running: 150, surgeExtra: 650,
    peak: 800, needNameplate: 2647.06, recClass: 3600, inverter: 1000 });
console.log("Case: Fridge runtime cross-check");
check("Fridge only (24 h)", "runtime on 1,000 Wh class (h)",
  (1000 * api.USABLE) / fridge.avgDraw, 11.33, 0.01);
check("Fridge only (24 h)", "runtime on 1,024 Wh station (h)",
  (1024 * api.USABLE) / fridge.avgDraw, 11.61, 0.01);

console.log(failures === 0 ? "\nAll checks passed." : "\n" + failures + " check(s) FAILED.");
process.exit(failures === 0 ? 0 : 1);
