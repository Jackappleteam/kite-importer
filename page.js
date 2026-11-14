(function () {
  var statusEl = document.getElementById("status");
  var listEl = document.getElementById("list");
  var input = document.getElementById("paste");
  var labels = { ready: "ready", review: "check after import", unsupported: "can't be imported" };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function copy(text, done) {
    navigator.clipboard.writeText(text).then(done, function () { statusEl.textContent = "Copying was blocked. Use Download."; });
  }
  function download(name, text) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name; a.click();
  }
  function show(text) {
    var items;
    try { items = KiteConv.convert(text); }
    catch (e) { statusEl.textContent = "That isn't what the bookmark copies. Copy it again and paste all of it. (" + e.message + ")"; listEl.innerHTML = ""; return; }
    listEl.innerHTML = "";
    statusEl.textContent = items.length ? "Found " + items.length + " to convert. Copy one at a time into Kite's JSON import." : "Nothing to convert was found in that.";
    items.forEach(function (it) {
      var row = el("div", "row " + it.status);
      row.appendChild(el("div", "name", (it.kind === "event" ? "Event: " : "/") + it.name));
      row.appendChild(el("div", "tag", labels[it.status]));
      if (it.notes && it.notes.length) row.appendChild(el("div", "notes", it.notes.slice(0, 4).join(" ")));
      if (it.json) {
        var c = el("button", "primary", "Copy Kite JSON");
        c.onclick = function () { copy(it.json, function () { statusEl.textContent = "Copied " + it.name + ". Paste it into Kite's JSON import."; }); };
        var d = el("button", "", "Download");
        d.onclick = function () { download("kite-" + it.name + ".json", it.json); };
        row.appendChild(c); row.appendChild(d);
      }
      listEl.appendChild(row);
    });
  }
  document.getElementById("convert").onclick = function () { show(input.value); };
  document.getElementById("file").onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    f.text().then(function (t) { input.value = t; show(t); });
  };
  var allowed = /^https:\/\/([a-z0-9-]+\.)*(botghost\.com|inventor\.bot)$/;
  window.addEventListener("message", function (e) {
    if (!allowed.test(e.origin) || e.source !== window.opener || !e.data || e.data.kiteImport !== "data") return;
    input.value = e.data.text; show(e.data.text);
  });
  if (window.opener) { try { window.opener.postMessage({ kiteImport: "ready" }, "*"); } catch (e) {} }
})();
