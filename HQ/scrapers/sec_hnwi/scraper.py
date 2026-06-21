import argparse
import requests
import xml.etree.ElementTree as ET
import pandas as pd
import time
import re
import sys

def parse_args():
    parser = argparse.ArgumentParser(description="Scrape SEC EDGAR for Insider Sales")
    parser.add_argument("--limit", type=int, default=100, help="Number of recent filings to check")
    return parser.parse_args()

def get_urgency_score(value):
    if value > 10_000_000:
        return 5
    elif value > 1_000_000:
        return 4
    elif value > 100_000:
        return 3
    elif value > 10_000:
        return 2
    else:
        return 1

def main():
    args = parse_args()
    limit = args.limit
    if limit > 100:
        print("Max limit for single atom feed is 100. Setting limit to 100.")
        limit = 100

    url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&owner=include&count={limit}&output=atom"
    headers = {"User-Agent": "HQ-Research admin@hq.com"}

    print(f"Fetching SEC Atom feed: {url}")
    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
    except Exception as e:
        print(f"Failed to fetch feed: {e}")
        sys.exit(1)

    root = ET.fromstring(res.text)
    
    # Extract links to filings
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', ns)
    
    print(f"Found {len(entries)} filings. Processing...")
    
    sales_data = []
    processed_urls = set()

    for idx, entry in enumerate(entries):
        link_elem = entry.find('atom:link', ns)
        if link_elem is None:
            continue
        href = link_elem.attrib.get('href', '')
        if not href.endswith('-index.htm'):
            continue
            
        txt_url = href.replace('-index.htm', '.txt')
            
        
        
        acc_no = txt_url.split('/')[-1].replace('.txt', '')
        if acc_no in processed_urls:
            continue
        processed_urls.add(acc_no)


        
        # Add SEC domain if it's a relative link
            
        print(f"[{idx+1}/{len(entries)}] Fetching {txt_url}")
        
        try:
            txt_res = requests.get(txt_url, headers=headers)
            txt_res.raise_for_status()
        except Exception as e:
            print(f"Failed to fetch {txt_url}: {e}")
            time.sleep(0.5)
            continue
            
        txt_content = txt_res.text
        
        # Extract filing date from header
        filing_date_match = re.search(r'FILED AS OF DATE:\s+(\d{8})', txt_content)
        filing_date = ""
        if filing_date_match:
            fd = filing_date_match.group(1)
            filing_date = f"{fd[:4]}-{fd[4:6]}-{fd[6:]}"
            
        # Find XML
        xml_start = txt_content.find("<XML>")
        xml_end = txt_content.find("</XML>")
        if xml_start == -1 or xml_end == -1:
            time.sleep(0.5)
            continue
            
        xml_string = txt_content[xml_start+5:xml_end].strip()
        if not xml_string:
            time.sleep(0.5)
            continue
            
        try:
            form_xml = ET.fromstring(xml_string)
        except ET.ParseError:
            time.sleep(0.5)
            continue
            
        # Parse XML for relevant fields
        issuer = form_xml.find('.//issuer')
        company_name = issuer.findtext('issuerName') if issuer is not None else ""
        ticker = issuer.findtext('issuerTradingSymbol') if issuer is not None else ""
        
        owner = form_xml.find('.//reportingOwner')
        insider_name = ""
        insider_title = ""
        if owner is not None:
            insider_name = owner.findtext('.//rptOwnerName') or ""
            
            # Construct title
            titles = []
            if owner.findtext('.//officerTitle'):
                titles.append(owner.findtext('.//officerTitle'))
            if owner.findtext('.//isDirector') in ('true', '1'):
                titles.append('Director')
            if owner.findtext('.//isTenPercentOwner') in ('true', '1'):
                titles.append('10% Owner')
            if owner.findtext('.//isOther') in ('true', '1') and not titles:
                titles.append(owner.findtext('.//otherText') or 'Other')
            
            insider_title = " / ".join(titles)

        # Find sales
        for trans in form_xml.findall('.//nonDerivativeTransaction'):
            trans_code_elem = trans.find('.//transactionCode')
            if trans_code_elem is not None and trans_code_elem.text == 'S':
                try:
                    shares_str = trans.findtext('.//transactionShares/value')
                    price_str = trans.findtext('.//transactionPricePerShare/value')
                    
                    if not shares_str or not price_str:
                        continue
                        
                    shares = float(shares_str)
                    price = float(price_str)
                    total_value = shares * price
                    
                    if total_value > 0:
                        sales_data.append({
                            'insider_name': insider_name,
                            'insider_title': insider_title,
                            'company_name': company_name,
                            'ticker': ticker,
                            'shares_amount': shares,
                            'price_per_share': price,
                            'total_value_usd': total_value,
                            'filing_date': filing_date,
                            'urgency_score': get_urgency_score(total_value)
                        })
                except ValueError:
                    continue
                    
        # Sleep to be respectful to SEC EDGAR (max 10 requests per second allowed, we do 1-2 per sec)
        time.sleep(0.5)

    if sales_data:
        df = pd.DataFrame(sales_data)
        df = df.drop_duplicates()
        df = df.sort_values(by='total_value_usd', ascending=False)
        output_path = "/Users/syedchamansha/HQ/scrapers/sec_hnwi/leads.csv"
        df.to_csv(output_path, index=False)
        print(f"Successfully wrote {len(df)} sales records to {output_path}")
        print("Sample data:")
        print(df.head(5))
    else:
        print("No sales transactions found in the recent filings.")

if __name__ == "__main__":
    main()
