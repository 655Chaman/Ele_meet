# Pre-Built Market 7: Local Healthcare / Dentists

## 1. Live Fire Sales Dossier
**Industry Physics:** A dentist's entire business model relies on "Lifetime Patient Value." One new patient might be worth $3,000 over 5 years. If they don't appear in the Google Maps "Local 3-Pack," they starve.
**The Jargon to Drop:** "Local 3-Pack," "Patient acquisition cost," "No-show rate," "Production per hour."
**The Pain Probe:** "I saw you're sitting at 4 reviews while the clinic across the street has 200. Is that impacting your new-patient intake, or are you mostly running on legacy referrals?"

## 2. Dynamic Scraper Script (Apify Maps)
```python
import requests
def trigger_apify_maps_scraper(api_key, search_query="Dentists in Chicago", max_results=500):
    # Triggers Apify Google Maps Scraper actor and returns clinics with < 5 reviews.
    pass
```

## 3. Execution Pipeline (Connector Playbook)
### 🔴 Demand Source (The Problem)
- **What:** Local dental clinics with fewer than 5 Google reviews.
- **Where:** Apify Google Maps Scraper (`compass/google-maps-scraper`).
- **How to Call:** Configure the Apify actor with search term "Dentists" and sort out clinics with < 5 reviews.

### 🟢 Supply Source (The Solution)
- **What:** Local SEO Agencies / Reputation Management SaaS.
- **Where:** Existing internal network or outbound to marketing agencies using Apify.

