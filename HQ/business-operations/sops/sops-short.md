# SOPs & Backend Operations

## 1. The Pre-Call Dossier
**Trigger:** Client books an intake call (Calendly -> Webhook).
**Action:**
1. Sync to ClickUp CRM.
2. Trigger Exa AI to research the company.
3. Feed Exa data to Claude to extract a non-surface-level insight.
4. Email Prospect: "Hey [Name], [Claude Insight] - should make for an interesting conversation. Thanks for booking."

## 2. Intra-Onboarding (Post-Payment)
**Trigger:** Stripe Webhook ($2k-$6k retainer hits).
**Action (Within 10 minutes):**
1. Create ClickUp Folder.
2. Create dedicated Slack Channel (`#client-[companyname]`).
3. Send Welcome Email + Intake Questionnaire.
4. Schedule Onboarding Call (30 min max).

## 3. The Quality Control Gate (No Embarrassment Framework)
Before ANY campaign launches, emails must be graded:
*   **Level 1:** Name + Company only (FAIL)
*   **Level 2:** + Industry + Role (MINIMUM PASS)
*   **Level 3:** + Recent company news (GOOD)
*   **Level 4:** + Mutual connection (HIGH VALUE TARGETS)
*   **Level 5:** + Specific tailored value proposition
