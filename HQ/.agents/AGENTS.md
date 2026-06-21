## Scraper Architecture Rule
Apify Scrapers MUST ONLY be built for raw data extraction. NEVER build email enrichment, phone number enrichment, or Apollo API integrations directly into the scraper code. Enrichment pipelines are strictly separate and handled exclusively by the user post-extraction.

## The ELESIUM Supply-Side Matrix Rule
Whenever discussing, scraping, or processing environmental leads, you MUST strictly differentiate between the two core supply-side profiles. This distinction dictates how the data is handled and pitched in Apollo:

1. **"Convicted Violators" (US, UK, Canada, Australia)**
   - **Profile:** Companies caught and fined for breaking environmental laws.
   - **Outreach Angle:** High-urgency, punitive. Focus on compliance remediation and preventing future fines.
   - **Database Reality:** The US EPA ECHO API is currently the gold standard and highly reliable.

2. **"Heavy Industrial Polluters" (Germany, France, EU)**
   - **Profile:** Massive industrial sites (E-PRTR) that legally emit heavy pollutants. They are NOT convicted violators (due to strict EU privacy laws preventing public violator registries).
   - **Outreach Angle:** Consultative, preventative. Focus on green optimization and preparing for future EU emissions regulations.
   - **Database Reality:** EU databases are often hidden behind complex interactive maps or strict firewalls requiring heavy Playwright bypasses.

**Operational Mandate:** 
- The Apify scraper MUST always output a `lead_category` column explicitly labeling the lead as either "Convicted Violator" or "Heavy Industrial Polluter".
- You must NEVER suggest mixing these two profiles into the same cold email outreach sequence.
