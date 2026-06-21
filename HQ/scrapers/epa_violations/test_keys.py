import requests
import os
import time
from dotenv import load_dotenv

load_dotenv("/Users/syedchamansha/HQ/.env")
apify_token = os.getenv("APIFY_TOKEN")
url = f"https://api.apify.com/v2/acts/scraperlink~google-search-results-serp-scraper/runs?token={apify_token}"
headers = {"Content-Type": "application/json"}

# Try common input keys
keys_to_test = ["searchQueries", "queries", "query", "searchQuery", "keywords", "searchKeywords"]

for key in keys_to_test:
    print(f"[*] Testing input key: '{key}'")
    payload = {
        key: "site:linkedin.com/in/ \"CEO\" \"ABF Freight\""
    }
    
    res = requests.post(url, headers=headers, json=payload)
    run_data = res.json()
    
    if 'data' in run_data:
        run_id = run_data['data']['id']
        dataset_id = run_data['data']['defaultDatasetId']
        
        # wait for run to finish
        while True:
            status_url = f"https://api.apify.com/v2/actor-runs/{run_id}?token={apify_token}"
            status = requests.get(status_url).json()['data']['status']
            if status in ["SUCCEEDED", "FAILED", "ABORTED"]:
                break
            time.sleep(1)
            
        # check if it actually searched
        data_res = requests.get(f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={apify_token}").json()
        if data_res and len(data_res) > 0 and 'organicResults' in data_res[0]:
            print(f"[+] SUCCESS! The correct key is: {key}")
            break
        else:
            print(f"[-] Key '{key}' worked to start the run, but returned empty results.")
    else:
         print(f"[-] Failed to start run with key '{key}'")
