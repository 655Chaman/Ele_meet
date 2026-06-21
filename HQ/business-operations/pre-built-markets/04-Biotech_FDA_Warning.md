# Pre-Built Market 4: Biotech & FDA Warnings

## 1. Live Fire Sales Dossier
**Industry Physics:** An FDA 483 or Warning Letter can halt manufacturing. A halted line in pharma/biotech burns millions of dollars a day. QA/RA consultants charge $50k-$200k+ to rewrite the QMS (Quality Management System) and appease the FDA.
**The Jargon to Drop:** "Form 483," "CAPA (Corrective and Preventive Action)," "Warning Letter," "QMS Remediation," "Consent Decree."
**The "Do Not Say" List:** 
- "We can fix your FDA problem." (No, the consultant fixes it. You just broker the introduction).
**The Pain Probe:** "Noticed the 483 pertained to CAPA documentation. Is the FDA giving you 15 days for a response, or have they already moved to a Warning Letter?"

## 2. Copy Analysis & Due Diligence
**The Winning Angle:** The "Specific Tag" callout. 
*Why it works:* Most cold emailers just say "saw your FDA warning." You say "saw your 483 regarding *inadequate sterile validation*." Specificity proves you read the document.
**The Prompt for DeepSeek:** 
`"Write a 2-line intro to a Pharma QA Director. Mention their recent FDA 483 regarding {specific_finding}. Offer an intro to a remediation specialist. No fluff."`

## 3. Dynamic Scraper Script (`fda_pull.py`)
```python
import requests, json
# Hits the FDA Warning Letter API directly
def scrape_fda_warnings(days_back=30):
    url = f"https://api.fda.gov/drug/enforcement.json?search=report_date:[{(date.today()-timedelta(days=days_back)).strftime('%Y%m%d')} TO {date.today().strftime('%Y%m%d')}]&limit=100"
    return requests.get(url).json()
```

## 4. Execution Pipeline (Connector Playbook)
### 🔴 Demand Source (The Problem)
- **What:** Pharma/Biotech companies hit with FDA Warning Letters for quality control failures.
- **Where:** In-House Local Scraper (Free)
- **Path:** `/Users/syedchamansha/HQ/scrapers/fda_warnings/scraper.py`
- **Apify Backup:** Actor `y4a7XmvKI1X1Uyypo`
- **Bonus Demand Signal:** BioSpace Jobs Scraper (Apify `iICf5MmhJkgxdQmwJ`) to see if they are actively hiring QA managers to fix the problem.

### 🟢 Supply Source (The Solution)
- **What:** Life Sciences Regulatory & QA/QC Consulting Firms
- **Where:** Apify Google Maps Scraper (`compass/google-maps-scraper`)
- **How to Use:** Search for "Life Sciences Regulatory Consulting" or use the CSV→Dataset Connector (`CA0UvZCGtTSHH1hpK`) to feed in a list of FDA compliance consultants from SalesNav/Apollo.

