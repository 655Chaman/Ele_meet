# Build-a-scraper (bundled into the fulfillment skill)

This is the scraper-building doctrine, bundled so fulfillment is self-contained.
When step 4 of the main skill fires ("no clean dataset → build the scraper"),
this is how you build it. Don't invent a stack — follow what's here. The full
source of 24 working scrapers is bundled in `./scrapers/` (manifest +
copy-from guide in `EXAMPLES.md`) — clone the closest one, don't start blank.
Run any of them with `cd scrapers/<name> && npm install && apify run`.

## The stack (non-negotiable — this is what we actually use)
- **Apify Actor**, **TypeScript**, **Crawlee** framework.
- **API-first.** If the data is behind a JSON/XHR endpoint, hit it directly — no
  browser (see `Course/03-api-scraper.md`). Faster, cheaper, sturdier.
- **Browser only when forced.** JS-rendered or PrimeFaces/JSF government tables
  need `PlaywrightCrawler` (see `Course/02-first-scraper.md` and
  `Course/04-js-rendered-sites.md`).
- **Government data** is its own lesson — `Course/05-government-data.md`.
- NOT Python, NOT ad-hoc scripts. Apify/Crawlee/TS so it deploys, scales, and
  can be monetized on the Apify Store (`Course/07-deploy-and-monetize.md`).

## Canonical project structure
```
<scraper-name>/
  .actor/
    actor.json
    input_schema.json     # filters: geography, min thresholds, max pages
  src/
    main.ts               # entry: read input, set defaults, crawl loop
    parser.ts             # row/record parsing (the offset trick, date/number cleaning)
    scoring.ts            # turn raw rows into SIGNALS (severity/recency/scale)
    enrichment.ts         # optional: Apollo/AMF company data
  package.json
  tsconfig.json
  Dockerfile
```

## How you actually build one
You build it by prompting Claude Code with a precise spec — source URL, fields to
extract, framework (PlaywrightCrawler vs direct HTTP), pagination mechanism, and
input filters. `Course/02-first-scraper.md` shows the exact prompt shape. Then:

1. **Read inputs, set defaults, normalize.** Every scraper starts this way.
2. **Filter at parse time, not after** — don't store rows you'll throw away.
3. **Score into signals** — recency + scale + severity → a field you can sort on.
   Raw rows are facts; scored rows are intelligence.
4. **Verify pagination actually advanced** before reading the next page (capture
   first-row text, click, confirm it changed) — or you loop forever.
5. **Normalize output to the same CSV/dataset shape as a clean API pull** so it's
   indistinguishable downstream.
6. **Be a good citizen** — throttle, real User-Agent, retries/backoff, resumable.

## Hard-won lessons (from the Course, don't relearn them)
- Government tables have variable column counts (expand arrows) → detect offset.
- Dates are MM/DD/YYYY → convert to ISO YYYY-MM-DD.
- PrimeFaces/JSF needs a browser + `waitForLoadState('networkidle')` + buffer.
- `page.screenshot()` is your best debugger.
- `page.$$()` survives strict-CSP sites where `page.evaluate()` fails.

## Full curriculum
`Course/00`→`07`: why it matters → setup → first (HTML table) scraper → API
scraper → JS-rendered sites → government data → enrichment & signals → deploy &
monetize. Read the lesson that matches the source you're facing.
