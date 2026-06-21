import os
import sys
import subprocess
import csv
from apify import Actor
import asyncio

async def main():
    async with Actor:
        actor_input = await Actor.get_input() or {}
        limit = actor_input.get('limit', 100)
        
        print(f"Running scraper with limit {limit}")
        result = subprocess.run([sys.executable, "-m", "scraper", "--limit", str(limit)])
        if result.returncode != 0:
            print("Scraper failed")
            return
            
        csv_path = "leads.csv"
        # The hipaa scraper might write to an absolute path. We should try looking there.
        abs_csv_path = f"/Users/syedchamansha/HQ/scrapers/{os.path.basename(os.getcwd())}/leads.csv"
        
        if os.path.exists(csv_path):
            target = csv_path
        elif os.path.exists(abs_csv_path):
            target = abs_csv_path
        else:
            print("No output CSV found")
            return
            
        leads = []
        with open(target, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                leads.append(row)
                
        if leads:
            print(f"Pushing {len(leads)} leads to Apify dataset")
            await Actor.push_data(leads)
        else:
            print("No leads to push")

if __name__ == '__main__':
    asyncio.run(main())
