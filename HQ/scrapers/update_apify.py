import requests
import json
import os

APIFY_TOKEN = "YOUR_APIFY_TOKEN"
ACTOR_ID = "dGbbcXS5MD1eJIhEp"
API_URL = f"https://api.apify.com/v2/actors/{ACTOR_ID}/versions/0.1?token={APIFY_TOKEN}"

base_dir = "/Users/syedchamansha/HQ/scrapers/universal-epa-scraper"

def read_file(path):
    with open(os.path.join(base_dir, path), "r") as f:
        return f.read()

payload = {
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
            "name": ".actor/output_schema.json",
            "format": "TEXT",
            "content": read_file(".actor/output_schema.json")
        },
        {
            "name": ".actor/dataset_schema.json",
            "format": "TEXT",
            "content": read_file(".actor/dataset_schema.json")
        },
        {
            "name": ".actor/README.md",
            "format": "TEXT",
            "content": read_file(".actor/README.md")
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

print("Updating Apify Actor version via REST API...")
response = requests.put(API_URL, json=payload, headers={"Content-Type": "application/json"})

if response.status_code in [200, 201]:
    print(f"✅ Success! Actor version updated successfully.")
    
    # Trigger a build
    build_url = f"https://api.apify.com/v2/actors/{ACTOR_ID}/builds?token={APIFY_TOKEN}"
    build_resp = requests.post(build_url, json={"versionNumber": "0.1"})
    if build_resp.status_code in [200, 201]:
        print("✅ Build triggered successfully. The actor is now compiling in the cloud!")
    else:
        print(f"⚠️ Build trigger failed: {build_resp.text}")
else:
    print(f"❌ Failed to update. Status Code: {response.status_code}")
    print(response.text)
