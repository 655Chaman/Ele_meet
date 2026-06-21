# PLAYBOOK — run sheet for Claude

You (Claude) are replicating a validated pipeline: OSHA enforcement data → enriched lead list → loaded cold-email campaign → ranked CRM cards. Everything below was verified live against the real APIs on 2026-06-04. Read `PITFALLS.md` first — it saves you ~50 minutes of rediscovery.

## Inputs from the user (ask once, up front)

1. **The spec** — who their client wants: industries (NAICS prefixes), states, size band, exclude list, what makes a "hot" signal for them. If they have an intake-call transcript, extract it from there; the transcript is the filter, the client never re-qualifies.
2. **Keys**: DOL key (required), Apollo key (recommended), AnyMailFinder key (recommended), Instantly connected via MCP.

Default spec used in the original run: manufacturers (NAICS 31,32,33) + warehousing (493), states OH/IN/MI/IL/WI, 100–1,000 employees, exclude Fortune-500/giants + healthcare + in-house-EHS companies, signal = serious/willful/repeat citation.

## Stage 1 — Pull (≈3 min)

Use `scripts/osha_pull.py` (Python 3, stdlib only):

```
python3 scripts/osha_pull.py <DOL_KEY> ./out [start_date] [end_date]
```

- Dates default to the **hot window**: 300 days back → 60 days back. Citations post ~30 days after issuance, so inspections fresher than ~2 months show nothing public yet. Do not "fix" this by widening to today.
- Edit STATES / NAICS_PREFIXES at the top of the script for the user's spec.
- The script self-checkpoints; if it dies (network resets happen on this API), rerun the same command — it resumes.

API facts the script encodes (also in PITFALLS.md): base `https://apiprod.dol.gov/v4/get/osha/{inspection|violation}/json`, `X-API-KEY` as query param, `filter_object` with operators eq/in/gt/lt/like (`"33%"` wildcard), limit 10000 + offset, join tables on `activity_nr`, `in`-lists ≤100 ids per call.

## Stage 2 — Aggregate (≈1 min)

```
python3 scripts/osha_aggregate.py
```

(Adjust the input paths at top to your Stage-1 output.) Produces per-company rollups: severity counts, summed penalties, latest issuance, open abatement items, site headcount (`nr_in_estab`), size band, multi-site flag (name-normalized dedupe). The giant/F500 blocklist uses FULL company names only — generic tokens like "miller" or "target" kill real mid-size shops.

## Stage 3 — Enrich (≈5–15 min depending on volume)

Waterfall per company (this exact order is what was validated):
1. **Apollo** `POST /api/v1/mixed_companies/search` body `{"q_organization_name": name, "page":1, "per_page":1}`, header `X-Api-Key`. Take `primary_domain`. Try progressively trimmed name variants on miss.
2. **AnyMailFinder** `POST /v5.0/search/decision-maker.json` body `{"domain": d, "decision_maker_category": c}` rotating c through `ceo → operations → finance`. Charges only on found email. 404 = not indexed, try next category; 401/402 = stop.
3. No email → keep Apollo's `primary_phone` as a phone-only row. Floor, not failure.

Expected yields from the live run: ~50–60% domain resolution, ~40% verified-email rate overall, ~30% phone salvage on the misses.

## Stage 4 — QA GATE (do not skip; ≈3 min)

This is where the live run caught wrong-person emails headed for a real campaign (a hospital CEO, an NFL team executive, a real-estate coach). Apply ALL of:

1. **Foreign-TLD drop**: contact email TLD outside {com,net,org,us,co,io,coop,biz,info} → drop (wrong-country entity).
2. **Category excludes from the spec**: e.g. healthcare keywords (health/hospital/clinic/university) in the company name → drop.
3. **Giant check**: known multi-billion / famous-parent companies → drop from the CAMPAIGN (keep in the CSV, flagged).
4. **Name↔domain coherence**: token/initials overlap between company name and email domain. Auto-pass the matches; EYEBALL every non-match yourself — abbreviations are often legit (D&N Bending → dnbend.com) while lookalikes are not (Sugar Creek Packing → sugarcreekcapital.com is a different company).
5. Expect ~20–25% attrition through this gate. That is the gate working.

## Stage 5 — Campaign (Instantly via MCP; ≈3 min)

1. `create_campaign` — two-step: first call returns eligible sender accounts; second call passes `email_list` with your chosen senders. Settings that matter: `track_opens:false, track_clicks:false` (no links anywhere), `stop_on_reply:true`, 1-day step delays, business hours, sender's own timezone.
2. Sequence = the 3 emails in `COPY_TEMPLATES.md`. Blank subjects on steps 2–3 so they thread.
3. `add_leads_to_campaign_or_list_bulk` with `skip_if_in_campaign:true` (makes retries idempotent — the MCP transport drops connections sometimes; verify with `list_leads` before retrying a failed bulk call).
4. **Leave the campaign in DRAFT.** The human launches after eyeballing. Always.

## Stage 6 — CRM cards (optional; ≈3 min)

Score each enriched company: `25×willful + 15×repeat + 3×serious + penalty/10000 + recency bonus + multi-site bonus + band bonus`. Take the top N. One card per company: **Target / Signal / What's bleeding / Fit check vs spec / Why they take the call / verdict: PENDING** (never pre-fill the verdict — the human routes). Under-band companies ride along with a flag in the title, they don't get silently dropped.

## Adapting to other states/industries

Change STATES and NAICS_PREFIXES. That's it. The lane works anywhere OSHA enforces, which is everywhere in the US. Note: some states run their own OSHA plans — the federal dataset still carries their inspections.

## Weekly cadence

Re-run Stage 1 every Monday. The date window slides itself. New citations surface, old ones age out. A thin week is information, not failure.
