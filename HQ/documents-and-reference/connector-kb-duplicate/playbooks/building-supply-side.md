# Building the Supply Side (today's recipe)

Goal: a campaign full of the *fixers* for your market — enriched with verified work emails + names — ready to outreach. Worked example: **500 DOT-compliance / trucking-fixer suppliers.**

## The pipeline
1. **Pick the lane filter.** Anchor keywords to the vertical (e.g. `DOT compliance, FMCSA, motor carrier, trucking safety, DOT consultant, DOT drug testing, DOT physical, fleet maintenance, truck repair, CDL training, fleet safety`). **Exclude** SaaS/telematics + out-of-lane verticals (`software, telematics, gps, camera, platform, environmental, osha, food safety`). Titles: Owner, Founder, President, CEO, Principal, Managing Member, Partner, VP, Director, GM, Operations Manager, Safety Director.

2. **Enrich natively through Instantly Super Search.** Instantly's Super Search enrichment finds + verifies work emails server-side and drops them into a lead list — names + emails come back native. Fire the enrichment with your filters and a target count (e.g. 500). This is the cleanest path (no third-party email-finder needed for B2B supply, which Instantly covers well).
   - Endpoint pattern: `POST /api/v2/supersearch-enrichment/enrich-leads-from-supersearch` with `search_filters`, `work_email_enrichment: true`, and `limit`. It creates a lead list (the `resource_id`) and populates it.
   - Poll the list until it fills to your target.

3. **Why not a single preview call?** Super Search previews are capped (~50, in API default order) and are NOT a representative sample. Don't judge or pin a filter off one preview — exhaust the pool (state fan-out, or the native enrichment job) before deciding. See `scripts/supersearch_pull.py`.

4. **Bake personalization onto every lead.** Each lead gets a `personalization` variable with the first name already inside, so the campaign body is just `{{personalization}}` and never renders blank. (Set it on the leads, then verify zero empties.)

5. **Create the campaign + push the leads via the Instantly MCP** (see `instantly-mcp.md`). Then **verify the real end-state**: pull the leads back and confirm campaign attachment + non-empty `first_name`/`personalization` before declaring done.

## Tips & tool quirks to know
- A broad keyword filter exhausts to thousands but pulls noise (carriers, wrong verticals). A narrow "pure consultant" filter is clean but small. The sweet spot is **lane-anchored breadth** + let the market sort the fixer types.
- To confirm what's in a campaign, search specific lead emails and check the `campaign` field (more reliable than the lead-list `campaign_id` filter).
- Adding leads that already exist in the workspace with `skip_if_in_campaign: true` will **skip** them — they won't attach. Omit the skip flag (or move the list into the campaign) to attach them.

## Copy
Subject + body come from `templates/copy-bones.md`. Supply opener (proven bones): *"I have [demand-side companies with the fresh problem] actively looking for [your service] right now. Before I route anyone anywhere, wanted to understand your capacity and whether the fit is there. Worth a quick call?"* + the 2 follow-ups.
