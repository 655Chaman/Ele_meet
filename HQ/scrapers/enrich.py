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

NVIDIA_ENDPOINT = "https://api.nvidia.com/v1/chat/completions"

def search_apollo(company_name, city, state):
    print(f"  [Apollo] Searching for decision makers at {company_name} in {city}, {state}...")
    url = "https://api.apollo.io/v1/mixed_people/api_search"
    
    # Clean company name (remove weird EPA prefixes like "0221 " or "(OLD )")
    clean_name = company_name.split(" ")[-1] if "TEMPORARY" in company_name else company_name
    clean_name = clean_name.replace("(", "").replace(")", "").strip()
    
    payload = {
        "q_organization_name": clean_name,
        "person_titles": ["Manager", "Director", "Operations", "EHS", "CEO", "Owner", "President", "Safety"],
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
            print(f"  [Apollo] HTTP {response.status_code}: {response.text}")
            return None, None, None
            
        data = response.json()
        
        people = data.get("people", [])
        if not people:
            return None, None, None
            
        # Take the first best match
        best_match = people[0]
        first_name = best_match.get("first_name", "There")
        last_name = best_match.get("last_name", "")
        email = best_match.get("email", "No Email Found")
        title = best_match.get("title", "Decision Maker")
        
        print(f"  [Apollo] Found: {first_name} {last_name} ({title}) - {email}")
        return f"{first_name} {last_name}", email, title
    except Exception as e:
        print(f"  [Apollo] API Error: {e}")
        return None, None, None

def generate_email(contact_name, company_name, street, date, violation_type):
    print(f"  [NVIDIA] Generating hyper-personalized copy for {contact_name}...")
    
    prompt = f"""
    Write 3 distinct variants of a cold email to {contact_name}. 
    All variants must mention their facility at {street} and the Clean Water Act (CWA) inspection flagged on {date}.
    All variants must offer an intro to an environmental remediation engineer.
    
    Variant 1 (Textbook): Exactly 2 sentences. Extremely direct, no fluff. Blunt, peer-to-peer.
    Variant 2 (Textbook + Conversational): Follow the textbook rules but add a slight conversational touch. Max 3 sentences.
    Variant 3 (AI Intelligence): Break the rules if needed. Write the most highly optimized, psychological cold email you can think of to get a response.
    
    Output format: Return ONLY a JSON object with keys "variant_1", "variant_2", "variant_3". Do not include markdown or other text.
    """
    
    headers = {
        "Authorization": f"Bearer {NVIDIA_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "meta/llama3-70b-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 400
    }
    
    try:
        response = requests.post(NVIDIA_ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        if "choices" in data:
            content = data["choices"][0]["message"]["content"].strip()
            # Clean up potential markdown formatting around JSON
            if content.startswith("```json"): content = content[7:]
            if content.startswith("```"): content = content[3:]
            if content.endswith("```"): content = content[:-3]
            return json.loads(content.strip())
        else:
            raise Exception(f"No choices in NVIDIA response: {data}")
    except Exception as e:
        print(f"  [NVIDIA PRIMARY FAILED] {e}. Trying NVIDIA Fallback...")
        try:
            client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=NVIDIA_KEY_FALLBACK
            )
            completion = client.chat.completions.create(
                model="nvidia/nemotron-3-ultra-550b-a55b",
                messages=[{"role":"user","content":prompt}],
                temperature=0.4,
                top_p=0.95,
                max_tokens=400,
                extra_body={"chat_template_kwargs":{"enable_thinking":True},"reasoning_budget":400}
            )
            content = completion.choices[0].message.content.strip()
            if content.startswith("```json"): content = content[7:]
            if content.startswith("```"): content = content[3:]
            if content.endswith("```"): content = content[:-3]
            return json.loads(content.strip())
        except Exception as e2:
            print(f"  [NVIDIA FALLBACK FAILED] {e2}. Trying GROQ Fallback...")
            try:
                client = OpenAI(
                    base_url="https://api.groq.com/openai/v1",
                    api_key=GROQ_KEY
                )
                completion = client.chat.completions.create(
                    model="llama3-70b-8192",
                    messages=[{"role":"user","content":prompt}],
                    temperature=0.4,
                    max_tokens=400
                )
                content = completion.choices[0].message.content.strip()
                if content.startswith("```json"): content = content[7:]
                if content.startswith("```"): content = content[3:]
                if content.endswith("```"): content = content[:-3]
                return json.loads(content.strip())
            except Exception as e3:
                print(f"  [GROQ FALLBACK FAILED] {e3}. All AI models exhausted.")
                return {"variant_1": "Error", "variant_2": "Error", "variant_3": "Error"}

def main():
    parser = argparse.ArgumentParser(description="Enrich raw EPA leads using Apollo and Nvidia AI.")
    parser.add_argument("--input", default="/Users/syedchamansha/HQ/scrapers/epa_violations/leads.csv")
    parser.add_argument("--output", default="/Users/syedchamansha/HQ/scrapers/epa_violations/enriched_leads.csv")
    args = parser.parse_args()
    
    if not APOLLO_KEY or not NVIDIA_KEY:
        print("Error: APOLLO_KEY_1 or NVIDIA_API_KEY not found in /Users/syedchamansha/HQ/.env")
        return
        
    leads = []
    with open(args.input, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        leads = list(reader)
        
    print(f"Loaded {len(leads)} raw leads. Starting enrichment engine...\n")
    
    enriched = []
    for row in leads:
        company = row.get("facility_name", "")
        city = row.get("city", "")
        state = row.get("state", "")
        street = row.get("street", "")
        date = row.get("inspection_date", "recent inspections")
        viol_type = row.get("violation_program", "CWA")
        
        # Skip garbage rows
        if not company or company == "-" or company == "(UNKNOWN)":
            continue
            
        print(f"Processing: {company}")
        
        name, email, title = search_apollo(company, city, state)
        if name:
            email_copies = generate_email(name.split()[0], company, street, date, viol_type)
            
            row["contact_name"] = name
            row["contact_email"] = email
            row["contact_title"] = title
            row["email_variant_1"] = email_copies.get("variant_1", "")
            row["email_variant_2"] = email_copies.get("variant_2", "")
            row["email_variant_3"] = email_copies.get("variant_3", "")
            # Remove the old field if it exists
            if "generated_email_copy" in row:
                del row["generated_email_copy"]
            enriched.append(row)
        
        # NVIDIA API Limit: 40 requests/min. Sleep 1.6s to stay strictly under the limit.
        time.sleep(1.6)
        print("-" * 40)
        
    if not enriched:
        print("No leads were successfully enriched.")
        return
        
    # Write enriched CSV
    fieldnames = list(enriched[0].keys())
    with open(args.output, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched)
        
    print(f"✅ Successfully enriched {len(enriched)} leads and saved to {args.output}")

if __name__ == "__main__":
    main()
