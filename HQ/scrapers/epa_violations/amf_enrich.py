import pandas as pd
import requests
import time
import os
import re
from dotenv import load_dotenv

load_dotenv("/Users/syedchamansha/HQ/.env")
anymail_key = os.getenv("ANYMAIL_FINDER_KEY")

raw_csv = "/Users/syedchamansha/HQ/Leads/US_Violators/raw_500_US_violators.csv"
output_csv = "/Users/syedchamansha/HQ/Leads/US_Violators/amf_target_leads.csv"

# Load the raw data
df = pd.read_csv(raw_csv)
enriched_leads = []

def clean_company_name(name):
    name = str(name).upper()
    name = re.sub(r'\b(LLC|INC|CORP|CORPORATION|COMPANY|CO|LTD|LP|GROUP)\b\.?', '', name)
    name = re.sub(r'\(.*?\)', '', name)
    name = re.sub(r'[^\w\s]', ' ', name)
    return name.strip()

def get_company_emails_amf(raw_company_name):
    company_name = clean_company_name(raw_company_name)
    if not company_name:
        return []
        
    url = "https://api.anymailfinder.com/v5.1/find-email/company"
    headers = {
        "Authorization": f"Bearer {anymail_key}",
        "Content-Type": "application/json"
    }
    data = {
        "company_name": company_name
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            result = response.json()
            # The API usually returns an array of emails or an object containing 'emails'
            emails_data = result.get('emails', [])
            if not emails_data and isinstance(result, list):
                emails_data = result
                
            valid_emails = []
            for item in emails_data:
                # Handle cases where the item is a string vs a dict
                if isinstance(item, dict):
                    email = item.get('email')
                    status = item.get('email_status') or item.get('status')
                    if email and status in ['valid', 'verified', 'catch_all']:
                        valid_emails.append(email)
                elif isinstance(item, str):
                    valid_emails.append(item)
                    
            return valid_emails
        elif response.status_code == 404:
            print(f"  [-] AMF found 0 emails for {company_name}")
            return []
        else:
            print(f"  [-] AMF API Error for {company_name}: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"[-] AMF Exception for {company_name}: {e}")
    return []

print("[*] Starting Exclusive AMF Enrichment Pipeline...")

for index, row in df.iterrows():
    raw_company = row.get("facility_name")
    print(f"[*] Processing {index+1}/{len(df)}: {raw_company}")
    
    emails = get_company_emails_amf(raw_company)
    
    if emails:
        # Just grab the first verified email AMF hands us
        best_email = emails[0]
        print(f"  [+] Success: Found {len(emails)} emails. Best: {best_email}")
        enriched_leads.append({
            "company_name": raw_company,
            "verified_email": best_email,
            "all_emails_found": " | ".join(emails),
            "lead_category": "Convicted Violator",
            "violation_reason": row.get("violation_program", "Clean Water Act")
        })
    else:
        # We couldn't find an email via AMF Company Search
        pass
        
    time.sleep(1) # Be polite to the AMF API rate limits

print(f"\n[+] Successfully generated {len(enriched_leads)} fully enriched and verified leads using AMF exclusively.")

if enriched_leads:
    final_df = pd.DataFrame(enriched_leads)
    final_df.to_csv(output_csv, index=False)
    print(f"[+] Written to {output_csv}")
else:
    print("[-] No leads were successfully enriched. The API might require domains instead of company names.")
