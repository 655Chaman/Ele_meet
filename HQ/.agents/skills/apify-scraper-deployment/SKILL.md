---
name: Apify Scraper Deployment Architect
description: Triggers whenever the user wants to build, configure, or deploy a new Apify Actor or Scraper. Provides exact file structures, schemas, and API deployment sequences.
---

# Apify Deployment Architecture

When tasked with building or deploying an Apify Scraper, you MUST follow these enterprise-grade configurations and deployment sequences to ensure flawless integration with the Apify Platform.

## 1. Directory Structure
An Apify Actor must contain the following core files:
- `src/main.py` (or `main.js`) - The scraper logic
- `requirements.txt` (or `package.json`) - Dependencies
- `.actor/actor.json` - Core metadata and schema linkages
- `.actor/Dockerfile` - Docker configuration
- `.actor/INPUT_SCHEMA.json` - Input UI configuration
- `.actor/output_schema.json` - Output tab UI configuration
- `.actor/dataset_schema.json` - Dataset fields and validation

---

## 2. Schema Configurations

### actor.json
Must always include `"actorSpecification": 1`.
Link schemas explicitly to avoid platform errors.
```json
{
    "actorSpecification": 1,
    "name": "my-scraper",
    "version": "0.1",
    "buildTag": "latest",
    "input": "./INPUT_SCHEMA.json",
    "output": "./output_schema.json",
    "storages": {
        "dataset": "./dataset_schema.json"
    }
}
```

### dataset_schema.json
Use JSON Schema draft-07. Defines the structure of a **SINGLE item**. Must include `views` for the Apify Output tab to render correctly as a table.
```json
{
    "actorSpecification": 1,
    "fields": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
             "field_name": { "type": "string", "title": "Field Title" }
        },
        "required": ["field_name"]
    },
    "views": {
        "overview": {
            "title": "Data Overview",
            "transformation": { "fields": ["field_name"] },
            "display": { "component": "table" }
        }
    }
}
```

### output_schema.json
Links the dataset view to the Output UI. Even if an Actor produces no output, an empty schema MUST be defined to prevent false failure states.
```json
{
    "actorOutputSchemaVersion": 1,
    "title": "Extracted Data",
    "properties": {
        "results": {
            "type": "string",
            "title": "Results",
            "template": "{{links.apiDefaultDatasetUrl}}/items"
        }
    }
}
```

---

## 3. Proxy Implementation
- Never hardcode or manually rotate proxies. Use the SDK's built-in `ProxyConfiguration` class. 
- Default to the `AUTO` proxy group for optimal health and routing.
- If strict anti-bot measures exist (e.g. Cloudflare), utilize **Residential** proxies.
- For `PuppeteerCrawler`/`PlaywrightCrawler`, retiring the browser instance is required to obtain a new proxy IP.
- Secure Credentials: Pass secrets via Apify's Environment Variables, never commit them to the codebase.

---

## 4. Deployment Sequence (Direct REST API Push)

If the standard Apify CLI (`apify push`) fails due to Node/NPM permissions (`EACCES`) or headless environment hang-ups, fallback to a Python-based **Direct API Push** to inject the source files into the Apify cloud.

```python
import requests, os

APIFY_TOKEN = "YOUR_API_TOKEN"
API_URL = f"https://api.apify.com/v2/actors?token={APIFY_TOKEN}"

# Build the payload mapping local files to sourceFiles
payload = {
    "name": "my-scraper",
    "isPublic": False,
    "versions": [
        {
            "versionNumber": "0.1",
            "sourceType": "SOURCE_FILES",
            "buildTag": "latest",
            "sourceFiles": [
                {"name": "src/main.py", "format": "TEXT", "content": "..."},
                {"name": ".actor/actor.json", "format": "TEXT", "content": "..."}
                # Include all required core files listed in Section 1
            ]
        }
    ]
}

# Create Actor
response = requests.post(API_URL, json=payload)
actor_id = response.json().get('data', {}).get('id')

# Update Actor (if it already exists)
# requests.put(f"https://api.apify.com/v2/actors/{actor_id}/versions/0.1?token={APIFY_TOKEN}", json=payload)

# Trigger Build
# Note: Payload must use "versionNumber", not "version"
build_url = f"https://api.apify.com/v2/actors/{actor_id}/builds?token={APIFY_TOKEN}"
requests.post(build_url, json={"versionNumber": "0.1"})
```
