import os
import csv
import time
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv("/Users/syedchamansha/HQ/.env")
APIFY_TOKEN = os.environ.get("APIFY_TOKEN")

def salvage_address(address_name, street, city, state):
    if not APIFY_TOKEN:
        print("[-] APIFY_TOKEN not found.")
        return None
        
    client = ApifyClient(APIFY_TOKEN)
    
    search_term = f"{address_name} {street} {city} {state}".strip()
    print(f"  [Apify] Searching Google Maps for: {search_term}")
    
    run_input = {
        "searchStringsArray": [search_term],
        "maxCrawledPlacesPerSearch": 1,
        "language": "en",
        "proxyConfig": {"useApifyProxy": True}
    }
    
    try:
        # Using drobnikj/crawler-google-places which is highly reliable for Places
        run = client.actor("drobnikj/crawler-google-places").call(run_input=run_input)
        dataset_id = run["defaultDatasetId"]
        items = client.dataset(dataset_id).list_items().items
        
        if items:
            best_match = items[0]
            title = best_match.get("title", "")
            if title and not any(word in title.lower() for word in ["street", "avenue", "blvd", "drive"]):
                print(f"  [Salvage Success] Extracted Corporate Entity: {title}")
                return title
        print("  [Salvage Failed] No business found at this address.")
        return None
    except Exception as e:
        print(f"  [Apify Error] {e}")
        return None

def main():
    salvage_file = "/Users/syedchamansha/HQ/Leads/EPA_Violations/lead_list_[Salvage_Addresses_EPA_CA]_[2026-06-18].csv"
    corporate_file = "/Users/syedchamansha/HQ/Leads/EPA_Violations/lead_list_[Corporate_EPA_CA]_[2026-06-18].csv"
    
    if not os.path.exists(salvage_file):
        print("No salvage file found.")
        return
        
    with open(salvage_file, "r") as f:
        salvage_leads = list(csv.DictReader(f))
        
    print(f"Found {len(salvage_leads)} discarded address leads to salvage.")
    
    salvaged_count = 0
    with open(corporate_file, "a", newline="") as f:
        writer = None
        
        # Process all discarded leads
        for row in salvage_leads:
            name = row.get("facility_name", "")
            street = row.get("street", "")
            city = row.get("city", "")
            state = row.get("state", "")
            
            corp_name = salvage_address(name, street, city, state)
            if corp_name:
                row["facility_name"] = corp_name
                row["salvaged_from_address"] = "True"
                
                if not writer:
                    fieldnames = list(row.keys())
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writerow(row)
                salvaged_count += 1
                
    print(f"\n✅ Salvaged {salvaged_count} corporate leads from physical addresses and appended to master list!")

if __name__ == "__main__":
    main()
