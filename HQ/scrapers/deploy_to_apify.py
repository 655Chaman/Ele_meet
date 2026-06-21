import requests
import json
import os

APIFY_TOKEN = "YOUR_APIFY_TOKEN"
API_URL = f"https://api.apify.com/v2/actors?token={APIFY_TOKEN}"

# Read the local files
base_dir = "/Users/syedchamansha/HQ/scrapers/universal-epa-scraper"

def read_file(path):
    with open(os.path.join(base_dir, path), "r") as f:
        return f.read()

payload = {
    "name": "universal-epa-scraper",
    "title": "Universal Global Environmental Scraper",
    "description": "Unified cloud actor for scraping EPA and environmental violations globally.",
    "isPublic": False,
    "defaultRunOptions": {
        "build": "latest",
        "timeoutSecs": 3600,
        "memoryMbytes": 2048
    },
    "versions": [
        {
            "versionNumber": "0.1",
            "sourceType": "SOURCE_FILES",
            "buildTag": "latest",
            "sourceFiles": [
                {
                    "name": "src/main.py",
                    "format": "TEXT",
                    "content": read_file("src/main.py")
                },
                {
                    "name": "requirements.txt",
                    "format": "TEXT",
                    "content": read_file("requirements.txt")
                },
                {
                    "name": ".actor/actor.json",
                    "format": "TEXT",
                    "content": read_file(".actor/actor.json")
                },
                {
                    "name": ".actor/INPUT_SCHEMA.json",
                    "format": "TEXT",
                    "content": read_file(".actor/INPUT_SCHEMA.json")
                },
                {
                    "name": ".actor/Dockerfile",
                    "format": "TEXT",
                    "content": read_file(".actor/Dockerfile")
                }
            ]
        }
    ]
}

print("Deploying Universal EPA Scraper to Apify via REST API...")
response = requests.post(API_URL, json=payload, headers={"Content-Type": "application/json"})

if response.status_code in [200, 201]:
    data = response.json().get('data', {})
    actor_id = data.get('id')
    print(f"✅ Success! Actor deployed successfully.")
    print(f"Actor ID: {actor_id}")
    
    # Trigger a build
    build_url = f"https://api.apify.com/v2/actors/{actor_id}/builds?token={APIFY_TOKEN}"
    build_resp = requests.post(build_url, json={"versionNumber": "0.1"})
    if build_resp.status_code in [200, 201]:
        print("✅ Build triggered successfully. The actor is now compiling in the cloud!")
    else:
        print(f"⚠️ Build trigger failed: {build_resp.text}")
else:
    print(f"❌ Failed to deploy. Status Code: {response.status_code}")
    print(response.text)
