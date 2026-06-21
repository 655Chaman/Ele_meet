import requests
import os
import json
from dotenv import load_dotenv

load_dotenv("/Users/syedchamansha/HQ/.env")
apify_token = os.getenv("APIFY_TOKEN")
url = f"https://api.apify.com/v2/acts/scraperlink~google-search-results-serp-scraper/run-sync-get-dataset-items?token={apify_token}"
headers = {"Content-Type": "application/json"}

keys_to_test = [
    "q", "query", "queries", "searchQuery", "searchQueries", 
    "keyword", "keywords", "searchKeyword", "searchKeywords", 
    "searchTerm", "searchTerms", "search_queries", "search_terms",
    "search_keywords", "url", "urls"
]

for key in keys_to_test:
    print(f"[*] Testing key: {key}")
    payload = {
        key: "site:linkedin.com/in/ \"CEO\" \"ABF Freight\"",
        "limit": 1
    }
    try:
        res = requests.post(url, headers=headers, json=payload)
        data = res.json()
        if isinstance(data, list) and len(data) > 0:
            item = data[0]
            if item.get("searchQuery") and item["searchQuery"].get("term") != "Unknown Query":
                print(f"[+] FOUND IT! The key is: {key}")
                print(json.dumps(item.get("searchQuery"), indent=2))
                break
            else:
                print(f"[-] Key '{key}' returned empty/unknown.")
        else:
            print(f"[-] Key '{key}' returned empty array.")
    except Exception as e:
        print(f"[-] Error on key '{key}': {e}")

