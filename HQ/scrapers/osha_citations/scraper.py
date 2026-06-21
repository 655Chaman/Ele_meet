import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import re
import pandas as pd
import time
import argparse
import sys
import datetime
import os

def parse_date(pubDate):
    """Parse RSS pubDate into YYYY-MM-DD"""
    try:
        dt = datetime.datetime.strptime(pubDate, '%a, %d %b %Y %H:%M:%S %z')
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return pubDate

def get_urgency_score(penalty, text):
    """Calculate urgency score based on penalty amount and fatality keywords."""
    text_lower = text.lower()
    has_fatality = any(w in text_lower for w in ['fatality', 'fatal', 'killed', 'died'])
    
    if has_fatality or penalty > 100000:
        return 5
    elif penalty >= 50000:
        return 4
    elif penalty >= 10000:
        return 3
    elif penalty >= 1000:
        return 2
    else:
        return 1

def scrape_osha_news(limit=10):
    url = 'https://www.osha.gov/news/newsreleases.xml'
    print(f"Fetching RSS feed from {url}...")
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching RSS: {e}")
        return []

    try:
        root = ET.fromstring(r.text)
    except Exception as e:
        print(f"Error parsing RSS XML: {e}")
        return []

    items = root.findall('.//item')
    print(f"Found {len(items)} items in RSS. Processing up to {limit}...")
    
    records = []
    
    for idx, item in enumerate(items[:limit]):
        link_elem = item.find('link')
        if link_elem is None:
            continue
        link = link_elem.text
        
        pubDate_elem = item.find('pubDate')
        citation_date = parse_date(pubDate_elem.text) if pubDate_elem is not None else 'Unknown'
        
        print(f"[{idx+1}/{min(limit, len(items))}] Fetching {link} ...")
        try:
            resp = requests.get(link, timeout=15)
            resp.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching article {link}: {e}")
            time.sleep(1)
            continue
            
        soup = BeautifulSoup(resp.text, 'html.parser')
        article = soup.find('article')
        if article:
            text = article.get_text(separator=' ', strip=True)
            paragraphs = [p.get_text(strip=True) for p in article.find_all('p')]
        else:
            text = soup.get_text(separator=' ', strip=True)
            paragraphs = [p.get_text(strip=True) for p in soup.find_all('p')]
            
        # 1. Penalty amount
        penalties = re.findall(r'\$[0-9,]+', text)
        penalty_amount = 0
        if penalties:
            try:
                penalty_amount = max([int(p.replace('$', '').replace(',', '')) for p in penalties])
            except ValueError:
                pass
                
        # 2. Company name
        company_name = 'Unknown'
        # Often starts with "cited [Company Name] for" or "Department of Labor has cited [Company Name]"
        m_company = re.search(r'cited (.*?) for', text)
        if m_company:
            comp = m_company.group(1).strip()
            # Basic length constraint to avoid grabbing whole paragraphs
            if len(comp) < 100:
                company_name = comp
                
        # 3. Violation type
        violation_type = 'Unknown'
        m_violation = re.search(r'for (.*?)(?:violations|hazards)', text, re.IGNORECASE)
        if m_violation:
            viol = m_violation.group(1).strip()
            if len(viol) < 150:
                violation_type = viol
                
        # 4. Location (city, state)
        city = 'Unknown'
        state = 'Unknown'
        
        # We look at individual paragraphs to find the dateline (e.g. "ATLANTA – The")
        for p in paragraphs:
            m_loc = re.match(r'^([A-Z\s.-]+)(?:,|)\s*([A-Z]{2}|[A-Za-z]+)?\s*[–—-]\s*(?:The\s|U\.S\.)', p)
            if m_loc:
                city_str = m_loc.group(1).strip()
                state_str = m_loc.group(2)
                if state_str:
                    state = state_str.strip()
                city = city_str
                break
                
        # 5. Urgency Score
        urgency_score = get_urgency_score(penalty_amount, text)
        
        records.append({
            'company_name': company_name,
            'city': city,
            'state': state,
            'violation_type': violation_type,
            'penalty_amount': penalty_amount,
            'citation_date': citation_date,
            'urgency_score': urgency_score
        })
        
        # Be respectful to the server
        time.sleep(1)
        
    return records

def main():
    parser = argparse.ArgumentParser(description="Scrape OSHA citations from news releases.")
    parser.add_argument('--limit', type=int, default=10, help='Number of records to fetch')
    parser.add_argument('--output', type=str, default='/Users/syedchamansha/HQ/scrapers/osha_citations/leads.csv', help='Output CSV path')
    args = parser.parse_args()
    
    print("Starting OSHA scraper...")
    records = scrape_osha_news(limit=args.limit)
    
    if not records:
        print("No records fetched.")
        sys.exit(1)
        
    df = pd.DataFrame(records)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    
    try:
        df.to_csv(args.output, index=False)
        print(f"\nSuccessfully saved {len(df)} records to {args.output}")
        print("\nSample data:")
        print(df.head(3).to_string())
    except Exception as e:
        print(f"Error saving to CSV: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
