(function(){function collect(state) {
  var commands = [], events = [], seen = [];
  function isItem(v) {
    return typeof v.name === "string" &&
      (Array.isArray(v.actions) || typeof v.compressed_tree === "string");
  }
  function visit(v, inEvents, depth) {
    if (!v || typeof v !== "object" || depth > 12 || seen.indexOf(v) !== -1) return;
    seen.push(v);
    if (Array.isArray(v)) {
      for (var i = 0; i < v.length; i++) visit(v[i], inEvents, depth + 1);
      return;
    }
    if (isItem(v)) {
      (inEvents ? events : commands).push(v);
      return;
    }
    for (var key in v) {
      if (Object.prototype.hasOwnProperty.call(v, key)) {
        visit(v[key], inEvents || /event/i.test(key), depth + 1);
      }
    }
  }
  visit(state, false, 0);
  return { kite_botghost_export: 1, commands: commands, events: events };
}
async function readInventor() {
  var base = "/api/projects/" + location.pathname.split("/")[2] + "/components";
  var list = await (await fetch(base)).json();
  var items = [];
  for (var folder of list.folders) {
    for (var c of folder.components) {
      var blob = await (await fetch(base + "/" + c.id + "/version/" + c.current_version_id + "/blob")).json();
      items.push({ name: c.name, type: c.component_type, blob: blob });
    }
  }
  return { kite_inventor_export: 1, items: items };
}
function findStore() {
  var all = document.querySelectorAll("body, body *");
  for (var i = 0; i < all.length; i++) {
    var keys = Object.keys(all[i]);
    for (var k = 0; k < keys.length; k++) {
      if (keys[k].indexOf("__reactContainer$") !== 0) continue;
      var stack = [all[i][keys[k]]], steps = 0;
      while (stack.length && steps++ < 100000) {
        var fiber = stack.pop();
        if (!fiber) continue;
        var store = fiber.memoizedProps && fiber.memoizedProps.store;
        if (store && typeof store.getState === "function") return store;
        if (fiber.sibling) stack.push(fiber.sibling);
        if (fiber.child) stack.push(fiber.child);
      }
    }
  }
  return null;
}
async function read() {
  var host = location.hostname;
  if (/(^|\.)botghost\.com$/.test(host)) {
    var store = findStore();
    var found = store ? collect(store.getState()) : null;
    if (!found || found.commands.length + found.events.length === 0) {
      return { message: "No commands were found. Open your bot, go to its Commands page, wait until it has loaded, and click this bookmark again." };
    }
    return {
      data: found,
      message: "Found " + found.commands.length + " commands and " + found.events.length + " custom events of this bot."
    };
  }
  if (/(^|\.)inventor\.bot$/.test(host)) {
    var data = null;
    if (/^\/dash\/[^/]+/.test(location.pathname)) {
      try { data = await readInventor(); } catch (e) { data = null; }
    }
    var flows = data ? data.items.filter(function (i) { return i.type === "flow"; }).length : 0;
    if (flows === 0) {
      return { message: "No commands were found. Open your bot in the inventor.bot dashboard and click this bookmark again." };
    }
    return { data: data, message: "Found " + flows + " commands of this bot." };
  }
  return { message: "Open your bot in the BotGhost or inventor.bot dashboard first, then click this bookmark again." };
}
var SITE = "https://jackappleteam.github.io/kite-importer/";
function el(tag, style, text) {
  var e = document.createElement(tag);
  e.setAttribute("style", style);
  if (text) e.textContent = text;
  return e;
}
var old = document.getElementById("kite-import-helper");
if (old) old.remove();
var btn = "display:inline-block;margin:0 6px 6px 0;padding:6px 12px;border:0;border-radius:8px;cursor:pointer;font:inherit;background:#f97316;color:#fafaf9;";
var grey = btn + "background:#f5f5f4;color:#0c0a09;border:1px solid #e7e5e4;";
var box = el("div", "position:fixed;z-index:2147483647;top:20px;right:20px;width:320px;padding:16px;border-radius:12px;background:#fff;color:#0c0a09;border:1px solid #e7e5e4;font:14px/1.5 Inter,system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.25)");
box.id = "kite-import-helper";
box.appendChild(el("div", "font-weight:600;margin-bottom:2px", "Move to Kite"));
box.appendChild(el("div", "color:#78716c;font-size:12px;margin-bottom:8px", "Unofficial. Not made by Kite, BotGhost or inventor.bot."));
var status = el("div", "color:#44403c;margin-bottom:12px", "Reading your bot...");
box.appendChild(status);
var close = el("button", grey, "Close");
close.onclick = function () { box.remove(); };
box.appendChild(close);
document.body.appendChild(box);

read().then(function (result) {
  status.textContent = result.message;
  if (!result.data) return;
  var text = JSON.stringify(result.data);
  var origin = new URL(SITE).origin;

  var open = el("button", btn, "Open converter");
  open.onclick = function () {
    var win = window.open(SITE, "kite-import-converter");
    function onMessage(e) {
      if (e.origin !== origin || e.source !== win || !e.data || e.data.kiteImport !== "ready") return;
      window.removeEventListener("message", onMessage);
      win.postMessage({ kiteImport: "data", text: text }, origin);
      status.textContent = "Sent to the converter page.";
    }
    window.addEventListener("message", onMessage);
    status.textContent = "Waiting for the converter page...";
  };
  var copy = el("button", grey, "Copy");
  copy.onclick = function () {
    navigator.clipboard.writeText(text).then(function () {
      status.textContent = "Copied. Paste it into the converter page.";
    }, function () { status.textContent = "Copying was blocked. Use Save as file."; });
  };
  var save = el("button", grey, "Save as file");
  save.onclick = function () {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = "kite-export.json";
    a.click();
  };
  box.insertBefore(open, close);
  box.insertBefore(copy, close);
  box.insertBefore(save, close);
});

})();