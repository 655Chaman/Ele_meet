import requests
import os
import time
from dotenv import load_dotenv

load_dotenv("/Users/syedchamansha/HQ/.env")
apify_token = os.getenv("APIFY_TOKEN")

def search_linkedin_via_apify(company_name):
    print(f"[*] Starting Apify Google Search for: {company_name}")
    url = f"https://api.apify.com/v2/acts/apify~google-search-scraper/runs?token={apify_token}"
    
    payload = {
        "queries": f"site:linkedin.com/in/ \"Director of EHS\" OR \"Safety\" \"{company_name}\"",
        "resultsPerPage": 1,
        "maxPagesPerQuery": 1,
        "languageCode": "en",
        "countryCode": "us"
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        # Start the run
        res = requests.post(url, headers=headers, json=payload)
        run_data = res.json()
        run_id = run_data['data']['id']
        dataset_id = run_data['data']['defaultDatasetId']
        print(f"[+] Run started: {run_id}. Waiting for completion...")
        
        # Poll for completion
        while True:
            status_url = f"https://api.apify.com/v2/actor-runs/{run_id}?token={apify_token}"
            status_res = requests.get(status_url).json()
            status = status_res['data']['status']
            if status == "SUCCEEDED":
                print("[+] Run succeeded!")
                break
            elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                print(f"[-] Run failed with status: {status}")
                return None
            time.sleep(2)
            
        # Get results
        dataset_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={apify_token}"
        data_res = requests.get(dataset_url).json()
        
        if data_res and len(data_res) > 0 and 'organicResults' in data_res[0]:
            results = data_res[0]['organicResults']
            if results:
                first_result = results[0]
                print(f"[+] Found LinkedIn Profile:")
                print(f"    Title: {first_result.get('title')}")
                print(f"    Snippet: {first_result.get('description')}")
                return first_result.get('title')
        print("[-] No LinkedIn results found.")
        return None
        
    except Exception as e:
        print(f"[-] Apify Error: {e}")
        return None

if __name__ == "__main__":
    search_linkedin_via_apify("ABF Freight")
