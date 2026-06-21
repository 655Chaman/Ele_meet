# Pre-Built Market 3: Tech Recruitment (Retention & Expansion)

## 1. Live Fire Sales Dossier
**Industry Physics:** Tech recruiters charge 15-25% of the candidate's first-year salary. If they place a $200k Principal Engineer, they make $40k. They are desperate for "fresh orders" (companies hiring).
**The Jargon to Drop:** "Time-to-fill," "Backfill vs. New Headcount," "Retained vs. Contingent," "Candidate ghosting," "On-target earnings (OTE)."
**The "Do Not Say" List:** 
- "We can get you 50 leads." (They don't want leads, they want *job orders*.)
**The Pain Probe:** "I saw you're still looking for a Lead React Dev. Is this a backfill for someone who left, or new headcount for a Q3 roadmap? Most of my recruiters are seeing a 45-day time-to-fill on React right now."

## 2. Copy Analysis & Due Diligence
**The Winning Angle:** The "Difficulty Acknowledgment."
*Why it works:* Hiring managers are stressed. Acknowledging that the role they are hiring for is notoriously hard to fill makes you sound empathetic and experienced.
**The Prompt for DeepSeek:** 
`"You are connecting a tech recruiter to a hiring manager. Acknowledge that hiring for {Job_Title} in {Location} is currently taking 60+ days. Pitch an intro to a recruiter who averages 14 days. 3 lines max."`

## 3. Dynamic Scraper Script (`supersearch_pull.py`)
```python
import json, urllib.request, os

# Fully dynamic Super Search pull from Instantly API
API_KEY = os.environ.get("INSTANTLY_KEY")
def pull_hiring_companies(keywords="hiring react developer", limit=500):
    url = "https://api.instantly.ai/api/v2/supersearch-enrichment/preview-leads-from-supersearch"
    body = {
        "search_filters": {"keyword_filter": {"include": keywords}},
        "limit": limit
    }
    req = urllib.request.Request(url, method="POST", data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read()).get("leads", [])
```

## 4. NVIDIA AI (DeepSeek V4) Generation Script
```python
import os, requests
def format_tech_copy(company, role):
    key = os.environ.get("NVIDIA_API_KEY")
    prompt = f"Write an outbound line mentioning their open {role} role at {company} and the industry average time-to-fill. Be extremely brief."
    return requests.post("https://api.nvidia.com/v1/chat/completions", 
        json={"model": "deepseek-v4-pro", "messages": [{"role":"user", "content": prompt}]}).json()["choices"][0]["message"]["content"]
```

## 5. Execution Pipeline (Connector Playbook)
### 🔴 Demand Source (The Problem)
- **What:** Tech companies actively hiring and struggling with long time-to-fill.
- **Where:** Apify Actor `SatYrP5cEtVwRV8K1` (Job Scraper - Hiring Urgency).

### 🟢 Supply Source (The Solution)
- **What:** IT Recruitment Agencies.
- **Where:** Apify Actor `qLvSu4iEgjcZF6JGG` (IT Recruitment Agency Scraper).
- **How to Use:** Use the supply actor to pull recruiters, then sell them the demand-side hiring signals.

