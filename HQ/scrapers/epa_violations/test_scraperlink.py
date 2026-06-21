import requests
import os
import time
import json
from dotenv import load_dotenv

load_dotenv("/Users/syedchamansha/HQ/.env")
apify_token = os.getenv("APIFY_TOKEN")

def test_scraperlink_actor():
    print("[*] Testing scraperlink/google-search-results-serp-scraper...")
    url = f"https://api.apify.com/v2/acts/scraperlink~google-search-results-serp-scraper/runs?token={apify_token}"
    
    # Passing two queries: one for LinkedIn, one for domain
    payload = {
        "queries": "site:linkedin.com/in/ \"Director of EHS\" OR \"Safety\" \"ABF Freight\"\nABF Freight official website",
        "resultsPerPage": 3,
        "maxPagesPerQuery": 1
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        res = requests.post(url, headers=headers, json=payload)
        if res.status_code != 201:
            print(f"[-] Apify Error: {res.status_code} - {res.text}")
            return
            
        run_data = res.json()
        run_id = run_data['data']['id']
        dataset_id = run_data['data']['defaultDatasetId']
        print(f"[+] Run started: {run_id}. Polling for completion...")
        
        while True:
            status_url = f"https://api.apify.com/v2/actor-runs/{run_id}?token={apify_token}"
            status_res = requests.get(status_url).json()
            status = status_res['data']['status']
            if status == "SUCCEEDED":
                print("[+] Run succeeded!")
                break
            elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                print(f"[-] Run failed with status: {status}")
                return
            time.sleep(2)
            
        # Get results
        dataset_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={apify_token}"
        data_res = requests.get(dataset_url).json()
        
        print("\n[+] Extracted SERP Data:")
        for item in data_res:
            query = item.get('searchQuery', {}).get('term', 'Unknown Query')
            results = item.get('organicResults', [])
            print(f"\nQuery: {query}")
            if results:
                print(f"  Top Result: {results[0].get('title')} - {results[0].get('url')}")
            else:
                print("  No results.")
                
    except Exception as e:
        print(f"[-] Exception: {e}")

if __name__ == "__main__":
    test_scraperlink_actor()
