# COSTS — what this run actually spent vs buying a list

Real numbers from the 2026-06-04 run (462 enriched companies, 393 emails / 385 verified, 69 phones).

## What we spent

| item | calls/volume | cost |
|---|---|---|
| DOL OSHA data (4,931 inspections + 7,945 violations) | ~60 API calls | **$0** — free public data, free key |
| Apollo company→domain resolution | ~1,100 search calls | **$0** — search calls don't burn credits (a handful of org-enrich credits during testing, ≈ pennies) |
| AnyMailFinder decision-maker emails | 680 companies queried, ~1,500 requests — **only the 385 VERIFIED finds are billed** (misses and unverified finds are free) | **≈ $35–38** of plan credits at standard pricing (~$0.10/verified email). If you already have a monthly AMF plan, marginal cash today: **$0** |
| Instantly sending | existing subscription + own inboxes | **$0 marginal** |
| Compute / scraping infra | local machine | **$0** |
| **Total marginal spend** | | **≈ $35–38 of credits — $0 cash if inside an existing AMF plan** |

**≈ $0.08 per enriched company. ≈ $0.10 per verified decision-maker email. Charged ONLY on verified finds — every miss in the funnel was free.**

## What the same list costs if you buy it

| route | what you get | price |
|---|---|---|
| ZoomInfo / similar enterprise data platform | firmographics + contacts, NO citation trigger | **$15,000–40,000/yr** minimum contract |
| Data broker custom list (Data Axle, etc.) | firmographics, stale contacts | $0.50–1.00/record → **$250–500** for 500 rows, no trigger signal |
| Lead-gen agency, verified contacts | contacts verified once, generic targeting | $1.50–3.00/lead → **$700–1,400** for ~460 |
| Trigger/intent-based list (the actual comparable) | timing signal + verified contact | $3–10/lead where it exists at all → **$1,400–4,600** |

## The two things money can't actually buy here

1. **The trigger doesn't exist in list shops.** "Cited by OSHA in the last 90 days, abatement clock running" is not a ZoomInfo filter. The signal that makes the copy work — timing — is only in the free government data. You'd pay $15K/yr for a worse list.
2. **Freshness.** The DOL dataset updates daily. Any purchased list is a snapshot that was already resold to your competitors. This pipeline re-pulls every Monday for $0.

## The honest math

- This run: ~$35–38 in plan credits (cash ≈ $0 on an existing plan), ~1 hour of operator time (first time, including every dead-end — see PITFALLS.md). Repeat runs: similar credits, ~10 minutes.
- Bought equivalent: $700–4,600 per batch, or a $15K+/yr platform — without the citation trigger, which is the entire reason the email gets answered.
- Cost advantage: **~95–99% cheaper per lead**, with a signal money can't buy. The margin lives in the data being free and the discipline being in the pipeline.
