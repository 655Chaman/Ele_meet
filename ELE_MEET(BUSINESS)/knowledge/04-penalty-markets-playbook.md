# Penalty / Regulatory Markets — the playbook

Penalty-based markets keep printing because the demand side is **forced to act**: a public enforcement event creates urgent, time-sensitive, recurring demand, and there's always an existing ecosystem of fixers who sell the remedy.

## The 3-criteria filter for any market
1. **Public, searchable enforcement database** — the demand source. No database, no play.
2. **Daily cost of not fixing** — fines, shutdown, license/permit risk, debarment, lost contracts.
3. **An existing ecosystem of fixers** — people already selling the remedy, so supply is mappable, not invented.

## How to find more of them (live)
Search for federal/state agencies that publish enforcement/penalty databases. A strong meta-source is **Violation Tracker** (Good Jobs First) — 450+ agencies, sortable by agency, so you can see which penalty markets cluster hardest before committing one.

## Markets that fit the pattern (examples)
- **OSHA** — workplace safety citations
- **FDA** — inspection 483s / warning letters (biotech/pharma/device)
- **EPA** — Clean Air/Water/RCRA enforcement (ECHO database)
- **FMCSA / DOT** — carrier safety violations (SAFER/SMS) ← worked example below
- **MSHA** — mine-safety citations (Mine Data Retrieval System)
- **DOL Wage & Hour** — wage violations (enforcedata.dol.gov)
- **SEC/FINRA, OFAC, BIS** — financial/sanctions/export (smaller volume, higher fees)

## Worked example — FMCSA (trucking carrier safety)
**Why it prints:** free public data, refreshed monthly, big motivated demand (bad scores = lost freight, insurance spikes, out-of-service), and a deep fixer ecosystem.

**Demand side — free public data, all joined on `dot_number`:**
- Carrier safety scores / out-of-service counts (the "who's flagged" signal)
- Raw violations (severity, out-of-service indicators)
- Carrier census (legal name, phone, email, address)
- Filter the scores for "flagged" (high maintenance/CSA measure, out-of-service inspections), join to census for contact info, keep US, bias toward real fleets.
- **Numeric fields often come back as text — cast them** in your query filters/sorts.

**Demand contact reality:** the census already carries phone + email for many carriers, so demand here is **phone/email-first off the public data** — third-party B2B enrichment tools have poor coverage of tiny owner-operators and produce name-collision false matches. Verify the native emails; treat stale/personal ones as phone-first.

**Supply side — the fixers (the BASIC you filter on picks the fixer):**
- Vehicle-maintenance flags → fleet maintenance / mobile truck repair / DOT inspection
- HOS / unsafe-driving flags → safety consultants, ELD/compliance help, CDL training
- Plus: DOT compliance consultants (primary), DOT drug & alcohol testing TPAs, DOT physicals / occupational health, driver-qualification/background screening
- The pure "DOT compliance consultant" pool is a focused cottage industry; the full *fixer spectrum* (consultants + testing + physicals + repair + training) is what gives volume. Filter to the **lane** (trucking/DOT-bound keywords), not to a single flavor of fixer — then let outreach replies tell you which sub-type closes to a retainer.

**Pitfall:** keywords like "safety" or "compliance" alone leak into other verticals (OSHA, food safety, industrial). Anchor keywords to the lane (DOT, FMCSA, motor carrier, trucking) and exclude SaaS/telematics + out-of-lane verticals.

See `playbooks/building-demand-side.md` and `playbooks/building-supply-side.md` for the exact recipes used to build 200 demand + 500 supply in this market.
