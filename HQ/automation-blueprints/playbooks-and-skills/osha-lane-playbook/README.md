# OSHA Citation Lane — Full Replication Kit

Built live on 2026-06-04. In one session, this pipeline went from **a client intake call → 462 enriched leads → a loaded cold-email campaign → 50 ranked CRM cards → a deployed public scraper**.

You can replicate it with Claude (Claude Code or claude.ai with connectors) in roughly 10 minutes of your time, because every dead-end we hit is already documented in `PLAYBOOK.md` — your Claude skips straight to what works.

## What you'll end up with

1. A list of mid-size manufacturers with **fresh serious/willful/repeat OSHA citations** (public data, free API) — each row carrying the citation type, penalty, date, headcount band, and multi-site flag
2. **Decision-maker contacts** (verified emails + phones) on the companies that resolve
3. A ready-to-launch **Instantly campaign** with a proven 3-step sequence
4. **Ranked CRM cards** (Linear, or any PM tool) for the top fits

## What you need (all keys are YOURS — never share or hard-code them)

| key | cost | where | takes |
|---|---|---|---|
| DOL API key | free | dataportal.dol.gov → register → API key | ~2 min |
| Apollo API key | free tier works | app.apollo.io → Settings → Integrations → API | ~2 min |
| AnyMailFinder key | pay per found email | anymailfinder.com → API | ~2 min |
| Instantly account + MCP connector | your plan | connect Instantly in claude.ai connectors | ~2 min |

## Files

- `PLAYBOOK.md` — the run sheet. Paste it to your Claude and say go.
- `PITFALLS.md` — every trap we hit live, pre-solved. Your Claude reads this so it doesn't rediscover them.
- `COPY_TEMPLATES.md` — the 3-email sequence pattern that the campaign uses.
- `scripts/osha_pull.py` — the data puller (checkpointed, rate-limit-safe).
- `scripts/osha_aggregate.py` — per-company rollup, exclude lists, size bands, multi-site detection.

## The one rule

**Honest counts, no padding.** If your state/industry combo yields 80 real fits, deliver 80. The exclude list only ever subtracts. A thin clean list beats a fat dirty one.
