#!/usr/bin/env python3
"""
Super Search pull (reference) — state fan-out to get a representative pool past the ~50 preview cap.

This PREVIEWS leads (names + company + LinkedIn, no emails). For verified emails, use the native
Super Search ENRICHMENT job instead (see scripts/enrich_notes.md) or run these through enrichment.

No keys are embedded. Reads your Instantly key from env INSTANTLY_KEY or ~/.config/instantly/api_key.
Edit the FILTER block per run, then: python3 supersearch_pull.py
"""
import json, os, urllib.request, concurrent.futures

API_KEY = (os.environ.get("INSTANTLY_KEY")
           or open(os.path.expanduser("~/.config/instantly/api_key")).read().strip())
ENDPOINT = "https://api.instantly.ai/api/v2/supersearch-enrichment/preview-leads-from-supersearch"

# ============ EDIT PER RUN ============
KEYWORD_INCLUDE = "DOT compliance,FMCSA compliance,motor carrier compliance,DOT consultant,DOT drug testing"
KEYWORD_EXCLUDE = "software,telematics,gps,environmental,osha,food safety,insurance,logistics,freight"
TITLES = ["CEO", "Founder", "Owner", "President", "Managing Partner"]
EMPLOYEE_COUNT = "1,50"   # "min,max"
OUTPUT_PATH = "/tmp/pool.json"
# ======================================

STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
    "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana",
    "Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana",
    "Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina",
    "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
    "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
    "Wisconsin","Wyoming"]

BASE = {"keyword_filter": {"include": KEYWORD_INCLUDE, "exclude": KEYWORD_EXCLUDE},
        "title": {"include": TITLES}, "employee_count": [EMPLOYEE_COUNT]}

def fetch(state):
    body = {"search_filters": {**BASE, "locations": [{"country": "United States", "state": state}]}, "limit": 50}
    req = urllib.request.Request(ENDPOINT, method="POST", data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json",
                 "User-Agent": "Mozilla/5.0 (Macintosh) Pull/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()).get("leads", [])
    except Exception:
        return []

by_li, no_li = {}, []
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    for leads in ex.map(fetch, STATES):
        for L in leads:
            li = (L.get("linkedIn") or "").lower().rstrip("/")
            (by_li.setdefault(li, L) if li else no_li.append(L))
total = list(by_li.values()) + no_li
json.dump(total, open(OUTPUT_PATH, "w"))
print(f"unique leads: {len(total)} -> {OUTPUT_PATH}")
