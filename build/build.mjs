import { build } from "/home/claude/botghostimport/kite-src/kite-web/node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/lib/main.js";
import fs from "node:fs";
const KW = "/home/claude/botghostimport/kite-src/kite-web";
const SITE = process.env.SITE_URL || "https://jackappleteam.github.io/kite-importer/";
const common = { bundle: true, write: false, target: "es2019", alias: { "@": KW + "/src" }, nodePaths: [KW + "/node_modules"], logLevel: "error" };

const conv = (await build({ ...common, entryPoints: ["src/entry.ts"], format: "iife", globalName: "KiteConv", platform: "browser", minify: true })).outputFiles[0].text;
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/converter.js", conv);
fs.copyFileSync("src/page.js", "dist/page.js");

const rd = await build({ ...common, stdin: { contents: 'import { helperReadSource } from "' + KW + '/src/lib/importHelper"; export default helperReadSource;', resolveDir: KW, loader: "ts" }, format: "esm", platform: "node" });
fs.writeFileSync("dist/_reader.mjs", rd.outputFiles[0].text);
const { default: readerSrc } = await import("./dist/_reader.mjs");
fs.rmSync("dist/_reader.mjs");

const ui = fs.readFileSync("src/reader-ui.js", "utf8").replace("__SITE__", () => SITE);
const script = "(function(){" + readerSrc + "\n" + ui + "\n})();";
fs.writeFileSync("dist/bookmarklet.js", script);
const html = fs.readFileSync("src/index.template.html", "utf8")
  .replace("__BOOKMARKLET__", () => "javascript:" + encodeURIComponent(script))
  .replace("__SOURCE__", () => script.replace(/&/g, "&amp;").replace(/</g, "&lt;"));
fs.writeFileSync("dist/index.html", html);
fs.writeFileSync("dist/.nojekyll", "");
for (const f of ["favicon.svg","favicon.ico","apple-touch-icon.png", "banner.png", "logo.png"]) fs.copyFileSync("src/" + f, "dist/" + f);
console.log("bookmarklet bytes", script.length, "| converter.js", conv.length, "| site", SITE);
