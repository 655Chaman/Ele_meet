# Instantly MCP — campaigns, leads, follow-ups

The campaign layer runs on the **Instantly MCP** (connect it in Claude Code so the agent can operate Instantly directly). Below is exactly how today's two campaigns were built and updated.

## Connect it
Add the Instantly MCP server to Claude Code (authenticate with your Instantly API key — see `templates/keys.template.txt`). Once connected, the agent has tools like `create_campaign`, `add_leads_to_campaign_or_list_bulk`, `move_leads_to_campaign_or_list`, `update_campaign`, `verify_email`, `list_campaigns`, `get_campaign`.

## 1. Create a campaign — `create_campaign`
Two-step tool:
- First call with `name`, `subject`, `body` → it returns your eligible **sender accounts**.
- Call again including `email_list: [...senders]` → the campaign is created (status = draft).
- Set `subject` and `body` to your variable-driven copy:
  - `subject`: `{{firstName}}, <market> <service>`  (put the first name IN the subject)
  - `body`: `{{personalization}}`  (the pre-baked, name-included opener)

## 2. Push leads in
Two reliable paths:
- **`add_leads_to_campaign_or_list_bulk`** — up to 1,000 leads, each `{email, first_name, last_name, company_name, personalization}`. **Do NOT set `skip_if_in_campaign: true` for leads that already exist in your workspace** — they'll be skipped and never attach. Bake `first_name` + `personalization` into each lead object so nothing is empty.
- **`move_leads_to_campaign_or_list`** — move an existing lead **list** into the campaign (`list_id` → `to_campaign_id`). Useful when leads were created by the Super Search enrichment list.

**Confirm it landed:** after pushing, search a few lead emails and check the `campaign` field matches and `first_name`/`personalization` are populated.

## 3. Add follow-ups — `update_campaign` (`sequences`)
Pass the FULL sequence (step 1 + the follow-ups). Each step: `{type:"email", delay:<days>, variants:[{subject, body}]}`. Follow-ups use an **empty subject** so they thread under the first email. Proven 3-step shape:
1. Subject `{{firstName}}, <market> <service>` · body `{{personalization}}`
2. (empty subject) · *"Hey {{firstName}} — do you have capacity for new clients right now? / is this still open on your end right now?"* + "Sent from my iPhone"
3. (empty subject) · *"Leaving the door open. When you're ready for more / whenever the timing's right, I'm one reply away. Thanks for the time. Best, {{sendingAccountFirstName}}"* + "Sent from my iPhone"

## 4. Variables
Core: `{{firstName}}`, `{{lastName}}`, `{{companyName}}`, `{{sendingAccountFirstName}}`, and the custom `{{personalization}}`. Bake the first name into `personalization` (and use it in the subject) so the email never reads "Hey ,".

## Reference IDs from today's build (yours will differ)
- `DOT Compliance — Supply` (500 leads, 3-step sequence)
- `DOT Compliance — Demand` (200 leads, 3-step sequence)
- Both: subject `{{firstName}}, DOT compliance`, body `{{personalization}}`, 15 warmed senders, drafts (not launched).
