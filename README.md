# Move to Kite (unofficial, beta)

A bookmark and converter page that turns BotGhost and inventor.bot commands into Kite JSON.
Not made, endorsed or supported by Kite, BotGhost or inventor.bot. Check each builder's terms before using it.

## Files
- `index.html`: the page with the draggable bookmark and the converter
- `converter.js`: the converter, built from the Kite fork's `kite-web/src/lib/botghost` and `inventor`
- `page.js`: what the converter page does with it
- `bookmarklet.js`: the small script the bookmark runs. It only reads the open bot and sends it to the page.
- `build/`: the build script and sources. `build.mjs` needs the Kite fork checked out, and the page address in the bookmark is set with `SITE_URL`.

## Checks
`npm test` runs `scripts/check.mjs`, which needs no dependencies. It checks that the files exist and parse, that the bookmark link matches `bookmarklet.js`, that the bookmark talks to nothing but the converter page, and that the converter turns the sample bot in `tests/` into Kite flows. The same checks run on every push and pull request. After a rebuild, run it before committing: a failing "bookmark is the current bookmarklet.js" check means the build output is out of date.

## Deploy
GitHub Pages, branch `main`, folder `/ (root)`.
