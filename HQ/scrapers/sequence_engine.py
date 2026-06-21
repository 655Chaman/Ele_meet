import os
import csv
import json
import time
import argparse
import requests
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from HQ/.env
load_dotenv("/Users/syedchamansha/HQ/.env")

APOLLO_KEY = os.environ.get("APOLLO_KEY_2")
NVIDIA_KEY = os.environ.get("NVIDIA_API_KEY")
NVIDIA_KEY_FALLBACK = os.environ.get("NVIDIA_API_KEY_FALLBACK")
GROQ_KEY = os.environ.get("GROQ_API_KEY")
ANYMAIL_KEY = os.environ.get("ANYMAIL_FINDER_KEY")

NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions"

def search_anymail_finder(company_name, full_name=None):
    if not ANYMAIL_KEY:
        return None
        
    print(f"  [Anymail] Falling back to Anymail Finder for {company_name}...")
    headers = {
        "X-Api-Key": ANYMAIL_KEY,
        "Content-Type": "application/json"
    }
    
    clean_name = company_name.split(" ")[-1] if "TEMPORARY" in company_name else company_name
    clean_name = clean_name.replace("(", "").replace(")", "").strip()
    
    try:
        if full_name:
            # Search by exact person
            url = "https://api.anymailfinder.com/v5.0/search/person.json"
            payload = {"full_name": full_name, "company_name": clean_name}
            res = requests.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                if "email" in data:
                    print(f"  [Anymail] Found email for {full_name}: {data['email']}")
                    return data["email"]
        
        # If no specific person, or person search failed, do a general company search
        url = "https://api.anymailfinder.com/v5.0/search/company.json"
        payload = {"company_name": clean_name}
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code == 200:
            data = res.json()
            if "emails" in data and len(data["emails"]) > 0:
                best = data["emails"][0]
                print(f"  [Anymail] Found general employee: {best.get('email')}")
                return best.get("email")
                
        return None
    except Exception as e:
        print(f"  [Anymail] Error: {e}")
        return None

def search_apollo(company_name, city, state):
    print(f"  [Apollo] Searching for decision makers at {company_name} in {city}, {state}...")
    url = "https://api.apollo.io/v1/mixed_people/api_search"
    
    clean_name = company_name.split(" ")[-1] if "TEMPORARY" in company_name else company_name
    clean_name = clean_name.replace("(", "").replace(")", "").strip()
    
    payload = {
        "q_organization_name": clean_name,
        "person_titles": ["CEO", "Founder", "President", "Owner", "Partner", "Chief Executive Officer"],
        "person_seniorities": ["owner", "founder", "c_suite"],
        "page": 1
    }
    
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": APOLLO_KEY
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            anymail_email = search_anymail_finder(company_name)
            if anymail_email:
                return "Decision Maker", anymail_email, "Manager", "", ""
            return None, None, None, None, None
            
        data = response.json()
        people = data.get("people", [])
        if not people:
            anymail_email = search_anymail_finder(company_name)
            if anymail_email:
                return "Decision Maker", anymail_email, "Manager", "", ""
            return None, None, None, None, None
            
        best_match = people[0]
        first_name = best_match.get("first_name", "There")
        last_name = best_match.get("last_name", "")
        email = best_match.get("email")
        title = best_match.get("title", "Decision Maker")
        
        full_name = f"{first_name} {last_name}".strip()
        
        org = best_match.get("organization", {})
        domain = org.get("website_url", "")
        description = org.get("short_description", org.get("seo_description", ""))
        
        # If Apollo didn't find an email, fallback to Anymail
        if not email or email == "email_not_unlocked@apollo.io" or "No Email Found" in email:
            email = search_anymail_finder(company_name, full_name)
            
        if not email:
            # Absolute last resort: try company search
            email = search_anymail_finder(company_name)
            
        if not email:
            return None, None, None, None, None
            
        print(f"  [Enrichment Success] Found: {full_name} ({title}) - {email} - {domain}")
        return full_name, email, title, domain, description
    except Exception as e:
        print(f"  [Apollo] API Error: {e}")
        anymail_email = search_anymail_finder(company_name)
        if anymail_email:
            return "Decision Maker", anymail_email, "Manager", "", ""
        return None, None, None, None, None

def generate_sequences(contact_name, company_name, street, date, violation_type):
    print(f"  [AI] Generating 3 full 4-step sequences for {contact_name}...")
    
    prompt = f"""
    Write 3 distinct cold email sequences to {contact_name}. 
    Context: Their facility at {street} was flagged by the EPA for a Clean Water Act (CWA) violation on {date}. 
    Goal: Offer an intro to an environmental remediation engineer to fix it and stop fines.
    
    You must output exactly 2 Variants (Variant A and Variant B).
    For each variant, provide exactly 4 emails:
    1. Initial Email
    2. Follow-Up 1 (Value add / specific pain point)
    3. Follow-Up 2 (Bump / social proof / urgency)
    4. Follow-Up 3 (Break-up email / closing the file)

    Variant A Rules (Textbook): Extremely blunt, 2 lines per email, no fluff, peer-to-peer.
    Variant B Rules (Conversational): Slightly warmer, acknowledges the headache of compliance. Max 3-4 lines per email.

    Output format: Return ONLY a strict JSON object with this exact structure:
    {{
      "variant_A": {{"initial": "...", "f1": "...", "f2": "...", "f3": "..."}},
      "variant_B": {{"initial": "...", "f1": "...", "f2": "...", "f3": "..."}}
    }}
    Do not include markdown blocks or any other text.
    """
    
    payload = {
        "model": "meta/llama3-70b-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 1500
    }
    
    try:
        response = requests.post(NVIDIA_ENDPOINT, headers={"Authorization": f"Bearer {NVIDIA_KEY}", "Content-Type": "application/json"}, json=payload)
        response.raise_for_status()
        data = response.json()
        if "choices" in data:
            content = data["choices"][0]["message"]["content"].strip()
            if content.startswith("```json"): content = content[7:]
            if content.startswith("```"): content = content[3:]
            if content.endswith("```"): content = content[:-3]
            return json.loads(content.strip())
        else:
            raise Exception("No choices in NVIDIA response.")
    except Exception as e:
        print(f"  [NVIDIA PRIMARY FAILED] {e}. Trying NVIDIA Fallback...")
        try:
            client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=NVIDIA_KEY_FALLBACK)
            completion = client.chat.completions.create(
                model="meta/llama-3.1-70b-instruct",
                messages=[{"role":"user","content":prompt}],
                temperature=0.4, top_p=0.95, max_tokens=1500
            )
            content = completion.choices[0].message.content.strip()
            if content.startswith("```json"): content = content[7:]
            if content.startswith("```"): content = content[3:]
            if content.endswith("```"): content = content[:-3]
            return json.loads(content.strip())
        except Exception as e2:
            print(f"  [NVIDIA FALLBACK FAILED] {e2}. Trying GROQ Fallback...")
            try:
                client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_KEY)
                completion = client.chat.completions.create(
                    model="llama-3.1-70b-versatile",
                    messages=[{"role":"user","content":prompt}],
                    temperature=0.4, max_tokens=1500
                )
                content = completion.choices[0].message.content.strip()
                if content.startswith("```json"): content = content[7:]
                if content.startswith("```"): content = content[3:]
                if content.endswith("```"): content = content[:-3]
                return json.loads(content.strip())
            except Exception as e3:
                print(f"  [GROQ FALLBACK FAILED] {e3}. All AI models exhausted.")
                return {}

def main():
    parser = argparse.ArgumentParser(description="Generate 12-email sequences for raw leads.")
    parser.add_argument("--input", default="/Users/syedchamansha/HQ/Leads/EPA_Violations/lead_list_[Corporate_EPA_CA]_[2026-06-18].csv")
    parser.add_argument("--output", default="/Users/syedchamansha/HQ/Leads/EPA_Violations/lead_list_[Sequenced_Corporate_EPA_CA]_[2026-06-18].csv")
    args = parser.parse_args()
    
    if not APOLLO_KEY or not NVIDIA_KEY:
        print("Error: API Keys missing.")
        return
        
    leads = []
    with open(args.input, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        leads = list(reader)
        
    print(f"Loaded {len(leads)} leads. Starting Sequence Engine...\n")
    
    enriched = []
    for row in leads:
        company = row.get("facility_name", "")
        city = row.get("city", "")
        state = row.get("state", "")
        street = row.get("street", "")
        date = row.get("inspection_date", "recent inspections")
        viol_type = row.get("violation_program", "CWA")
        
        if not company or company == "-" or company == "(UNKNOWN)":
            continue
            
        print(f"Processing: {company}")
        name, email, title, domain, desc = search_apollo(company, city, state)
        if name:
            seq = generate_sequences(name.split()[0], company, street, date, viol_type)
            row["contact_name"] = name
            row["contact_email"] = email
            row["contact_title"] = title
            row["company_domain"] = domain
            row["company_description"] = desc
            
            # Flatten the JSON out into 8 columns
            for var in ["A", "B"]:
                var_key = f"variant_{var}"
                if var_key in seq:
                    row[f"Var{var}_Initial"] = seq[var_key].get("initial", "")
                    row[f"Var{var}_F1"] = seq[var_key].get("f1", "")
                    row[f"Var{var}_F2"] = seq[var_key].get("f2", "")
                    row[f"Var{var}_F3"] = seq[var_key].get("f3", "")
            
            # Write to CSV immediately row-by-row
            file_exists = os.path.exists(args.output)
            with open(args.output, "a", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=list(row.keys()))
                if not file_exists:
                    writer.writeheader()
                writer.writerow(row)
        
        time.sleep(1.6)
        print("-" * 40)
        
    print(f"✅ Saved sequenced leads to {args.output}")

if __name__ == "__main__":
    main()
