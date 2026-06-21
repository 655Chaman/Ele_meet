---
name: myoprocess fulfillment
description: >
  Use when the connector has a paid client's intake-call transcript (Fathom)
  and needs a target list delivered. Reads the call, extracts the client's ICP,
  finds real people via public databases — pulling the fits, dropping the
  non-fits — and BUILDS A SCRAPER when no clean dataset exists. The client never
  decides who fits; the transcript is the filter spec. Trigger on things like
  "here's the call, find them", "fulfill this client", "build the list from this
  transcript", "find them for this client".
---

# Fulfillment

The client paid. The intake call is done. Your job: turn the transcript into a
clean, ready-to-reach list of real people. The client should never have to think
about *who* fits — that's the whole product. You read the call, you decide, you
deliver. If the data isn't sitting in a clean dataset, you build the scraper that
gets it. Finding and scraping are one job, bundled here.

**This is the no-inventory path.** Do NOT check the two lists first. This skill
exists for when you don't already have them. Go straight to the databases.

---

## Mode: plan-first vs. run (check this BEFORE doing anything)

Read how the connector asked, and pick the mode:

- **RUN mode** — triggers like "go", "run it", "fulfill this", "find them",
  "pull the list". Execute end to end (steps 1–6) without stopping to confirm
  between steps.
- **PLAN-FIRST mode** — triggers like "plan only", "don't run yet", "show me the
  plan first", "what would you do", "ready when I am". Do steps **1 and 2 only**:
  extract the ICP, then name the lane(s) — where these people live publicly and
  whether it's a clean pull or a scraper build. Present that as a short plan,
  then **STOP** and end with: *"Ready when you are — say the word and I'll pull
  it."* Do NOT query, pull, enrich, or scrape until the connector says go.

When in doubt, default to PLAN-FIRST and ask for the go. A pause is cheap; an
unwanted 600-row pull on camera is not.

---

## 1. Read the transcript → extract the ICP

Open the Fathom transcript the connector dropped in. Pull these, exactly as the
client described them on the call:

- **geography** — states/regions/metros they serve
- **perfect accounts** — the "who should I bring you" answer (industry, size,
  signals like violations / permits / licenses / recent funding)
- **work they want more of** — the kind of deal they're hungry for
- **deal-size floor** — the smallest deal worth their time
- **who NOT to bring** — the "who should I not bring you" answer. A hard exclude
  list. Honor it ruthlessly.

If any of these is missing or vague, say so plainly and make the most reasonable
call — don't stall waiting for perfect input.

---

## 2. Map the ICP → public databases

Ask one question: **where does this market already show up publicly?** Then go
get it. Proven lanes:

- **EPA ECHO** — facilities with enforcement actions / violations. Strong when
  the client sells remediation, compliance, safety, environmental services.
  Public REST API, queryable by state + program + violation status.
- **FMCSA (SODA / Socrata)** — carriers, safety records. Free endpoints; join on
  `dot_number`; cast numeric fields as text in the query. Census-first.
- **State permit / license registries** — contractors, health, environmental,
  professional boards. Most states expose these via Socrata/SODA or open data.
- **Other Socrata/SODA open-data portals** — search the client's vertical +
  geography; most regulated markets are sitting in one.

Pick the sources that fit the ICP. Skip generic business directories — too noisy.
If a vertical has no clean public source, that's your signal to scrape (step 4).

**Trap — government APIs silently ignore unknown parameters.** Many (ECHO
included) drop a misspelled/wrong param *without erroring* and return the
**unfiltered** count. Always sanity-check: when you add a filter, the row count
MUST drop. If it doesn't, your param name is wrong, not the data. Verify against
the API's actual spec, never guess param names.

### Verified lane cheat-sheet — EPA ECHO (Clean Water Act)
Base: `https://echodata.epa.gov/echo/cwa_rest_services.get_facilities?output=JSON`
- `p_st` — state(s), comma-delimited (`TX,LA`)
- `p_ncs` — NAICS prefix (NOT `p_naics` — that's silently ignored). Manufacturing = `31,32,33`
- `p_sic` — SIC code alternative
- `p_pccs` — compliance status — **this is the real "active violation" filter** (SNC, NC, new-violation codes). Use it to exclude closed/resolved-only cases.
- `p_act` — active permits only
- Pull pattern: `get_facilities` returns a QID → page with `get_qid`, or pull all at once with `get_download` (bulk CSV).
- **Throttle: ~300 req/hr, 1,500/day.** Prefer `get_download` over row-by-row pagination or you'll get blocked mid-pull.
- **No size/revenue/employee field exists** in any of ECHO's columns (see step 3).

---

## 3. Pull the fits, drop the non-fits — automatically

This is the filtering, and it's the point. **You** apply the transcript as the
filter — the client doesn't lift a finger.

- Pull records matching geography + perfect-account signals.
- Remove everything on the "who NOT to bring" list.
- Remove anything under the deal-size floor.
- **Pull every genuine fit. Report the honest count, whatever it is.** A healthy
  lane usually clears 500 and tops out around 800 — treat that as a gauge for the
  *connector* reading the result, never as a target to strain toward. If the real
  answer is 40, deliver 40 clean. The job is disciplined filtering, not hitting a
  number. Never loosen "fit" to inflate the count.
- **Some signals aren't filterable at the source.** Employee-count bands and
  deal-size floors usually have no field in public databases (ECHO, for example,
  has none). Don't try to enforce them in the query — pull on the filterable
  signals (geography, industry, violation status), then enforce size/deal-floor
  during **enrichment** (Apollo returns headcount). Expect some leakage; that's
  normal, flag it.

### When a lane comes back thin
Sometimes the honest count is small — the niche just isn't big. That's
information, not a failure. When it happens, say so plainly to the connector:
*"This exact ICP yields N real fits. Widening to find more would mean relaxing
[dimension X], which is what the client asked us to keep tight."* Then offer
options — deliver the N high-fit, stack a second lane, or relax a dimension with
the connector's sign-off. The widen-or-accept call belongs to the *connector*,
not the client and not you. Surface it; don't pad past the ICP to hide it.

---

## 4. No clean dataset? Build the scraper. (bundled)

When the market shows up publicly but not in a queryable dataset — it's on web
pages, a search UI, a paginated directory, a license-lookup tool — build a custom
scraper to pull it. This is part of the job, not a separate ask. **The full
build-a-scraper doctrine is bundled in `build-a-scraper/`** — use it; don't
improvise a stack.

- **`build-a-scraper/README.md`** — the condensed how-to + canonical project
  structure.
- **`build-a-scraper/Course/00`–`07`** — the full curriculum: API scrapers,
  JS-rendered sites, government data, signal scoring, deploy.
- **`build-a-scraper/scrapers/`** — full source of 24 working scrapers, bundled.
  Find the closest source type (see `EXAMPLES.md`) and clone its pattern instead
  of starting blank. Run any with `cd scrapers/<name> && npm install && apify run`.

**The non-negotiables (full detail in the bundle):**
- **Stack: Apify Actor, TypeScript, Crawlee.** Not Python, not ad-hoc scripts.
- **API-first** — if there's a JSON/XHR endpoint behind the page, hit it directly,
  no browser. Use `PlaywrightCrawler` only when the site forces it (JS-rendered,
  PrimeFaces/JSF tables).
- **Filter at parse time** (geography, thresholds) and **score raw rows into
  signals** (recency + scale + severity) — facts become intelligence.
- **Verify pagination actually advanced** before reading the next page, or you
  loop forever.
- **Normalize output to the same shape as a clean API pull** so it drops straight
  into enrichment (step 5), indistinguishable downstream.

---

## 5. Enrich to reachable contacts

Run the waterfall until each record has a way to reach a human:

1. **Native email** — verify what's already on the record first (cheapest, best).
2. **Apollo** — `mixed_companies/search` to resolve the company + people.
3. **AMF** — verify endpoint as the cross-check / fallback.
4. **Phone-only** — last resort when no email resolves.

Aim for the highest verified-email rate you can; phone-only is the floor.

---

## 6. Deliver

A clean CSV: company, contact, verified email (or phone), and the **signal that
qualified them** (the violation, the permit, the size). Ready to reach — no
cleanup needed. If you built a scraper, hand over the script too.

End by offering the next step: first-touch copy.

---

## Hard rules (don't break these)

- **Never buy inboxes or domains for the client.** Use your own sending
  infrastructure. That discipline is what holds the ~89% margins — losing it
  loses the business model.
- **The client never qualifies.** If you're about to ask the client "is this a
  fit?", stop — the transcript already answered it. Decide and move. (The one
  exception: a thin market is a business call for the *connector*, not the
  client — see "When a lane comes back thin.")
- **Honor the exclude list absolutely** — but know HOW each exclusion is
  enforced. Split it into two buckets:
  - **Filterable at source** (e.g. exclude municipalities/utilities by NAICS,
    exclude closed cases via compliance-status param) — do it in the query.
  - **Post-pull blocklist + enrichment** (e.g. "no oil & gas majors" has no
    flag — keep a name blocklist; "<50 employees" needs enrichment headcount).
  Don't treat the whole exclude list as one clean filter — half of it usually
  isn't.
- **A thin clean list beats a fat dirty one.** There's no minimum to hit. Deliver
  every real fit and report the honest count. If it's small, that's worth knowing
  — surface it, don't paper over it.
