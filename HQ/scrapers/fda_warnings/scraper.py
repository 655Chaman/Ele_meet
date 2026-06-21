import argparse
import requests
import pandas as pd
import time
import os

def calculate_urgency_score(violation_type):
    """Calculate the urgency score based on the violation type keywords."""
    if not violation_type:
        return 1
    
    vt_lower = violation_type.lower()
    
    if 'criminal' in vt_lower or 'fraud' in vt_lower:
        return 5
    elif 'data integrity' in vt_lower or 'cgmp' in vt_lower:
        return 4
    elif 'adulterated' in vt_lower or 'adulteration' in vt_lower:
        return 3
    elif 'labeling' in vt_lower or 'label' in vt_lower:
        return 2
    else:
        return 1

def main():
    parser = argparse.ArgumentParser(description="Scrape FDA Enforcement reports")
    parser.add_argument("--limit", type=int, default=100, help="Number of records to fetch")
    args = parser.parse_args()

    base_url = "https://api.fda.gov/drug/enforcement.json"
    
    parsed_data = []
    skip = 0
    batch_size = 100
    
    while len(parsed_data) < args.limit:
        current_limit = min(batch_size, args.limit - len(parsed_data))
        url = f"{base_url}?limit={current_limit}&skip={skip}"
        
        print(f"Fetching data from {url}...")
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data: {e}")
            break

        results = data.get('results', [])
        if not results:
            print("No more results found.")
            break

        print(f"Fetched {len(results)} records in this batch.")
        
        for item in results:
            violation_type = item.get('reason_for_recall', '')
            
            parsed_item = {
                'company_name': item.get('recalling_firm', ''),
                'city': item.get('city', ''),
                'state': item.get('state', ''),
                'issue_date': item.get('recall_initiation_date', ''),
                'violation_type': violation_type,
                'product_type': item.get('product_type', ''),
                'classification': item.get('classification', ''),
                'urgency_score': calculate_urgency_score(violation_type)
            }
            parsed_data.append(parsed_item)
            
        skip += len(results)
        
        # Sleep to be respectful of the API if we need to make another request
        if len(parsed_data) < args.limit:
            print("Sleeping for 1 second to be respectful...")
            time.sleep(1)
            
    if not parsed_data:
        print("No data was parsed. Exiting.")
        return
        
    df = pd.DataFrame(parsed_data)
    
    output_path = "/Users/syedchamansha/HQ/scrapers/fda_warnings/leads.csv"
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    
    print(f"\nSuccessfully saved {len(parsed_data)} rows to {output_path}")
    print("\nSample Data:")
    print(df.head(3).to_string(index=False))

if __name__ == "__main__":
    main()
