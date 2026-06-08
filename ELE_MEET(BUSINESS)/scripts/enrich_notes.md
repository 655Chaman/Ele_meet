# Enrichment notes

Two ways to get verified contact data onto leads. Pick by side.

## Supply (real B2B firms) — use Instantly native Super Search enrichment
This is the cleanest path; Instantly finds + verifies work emails server-side and returns names + emails.
- Fire: `POST /api/v2/supersearch-enrichment/enrich-leads-from-supersearch`
  body: `{ "search_filters": {...}, "work_email_enrichment": true, "limit": 500 }`
- It returns a `resource_id` = a new lead list. Poll that list until it fills to your target.
- Leads come back with `first_name`, `last_name`, `email` populated. Then bake `personalization` and push to the campaign.

## Demand (enforced companies, often small operators) — verify the native data
The public enforcement database usually already has phone + email. Don't over-enrich; just verify.
- Verify: `POST https://api.anymailfinder.com/v5.1/verify-email`
  header `Authorization: <key>`, body `{"email":"..."}` → `email_status` (keep `valid`).
- Derive a first name from the email local-part where it's a person; fall back cleanly otherwise.

## Optional B2B fallback (Apollo-style)
- Match by LinkedIn URL when you have it (far more accurate than company-name matching).
- Send a real browser `User-Agent` on people/match calls.
- Coverage of very small operators is thin — expect misses; phone is the channel there.

## Practical tips
- Public-data numeric fields are often stored as **text** — cast them in query filters/sorts.
- Bake the first name into a `personalization` variable so the email body is just `{{personalization}}` and never renders blank.
- Confirm the final state in Instantly (search the lead, check the `campaign` field + populated variables) before treating a batch as done.
