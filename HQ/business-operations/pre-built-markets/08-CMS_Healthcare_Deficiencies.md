# Pre-Built Market 8: CMS Healthcare Deficiencies (Form 2567)

## 1. Live Fire Sales Dossier
**Industry Physics:** Nursing homes rely on Medicare/Medicaid for 80%+ of revenue. An uncorrected G-level (or higher) tag results in DPNA (Denial of Payment for New Admissions). They will pay literally anything to fix it.
**The Jargon to Drop:** "DPNA," "Immediate Jeopardy," "F-Tags (e.g., F-880)," "Plan of Correction (PoC)," "Mock Survey," "State Operations Manual."
**The Pain Probe:** "I saw the state survey flagged an Immediate Jeopardy tag. Are you managing the PoC draft internally, or are you bringing in outside consultants before the revisit window?"

## 2. Copy Analysis & Due Diligence
**The Winning Angle:** "Revisit Window."
*Why it works:* It implies a ticking clock that they are intimately aware of.

## 3. Dynamic Scraper Script (`cms_pull.py`)
```python
import requests
def pull_cms_deficiencies(severity_tag="K", limit=500):
    url = "https://data.cms.gov/data-api/v1/dataset/a2039b36-a19e-4e43-bcbb-7e045abaf0cb/data"
    r = requests.get(url, params={"filter[scope_severity]": severity_tag, "size": limit})
    return r.json()
```

## 4. Execution Pipeline (Connector Playbook)
### 🔴 Demand Source (The Problem)
- **What:** Nursing homes facing Immediate Jeopardy or G-Level Tags.
- **Where:** Custom Python script (Snippet above).
- **How to Call:** Run the python snippet directly to pull CMS deficiencies from the open API.

### 🟢 Supply Source (The Solution)
- **What:** Healthcare Compliance Consultants / SNF Turnaround Experts.
- **Where:** Apify Google Maps Scraper (`compass/google-maps-scraper`).
- **How to Use:** Search for "Nursing Home Compliance Consultants".

