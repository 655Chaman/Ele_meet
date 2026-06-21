import pandas as pd
import requests
import json
import time
import os
import re
from dotenv import load_dotenv

load_dotenv("/Users/syedchamansha/HQ/.env")

apollo_keys = [os.getenv("APOLLO_KEY_1"), os.getenv("APOLLO_KEY_2")]
anymail_key = os.getenv("ANYMAIL_FINDER_KEY")

raw_csv = "/Users/syedchamansha/HQ/Leads/US_Violators/raw_500_US_violators.csv"
output_csv = "/Users/syedchamansha/HQ/Leads/US_Violators/target_leads.csv"

# Load the raw data
df = pd.read_csv(raw_csv)
enriched_leads = []

current_apollo_key_idx = 0

def clean_company_name(name):
    name = str(name).upper()
    # Remove common corporate suffixes that break Apollo search
    name = re.sub(r'\b(LLC|INC|CORP|CORPORATION|COMPANY|CO|LTD|LP|GROUP)\b\.?', '', name)
    # Remove things in parentheses
    name = re.sub(r'\(.*?\)', '', name)
    # Remove special characters
    name = re.sub(r'[^\w\s]', ' ', name)
    return name.strip()

def get_apollo_contact(raw_company_name):
    global current_apollo_key_idx
    company_name = clean_company_name(raw_company_name)
    if not company_name:
        return None
        
    url = "https://api.apollo.io/v1/mixed_people/search"
    headers = {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }
    
    # Try with the current key
    data = {
        "api_key": apollo_keys[current_apollo_key_idx],
        "q_organization_name": company_name,
        "person_titles": ["Director of EHS", "EHS", "Compliance", "Environmental", "Operations", "Safety"],
        "per_page": 1
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 429:
            print(f"[*] Apollo Key {current_apollo_key_idx+1} Rate Limited. Switching keys...")
            current_apollo_key_idx = (current_apollo_key_idx + 1) % len(apollo_keys)
            data["api_key"] = apollo_keys[current_apollo_key_idx]
            response = requests.post(url, headers=headers, json=data)
            
        if response.status_code == 200:
            res_json = response.json()
            people = res_json.get("people", [])
            if people:
                person = people[0]
                return {
                    "full_name": f"{person.get('first_name', '')} {person.get('last_name', '')}".strip(),
                    "title": person.get("title", ""),
                    "email": person.get("email", ""),
                    "linkedin_url": person.get("linkedin_url", "")
                }
            else:
                 # Try again with an even broader search if 0 results
                 data["person_titles"] = ["Founder", "CEO", "President", "Manager"]
                 response = requests.post(url, headers=headers, json=data)
                 if response.status_code == 200 and response.json().get("people"):
                     person = response.json().get("people")[0]
                     return {
                        "full_name": f"{person.get('first_name', '')} {person.get('last_name', '')}".strip(),
                        "title": person.get("title", ""),
                        "email": person.get("email", ""),
                        "linkedin_url": person.get("linkedin_url", "")
                     }
        else:
            print(f"  [-] Apollo API returned status {response.status_code}: {response.text[:100]}")
    except Exception as e:
        print(f"[-] Apollo API Error for {company_name}: {e}")
    return None

def verify_email(email):
    if not email:
        return False
        
    url = "https://api.anymailfinder.com/v5.1/verify-email"
    headers = {
        "X-Api-Key": anymail_key,
        "Content-Type": "application/json"
    }
    data = {"email": email}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            status = response.json().get("status")
            return status in ["verified", "valid"] 
    except Exception as e:
        print(f"[-] AnymailFinder Error for {email}: {e}")
    return False

print("[*] Starting Enrichment Pipeline...")

# Target 10 solid leads to deliver immediately
target_limit = 10 

for index, row in df.iterrows():
    if len(enriched_leads) >= target_limit:
        break
        
    raw_company = row.get("facility_name")
    print(f"[*] Processing {index+1}/{len(df)}: {raw_company}")
    
    contact = get_apollo_contact(raw_company)
    
    if contact and contact["email"]:
        # We found an email, let's verify it
        is_verified = verify_email(contact["email"])
        if is_verified:
            print(f"  [+] Found Verified EHS Contact: {contact['full_name']} - {contact['email']}")
            enriched_leads.append({
                "company_name": raw_company,
                "full_name": contact["full_name"],
                "title": contact["title"],
                "email": contact["email"],
                "verified_email": contact["email"], 
                "lead_category": "Convicted Violator",
                "fine_amount": "Pending", 
                "violation_reason": row.get("violation_program", "Clean Water Act")
            })
        else:
            print(f"  [-] Email unverified for {raw_company}, skipping...")
    else:
         print(f"  [-] No contact found for {raw_company}")
         
    time.sleep(0.5)

print(f"\n[+] Successfully generated {len(enriched_leads)} fully enriched and verified leads.")

if enriched_leads:
    final_df = pd.DataFrame(enriched_leads)
    final_df.to_csv(output_csv, index=False)
    print(f"[+] Written to {output_csv}")
else:
    print("[-] No leads were successfully enriched. Check API credits.")
