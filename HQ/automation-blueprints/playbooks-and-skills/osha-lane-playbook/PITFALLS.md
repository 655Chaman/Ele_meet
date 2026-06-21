# PITFALLS — every trap we hit live, pre-solved

Read this before touching anything. Each item cost us real time on 2026-06-04; it costs you nothing.

## DOL API (apiprod.dol.gov/v4)

1. **The endpoint path uses the dataset's `api_url`, not its tablename.** `/v4/get/osha/inspection/json` works; `/v4/get/osha/osha_inspection/json` returns a 500 that looks like a server error. If you get "There was a server error querying the dataset", your dataset name is wrong, not the server.
2. **Government APIs silently swallow unknown filter params** and return UNFILTERED data with a 200. After adding any filter, verify the results actually changed — but compare *composition* (e.g. "does the filtered page contain only my states?"), NOT row counts: at full-page limits both queries return the page cap and a count comparison is vacuous.
3. **`like` needs an explicit `%`**: `{"operator":"like","value":"33%"}`. Bare `"33"` returns empty (204), not an error.
4. **URL length cap ≈2–3KB**: `in`-lists of more than ~100 activity numbers return 403 from the WAF. Chunk at 100.
5. **Rate limit is a short-window bucket**: bursts of ~12+ calls draw 429s that clear in ~90s. Pace 2s between calls, back off 45s on 429.
6. **Connection resets (ECONNRESET) are a separate failure class from 429** and happen mid-run. If you only retry HTTP errors, a reset kills your job — that exact crash lost us a 30-minute join. Retry network errors too (20s), and checkpoint progress per chunk to disk so a crash costs one chunk, not the run.
7. **Citation posting lag ~30 days**: inspections opened in the last ~2 months show open cases with nothing public. The hot window is 2–10 months back. Don't chase last week's inspections.
8. **`enforcedata.dol.gov` is dead** — everything redirects to data.dol.gov; the API is apiprod.dol.gov/v4 with a free key from dataportal.dol.gov.

## Enrichment (Apollo / AnyMailFinder)

9. **Apollo's search response does NOT include headcount** — `estimated_num_employees` only comes from `organizations/enrich` (costs a credit). Use the OSHA `nr_in_estab` field for size banding instead; it's free and at-source.
10. **Apollo matches the wrong company confidently.** Live examples: "G & A Baking" → G Fuel (energy drinks), "Cleveland-Cliffs" → Cleveland Clinic's CEO, "Green Bay Packaging" → the Green Bay Packers' CEO, "Ferry Cap & Set Screw" → Mike Ferry the real-estate coach. **You must run the QA gate** (Stage 4) — name↔domain coherence plus an eyeball pass on every non-obvious match.
11. **AnyMailFinder 404 just means "not indexed"** — try the next decision-maker category. 401/402 means bad key / no credits — stop calling, don't burn the loop.

## Exclude lists

12. **Generic-token blocklists kill real companies.** "miller" killed Miller Tool & Die; "target" killed Target Metal Blanking. Block on FULL company names only ("general mills", not "mills").
13. **Half the exclude list isn't filterable at source.** Geography/industry: yes, in the query. Fortune-500 subsidiaries under local LLC names, in-house-EHS teams, deal-size floors: only catchable post-pull or at enrichment. Plan two layers.

## Instantly MCP

14. **The transport drops connections.** A failed bulk-add may or may not have landed server-side. Always `list_leads` to verify state before retrying, and always pass `skip_if_in_campaign:true` so retries are idempotent.
15. **`create_campaign` is two-step by design**: the first call (no `email_list`) returns the eligible sender accounts; you pick and call again.

## Apify deployment (if you ship the scraper)

16. **`apify/actor-node` base image workdir is `/usr/src/app`**, not `/home/myuser`. A multi-stage Dockerfile that copies build output from `/home/myuser/dist` fails with "not found" on the platform even when it builds locally.

## General discipline (what actually made this work)

17. Never report numbers from partial data as final.
18. Verify delegated/generated work by RE-RUNNING it, not re-reading it. Our generated scraper compiled and dry-ran fine — live-firing its exact queries against the real API was what exposed its broken self-test.
19. Every key is the user's own, entered at runtime, never embedded in code or docs.
20. Outbound sends are irreversible. The campaign launch is a human gate. Keep it that way.
