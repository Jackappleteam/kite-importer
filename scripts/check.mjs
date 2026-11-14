// Checks that need no dependencies. Run with: node scripts/check.mjs
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("ok   " + name);
  } catch (e) {
    failed++;
    console.log("FAIL " + name + ": " + e.message);
  }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

const files = [".github/ISSUE_TEMPLATE/config.yml", ".github/ISSUE_TEMPLATE/bug.yml", ".github/ISSUE_TEMPLATE/doesnt-convert.yml", ".github/ISSUE_TEMPLATE/feedback.yml", "index.html", "converter.js", "page.js", "bookmarklet.js", "favicon.svg", "favicon.ico", "apple-touch-icon.png", ".nojekyll"];
check("deployed files exist", () => {
  for (const f of files) assert(fs.existsSync(path.join(root, f)), f + " is missing");
});

check("scripts are valid JavaScript", () => {
  for (const f of ["converter.js", "page.js", "bookmarklet.js"]) new vm.Script(read(f), { filename: f });
});

check("index.html loads what it needs", () => {
  const html = read("index.html");
  for (const needle of ["issues/new/choose", 'class="feedback"', 'src="converter.js"', 'src="page.js"', 'rel="icon"', 'id="paste"', 'id="convert"', 'class="beta"', "<footer>"]) {
    assert(html.includes(needle), "index.html lacks " + needle);
  }
});

check("the bookmark is the current bookmarklet.js", () => {
  const html = read("index.html");
  const m = html.match(/class="drag" href="(javascript:[^"]+)"/);
  assert(m, "no bookmark link found");
  const href = m[1].replace(/&amp;/g, "&");
  assert(decodeURIComponent(href.slice("javascript:".length)) === read("bookmarklet.js"), "the bookmark differs from bookmarklet.js, rebuild the site");
  assert(href.length < 50000, "the bookmark is " + href.length + " characters, too long to drag");
});

check("the bookmark opens this site's page", () => {
  const m = read("bookmarklet.js").match(/var SITE = "([^"]+)"/);
  assert(m, "no SITE address in the bookmark");
  assert(/^https:\/\/[a-z0-9-]+\.github\.io\/[a-z0-9-]+\/$/.test(m[1]), "unexpected address " + m[1]);
});

check("the bookmark only talks to the dashboard it runs on and this site", () => {
  const src = read("bookmarklet.js");
  for (const bad of ["XMLHttpRequest", "sendBeacon", "WebSocket", "importScripts"]) assert(!src.includes(bad), "the bookmark uses " + bad);
  const site = src.match(/var SITE = "([^"]+)"/)[1];
  const urls = [...src.matchAll(/https?:\/\/[^\s"'`)]+/g)].map((m) => m[0]);
  for (const u of urls) assert(u === site, "the bookmark mentions another address: " + u);
});

check("the converter turns a BotGhost bot into Kite flows", () => {
  const ctx = vm.createContext({});
  vm.runInContext(read("converter.js"), ctx);
  const items = vm.runInContext("KiteConv.convert", ctx)(JSON.parse(read("tests/fixture-botghost.json")));
  assert(items.length === 2, "expected 2 commands, got " + items.length);
  for (const it of items) {
    assert(it.status === "ready", it.name + " is " + it.status);
    const j = JSON.parse(it.json);
    assert(j.enabled === true && j.flow_source.nodes.length >= 2 && j.flow_source.edges.length >= 1, it.name + " has no flow");
    assert(j.flow_source.nodes[0].type === "entry_command", it.name + " has no command entry");
  }
});

check("bad input gives an error, not a crash", () => {
  const ctx = vm.createContext({});
  vm.runInContext(read("converter.js"), ctx);
  const convert = vm.runInContext("KiteConv.convert", ctx);
  let threw = false;
  try { convert("not json"); } catch { threw = true; }
  assert(threw, "no error for bad input");
});

if (failed) {
  console.log("\n" + failed + " check(s) failed");
  process.exit(1);
}
console.log("\nAll checks passed");
