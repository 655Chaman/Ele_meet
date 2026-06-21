import requests
import os
import json
from dotenv import load_dotenv

load_dotenv("/Users/syedchamansha/HQ/.env")
anymail_key = os.getenv("ANYMAIL_FINDER_KEY")

def find_email(full_name, domain):
    url = "https://api.anymailfinder.com/v5.1/find-email/person"
    headers = {
        "Authorization": f"Bearer {anymail_key}",
        "Content-Type": "application/json"
    }
    data = {
        "full_name": full_name,
        "domain": domain
    }
    
    print(f"[*] Searching AnymailFinder for: {full_name} @ {domain}")
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            result = response.json()
            email = result.get('email')
            status = result.get('email_status')
            
            if email:
                print(f"[+] Success! Found Verified Email: {email} (Status: {status})")
            else:
                print(f"[-] Could not find a verified email for {full_name}.")
        else:
            print(f"[-] API Error: {response.status_code} - {response.text}")
    except Exception as e:
         print(f"[-] Request failed: {e}")

if __name__ == "__main__":
    find_email("Heath Arnold", "arcb.com")
