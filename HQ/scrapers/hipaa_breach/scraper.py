import os
import requests
import csv
import re
import argparse
from bs4 import BeautifulSoup
from io import StringIO
import pandas as pd
import time

def scrape_hhs_breach_portal(output_csv, limit=None):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    session = requests.Session()

    print("Step 1: Navigating to the HHS Breach Portal front page...")
    r1 = session.get("https://ocrportal.hhs.gov/ocr/breach/breach_frontpage.jsf", headers=headers, timeout=30)
    r1.raise_for_status()
    time.sleep(1)
    
    soup1 = BeautifulSoup(r1.text, 'html.parser')
    view_state_node = soup1.find("input", {"name": "javax.faces.ViewState"})
    if not view_state_node:
        raise ValueError("Could not find ViewState on the front page.")
    view_state = view_state_node.get("value")

    link = soup1.find("a", string="View HIPAA Breach Reports")
    if not link:
        raise ValueError("Could not find 'View HIPAA Breach Reports' link.")
    
    match = re.search(r"\{'([^']+)':'[^']+'\}", link.get("onclick", ""))
    post_id = match.group(1) if match else 'ocrForm:j_idt39'

    print("Step 2: Accessing the Under Investigation reports...")
    data = {
        'ocrForm': 'ocrForm',
        post_id: post_id,
        'javax.faces.ViewState': view_state
    }
    r2 = session.post("https://ocrportal.hhs.gov/ocr/breach/breach_frontpage.jsf", data=data, headers=headers, timeout=30)
    r2.raise_for_status()
    time.sleep(1)

    soup2 = BeautifulSoup(r2.text, 'html.parser')
    view_state2_node = soup2.find("input", {"name": "javax.faces.ViewState"})
    view_state2 = view_state2_node.get("value") if view_state2_node else view_state

    print("Step 3: Finding the CSV export link...")
    csv_post_id = None
    for a in soup2.find_all('a'):
        img = a.find('img')
        if img and 'csv.png' in img.get('src', ''):
            onclick = a.get("onclick", "")
            match = re.search(r"\{'([^']+)':'[^']+'\}", onclick)
            if match:
                csv_post_id = match.group(1)
                break
    
    if not csv_post_id:
        raise ValueError("Could not find the CSV export button.")

    print("Step 4: Downloading CSV data...")
    data_csv = {
        'ocrForm': 'ocrForm',
        csv_post_id: csv_post_id,
        'javax.faces.ViewState': view_state2
    }
    r3 = session.post("https://ocrportal.hhs.gov/ocr/breach/breach_report_hip.jsf", data=data_csv, headers=headers, timeout=30)
    r3.raise_for_status()

    # Parse CSV data
    print("Step 5: Parsing and processing data...")
    csv_text = r3.text
    reader = csv.reader(StringIO(csv_text))
    rows = list(reader)
    
    if not rows or len(rows) < 2:
        raise ValueError("Exported CSV has no data rows.")

    # Skip header
    data_rows = rows[1:]
    
    # Target columns:
    # 0 -> covered_entity_name
    # 1 -> state
    # 2 -> covered_entity_type
    # 3 -> individuals_affected
    # 4 -> breach_submission_date
    # 5 -> breach_type
    # 6 -> location_of_breached_info
    # 7 -> business_associate_present

    processed_data = []
    for row in data_rows:
        if len(row) < 8:
            continue
            
        try:
            affected_str = row[3].replace(',', '').strip()
            affected = int(affected_str) if affected_str.isdigit() else 0
        except ValueError:
            affected = 0
            
        if affected < 500:
            continue
            
        if affected > 10000:
            priority = 'HIGH'
        elif affected > 1000:
            priority = 'MEDIUM'
        else:
            priority = 'LOW'
            
        record = {
            'covered_entity_name': row[0].strip(),
            'state': row[1].strip(),
            'covered_entity_type': row[2].strip(),
            'breach_type': row[5].strip(),
            'location_of_breached_info': row[6].strip(),
            'individuals_affected': affected,
            'breach_submission_date': row[4].strip(),
            'business_associate_present': row[7].strip(),
            'outreach_priority': priority
        }
        processed_data.append(record)

    # Convert to DataFrame to handle sorting and output easily
    df = pd.DataFrame(processed_data)
    
    # Sort descending
    if not df.empty:
        df = df.sort_values(by='individuals_affected', ascending=False)
        
    if limit is not None and limit > 0:
        df = df.head(limit)
        
    print(f"Writing {len(df)} leads to {output_csv}...")
    
    # Write to CSV
    df.to_csv(output_csv, index=False, columns=[
        'covered_entity_name', 'state', 'covered_entity_type', 'breach_type', 
        'location_of_breached_info', 'individuals_affected', 'breach_submission_date', 
        'business_associate_present', 'outreach_priority'
    ])
    print("Done!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HHS HIPAA Breach Portal Scraper")
    parser.add_argument('--limit', type=int, default=None, help="Maximum number of records to fetch")
    args = parser.parse_args()
    
    output_path = "/Users/syedchamansha/HQ/scrapers/hipaa_breach/leads.csv"
    try:
        scrape_hhs_breach_portal(output_path, limit=args.limit)
    except Exception as e:
        print("An error occurred during scraping:")
        print(str(e))
