var SITE = "__SITE__";
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
