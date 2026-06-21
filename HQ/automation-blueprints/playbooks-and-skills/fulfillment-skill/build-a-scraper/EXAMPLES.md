# Scraper library — copy from these, don't start blank

24 working Apify/TypeScript scrapers, **full source bundled** in `./scrapers/<name>/`.
When step 4 fires, find the closest one to the source you're facing and copy its
pattern (read its `README.md` and `src/`).

**To run any of them:** `cd scrapers/<name> && npm install && apify run`
(`node_modules` is not shipped — `npm install` regenerates it from the bundled
`package.json` / `package-lock.json`).

## By source type

**Government / regulatory portals (closest to most fulfillment lanes):**
- `security-breaches` — HHS HIPAA breach portal (PrimeFaces table, Playwright, severity scoring)
- `osha-violations-demand` — OSHA violations → deal-routing signals
- `fda-warning-letters` — FDA warning letters, remediation intel
- `sba-rural-loans` — SBA rural businesses needing financing
- `usda-lenders` — USDA rural lenders (banks w/ phone + email)
- `sec-demand-signals` — SEC demand signals
- `wealth-management` — SEC Form ADV intelligence

**Job boards / hiring-signal scrapers (API-first):**
- `job-postings` — postings w/ company size + repost detection
- `healthcare-recruitment-demand` — facilities hiring w/ urgency signals
- `biospace-jobs` — niche biotech board
- `space-individuals` — space-industry job board, direct emails

**Directories / supply-side inventory:**
- `it-recruitment-agencies` — US + UK directory
- `recruitment-agencies-supply` — vertical & sales specialists
- `safety-consultants-supply` — routable inventory by incident type
- `conference-speakers` — speakers as decision-maker signals
- `gcc-hnw` / `hnw-uk` — high-net-worth individual directories

**Funding / news / expansion / M&A signals:**
- `eu-logistics-saas-funding` — recently funded companies
- `europe-events-demand` — events → hotel demand
- `google-news-expansion` — news-based expansion signals
- `uk-m-a-leads` — UK M&A leads
- `sec-demand-signals` — SEC filings as demand signals

**Product / launch signals:**
- `product-hunt` — Product Hunt launches
- `g2-creative-tools` — G2 software directory (creative tools)

**Utility:**
- `csv-to-dataset` — turn any CSV into a Connector OS dataset ID

## How to use the library
1. Identify your source type (government portal? API? directory?).
2. Open the closest match above → read its `README.md` and `src/main.ts` + `parser.ts`.
3. Copy the structure, swap the URL/fields/selectors, keep the patterns
   (input filters, parse-time filtering, signal scoring, pagination verification).
4. Match the output shape so it drops straight into enrichment (step 5).
