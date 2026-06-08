# Building the Demand Side (today's recipe)

Goal: a campaign full of the *bleeding* accounts — companies hit by a public enforcement event — with verified emails. Worked example: **200 FMCSA-flagged carriers with verified emails.**

## The pipeline
1. **Pull the flagged accounts from the public enforcement database.** For FMCSA: query the safety-scores dataset for "flagged" carriers (high maintenance/CSA measure, out-of-service inspections above a threshold), ordered by severity.
   - **Numeric fields are often stored as text — cast them** in `$where`/`$order` (e.g. `vehicle_oos_insp_total::number > 5`). URL-encode spaces/operators.
   - Pull enough to clear your volume floor — demand floor ~150, target up to ~400. Never ship 20–30; volume is credibility (especially on camera).

2. **Join to the contact/census dataset on the shared key** (`dot_number` for FMCSA) to get legal name, phone, email. Keep US, filter to records that actually have an email. Chunk the ID lookups (~100 per query) to keep URLs sane.

3. **Verify the emails.** Run each native email through an email verifier (e.g. AnyMail Finder `POST /v5.1/verify-email`, `Authorization: <key>` header, body `{"email": "..."}` → `email_status`). **Keep only `valid`** and collect until you hit your target (e.g. 200). Stale gmail/yahoo addresses on tiny operators will verify invalid — that's expected; treat those as phone-first.

4. **Resolve a first name where possible.** Carriers are companies, so derive the first name from the email local-part where it's a person (`scott@…` → Scott); otherwise fall back cleanly ("there"). Bake it into the `personalization` variable so the body is just `{{personalization}}`.

5. **Create the campaign + push the leads via the Instantly MCP** (see `instantly-mcp.md`). Verify every lead has a non-empty `first_name` and `personalization` before declaring done.

## Demand vs. supply enrichment — key difference
- **Supply** = real B2B firms → native Super Search / Apollo-style enrichment works well.
- **Demand** (enforced companies, often small operators) = the **public database itself** is your contact source (phone + email native). Third-party people-finders have poor coverage here and produce false matches. So: verify the native data; don't over-engineer it.

## Copy
From `templates/copy-bones.md`. Demand opener (proven bones): *"I'm connected with [fixers] who've handled [the problem] hundreds of times — [specifics]. Before I connect anyone, wanted to check if the timing makes sense on your end. Worth a quick call?"* + the 2 follow-ups.
