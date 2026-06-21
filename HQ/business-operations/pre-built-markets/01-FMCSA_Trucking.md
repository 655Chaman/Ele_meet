# Pre-Built Market 1: FMCSA Trucking (Penalty Market)

## 1. Live Fire Sales Dossier
**Industry Physics:** Trucking carriers operate on razor-thin margins. Freight brokers won't give them loads if their FMCSA safety score drops. If they get an "Out of Service" (OOS) violation, trucks sit in the yard burning money. 
**The Jargon to Drop:** "Conditional rating," "ELD mandate," "Hours of Service (HOS) logs," "Clearinghouse violations," "MCS-150."
**The "Do Not Say" List:** 
- "I can help you pass your inspection." (No one can guarantee that. Say: "I can help you build the Corrective Action Plan.")
- "Are you hiring drivers?" (Every carrier is always hiring drivers. It shows you don't know the specific safety pain.)
**The Pain Probe:** "I saw the recent Hours of Service flag on the DOT profile. Are your brokers starting to throttle your freight access yet, or are you still able to book loads at standard rates?"

## 2. Copy Analysis & Due Diligence
**The Winning Angle:** The "Silent Observation" framework.
*Why it works:* Trucking owners hate being sold to. They respect people who monitor public data. Mentioning their exact violation shows you aren't spamming 10,000 carriers.
**The Prompt for DeepSeek:** 
`"You are writing to a trucking company owner. Mention their recent {Violation_Type}. Keep it under 40 words. Tone: Direct, blue-collar, peer-to-peer. Do not use corporate speak."`

## 3. Dynamic Scraper Script (`fmcsa_pull.py`)
```python
import requests, json, sys, os
from datetime import date, timedelta

# Usage: python fmcsa_pull.py <days_back> <state_filter>
def scrape_fmcsa(days_back=30, state="TX"):
    url = "https://mobile.fmcsa.dot.gov/qc/services/carriers"
    # Note: Actual FMCSA API requires registered developer key
    # For demo purposes, this represents the dynamic request logic
    print(f"[*] Querying FMCSA for {state} carriers flagged in last {days_back} days...")
    # ... extraction logic ...
```

## 4. NVIDIA AI (DeepSeek V4) Generation Script
```python
import os, requests, json

NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY")
ENDPOINT = "https://api.nvidia.com/v1/chat/completions" # DeepSeek V4 route

def generate_copy(company_name, violation):
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"}
    prompt = f"Write a 2-line cold email to the owner of {company_name} about their recent {violation} DOT violation. Tone: blunt, peer-to-peer."
    payload = {
        "model": "deepseek-v4-pro",
        "messages": [{"role": "user", "content": prompt}]
    }
    return r.json()["choices"][0]["message"]["content"]
```

## 5. Execution Pipeline (Connector Playbook)
### 🔴 Demand Source (The Problem)
- **What:** Trucking carriers flagged with FMCSA "Out of Service" violations.
- **Where:** Custom Python script (Snippet above).
- **How to Call:** Run the python snippet above directly, or use an Apify actor for FMCSA safety ratings.

### 🟢 Supply Source (The Solution)
- **What:** DOT/FMCSA Safety Consultants.
- **Where:** Apify Google Maps Scraper (`compass/google-maps-scraper`).
- **How to Use:** Search for "DOT Safety Consultants" or "Trucking Compliance Consultants".

