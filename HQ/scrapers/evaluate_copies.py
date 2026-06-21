import os
from dotenv import load_dotenv
import sys
# add the directory to path
sys.path.append("/Users/syedchamansha/HQ/scrapers")
from sequence_engine import generate_sequences
import json

load_dotenv("/Users/syedchamansha/HQ/.env")

# Generate sequence for Gary at Temporary Batch Plant
result = generate_sequences("Gary", "Temporary Batch Plant", "E HWY 180 Centerville", "09/03/2023", "CWA")

print(json.dumps(result, indent=2))
