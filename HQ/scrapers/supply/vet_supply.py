import os
import csv
import json
import time
import argparse
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv("/Users/syedchamansha/HQ/.env")

NVIDIA_KEY = os.environ.get("NVIDIA_API_KEY")
NVIDIA_KEY_FALLBACK = os.environ.get("NVIDIA_API_KEY_FALLBACK")
GROQ_KEY = os.environ.get("GROQ_API_KEY")

NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions"

def scrape_website_text(url):
    print(f"  [Crawler] Deep-diving into {url}...")
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "lxml")
        
        # Remove script, style, header, footer
        for script in soup(["script", "style", "header", "footer", "nav"]):
            script.extract()
            
        text = soup.get_text(separator=' ', strip=True)
        # Return first 3500 chars to avoid token limits
        return text[:3500]
    except Exception as e:
        print(f"  [Crawler] Failed to scrape {url}: {e}")
        return None

def vet_company(company_name, website_text):
    print(f"  [AI] Vetting {company_name}...")
    
    prompt = f"""
    You are an expert environmental compliance auditor. 
    Review the following extracted website text from an engineering firm: "{company_name}".
    
    Website Text:
    {website_text}
    
    Answer these 3 strict questions:
    1. Do they explicitly mention EPA compliance, Clean Water Act (CWA), or stormwater remediation?
    2. Do they cater to industrial or commercial facilities (not just residential homes)?
    3. Do they appear to be a legitimate, established firm?
    
    If all 3 are YES, approve them. If ANY are NO, reject them.
    
    Output format: Return ONLY a strict JSON object with this exact structure:
    {{
      "is_approved": true/false,
      "reason": "Brief 1-sentence explanation of why they passed or failed."
    }}
    Do not include markdown code blocks or any other text.
    """
    
    payload = {
        "model": "meta/llama3-70b-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 150
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
                temperature=0.1, top_p=0.95, max_tokens=150
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
                    temperature=0.1, max_tokens=150
                )
                content = completion.choices[0].message.content.strip()
                if content.startswith("```json"): content = content[7:]
                if content.startswith("```"): content = content[3:]
                if content.endswith("```"): content = content[:-3]
                return json.loads(content.strip())
            except Exception as e3:
                print(f"  [GROQ FALLBACK FAILED] {e3}. All AI models exhausted.")
                return {"is_approved": False, "reason": "API Failure"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="/Users/syedchamansha/HQ/scrapers/supply/raw_supply.csv")
    parser.add_argument("--output", default="/Users/syedchamansha/HQ/scrapers/supply/vetted_supply.csv")
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Input file not found: {args.input}")
        return
        
    with open(args.input, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        supply_list = list(reader)
        
    print(f"Loaded {len(supply_list)} potential supply partners. Starting Vetting Engine...\n")
    
    vetted_firms = []
    
    for row in supply_list:
        company = row.get("company_name", "")
        url = row.get("website", "")
        if not company or not url:
            continue
            
        print(f"Processing: {company}")
        text = scrape_website_text(url)
        
        if text:
            result = vet_company(company, text)
            print(f"  [Result] Approved: {result.get('is_approved')} - {result.get('reason')}")
            
            if result.get("is_approved") is True:
                row["vetting_reason"] = result.get("reason", "")
                vetted_firms.append(row)
        else:
            print(f"  [Result] Rejected: Failed to load website content.")
            
        time.sleep(1.6)
        print("-" * 40)
        
    if not vetted_firms:
        print("No firms passed the vetting process.")
        return
        
    fieldnames = list(vetted_firms[0].keys())
    with open(args.output, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(vetted_firms)
        
    print(f"✅ Successfully vetted {len(vetted_firms)} partners and saved to {args.output}")

if __name__ == "__main__":
    main()
