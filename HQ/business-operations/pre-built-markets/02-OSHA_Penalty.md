# Pre-Built Market 2: OSHA Penalties (Penalty Market)

## 1. Live Fire Sales Dossier
**Industry Physics:** OSHA fines compound. If a plant gets an initial $15k fine for machine guarding, and OSHA returns 30 days later and it isn't fixed, it becomes a "Willful" or "Repeat" violation—which carries a $156,000+ penalty per day. 
**The Jargon to Drop:** "Abatement period," "Willful violation," "LOTO (Lockout/Tagout)," "Informal settlement conference," "Area Director."
**The "Do Not Say" List:** 
- "We can get your fine dismissed." (Only lawyers say this. Fixers say: "We can help you negotiate the abatement down at the informal conference.")
**The Pain Probe:** "I saw the citation for Lockout/Tagout. Has the Area Director scheduled the informal conference yet, or are you still in the 15-day abatement window?"

## 2. Copy Analysis & Due Diligence
**The Winning Angle:** The "Timeline Threat" framework.
*Why it works:* Owners procrastinate until the 15-day window is almost closed. Reminding them of the impending deadline forces action.
**The Prompt for DeepSeek:** 
`"Write a 2-line email to a plant manager. Note that their OSHA citation for {Violation} requires abatement soon. Offer an intro to an EHS specialist who handles informal conferences."`

## 3. Dynamic Scraper Script (`osha_pull.py`)
```python
import requests, json, sys, urllib.parse
from datetime import date, timedelta

# Usage: python osha_pull.py <api_key> <state> <days_back>
KEY = sys.argv[1]
STATE = sys.argv[2]
DAYS = int(sys.argv[3])
START = str(date.today() - timedelta(days=DAYS))

def query_osha():
    filt = {"and": [
        {"field": "site_state", "operator": "eq", "value": STATE},
        {"field": "open_date", "operator": "gt", "value": START}
    ]}
    q = urllib.parse.urlencode({"filter_object": json.dumps(filt), "limit": 500, "X-API-KEY": KEY})
    r = requests.get(f"https://apiprod.dol.gov/v4/get/osha/inspection/json?{q}")
    return r.json()
```

## 4. NVIDIA AI (DeepSeek V4) Generation Script
```python
# Similar logic to FMCSA, utilizing the deepseek-v4-pro model for generation.
```

## 5. Execution Pipeline (Connector Playbook)
### 🔴 Demand Source (The Problem)
- **What:** Companies slapped with severe OSHA penalties.
- **Where:** In-House Local Scraper (Free)
- **Path:** `/Users/syedchamansha/HQ/scrapers/osha_citations/scraper.py`
- **Apify Backup:** Actor `QuSUJMwjWEoDfPvn7`

### 🟢 Supply Source (The Solution)
- **What:** Environmental Health & Safety (EHS) Consulting Firms
- **Where:** Apify Actor `UhdFojVq9ReTXbofj` (Safety Consultants Supply Directory)
- **How to Use:** Match the penalty type (e.g., LOTO, Machine Guarding) with a specialized EHS consultant.

