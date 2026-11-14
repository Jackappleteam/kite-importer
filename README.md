# Move to Kite (unofficial)

A bookmark and converter page that turns BotGhost and inventor.bot commands into Kite JSON.
Not made, endorsed or supported by Kite, BotGhost or inventor.bot. Check each builder's terms before using it.

- `index.html`: the page with the draggable bookmark and the converter
- `app.js`: the converter (built from the Kite fork's `kite-web/src/lib/botghost` and `inventor`)
- `bookmarklet.js`: the small script the bookmark runs. It only reads the open bot and sends it to this page.
- `build/`: the build script and sources. `build.mjs` needs the Kite fork checked out, and the bookmark's page address is set with `SITE_URL`.

Deploy: GitHub Pages, branch `main`, folder `/ (root)`.
