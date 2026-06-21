import argparse
import time
import requests
import pandas as pd
import sys
import re
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

def build_scraper(url, output_csv, salvage_csv, limit, state):
    # Parse the provided URL
    parsed = urlparse(url)
    
    # Force echodata.epa.gov and /echo/ path for the API endpoint to bypass HTML redirect issues
    netloc = "echodata.epa.gov"
    path = parsed.path.replace("/rest/services/cwa/", "/echo/")
    
    query_params = dict(parse_qsl(parsed.query))
    
    # We must restrict the query to avoid 'Queryset Limit would be exceeded'
    # We add a state filter to make the search more selective.
    if 'p_st' not in query_params and state:
        query_params['p_st'] = state
    
    # qcolumns will be passed later to get_qid, but we can pass it to get_facilities too.
    # We do not use responseset here, as get_facilities just returns a QID.
    if 'responseset' in query_params:
        del query_params['responseset']
        
    print(f"[*] Step 1: Getting QueryID from get_facilities...")
    
    get_facilities_url = urlunparse((parsed.scheme, netloc, path, parsed.params, urlencode(query_params), parsed.fragment))
    
    print(f"[*] Fetching QID from: {get_facilities_url}")
    try:
        resp = requests.get(get_facilities_url, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        data = resp.json()
        
        # Check for error in response
        if 'Results' in data and 'Error' in data['Results']:
            print(f"[-] API Error: {data['Results']['Error'].get('ErrorMessage')}")
            sys.exit(1)
            
        qid = data.get("Results", {}).get("QueryID")
        if not qid:
            print("[-] Could not find QueryID in response.", data)
            sys.exit(1)
            
        print(f"[+] Obtained QueryID: {qid}")
    except Exception as e:
        print(f"[-] Failed to get QueryID: {e}")
        sys.exit(1)
        
    # Step 2: Paginate through get_qid
    # qcolumns mappings:
    # 1: CWPName
    # 3: CWPStreet
    # 4: CWPCity
    # 5: CWPState
    # 7: CWPZip
    # 11: Statute
    # 102: CWPViolStatus
    # 66: CWPDateLastInspection
    # 23: CWPNAICSCodes
    
    qid_base_url = f"https://{netloc}/echo/cwa_rest_services.get_qid"
    qcolumns = "1,3,4,5,7,11,102,66,23"
    
    page = 1
    responseset = 500
    all_facilities = []
    salvage_facilities = []
    
    print(f"[*] Step 2: Fetching data using get_qid...")
    
    while len(all_facilities) < limit:
        # Be respectful to the API
        time.sleep(1)
        
        params = {
            "output": "JSON",
            "qid": qid,
            "pageno": page,
            "responseset": responseset,
            "qcolumns": qcolumns
        }
        
        try:
            print(f"[*] Fetching page {page}...")
            resp = requests.get(qid_base_url, params=params, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            data = resp.json()
            
            facilities = data.get("Results", {}).get("Facilities", [])
            if not facilities:
                print("[*] No more facilities found.")
                break
                
            # Filter for corporate entities only to avoid street addresses/projects
            corp_pattern = re.compile(r'\b(LLC|INC|CORP|CORPORATION|COMPANY|CO|LTD|LP)\b', re.IGNORECASE)
            valid_facilities = []
            for f in facilities:
                name = str(f.get("CWPName", ""))
                # Must contain a corporate identifier, AND must NOT start with a number
                if corp_pattern.search(name) and not name.strip()[:1].isdigit():
                    valid_facilities.append(f)
                else:
                    salvage_facilities.append(f)
                
            all_facilities.extend(valid_facilities)
            print(f"[+] Fetched {len(valid_facilities)} valid corporate facilities and {len(salvage_facilities)} address leads from page {page} (out of {len(facilities)} raw).")
            print(f"[+] Total corporate so far: {len(all_facilities)} | Total salvage so far: {len(salvage_facilities)}")
            
            if len(facilities) < responseset:
                # Last page
                break
                
            page += 1
            
        except Exception as e:
            print(f"[-] Failed to fetch page {page}: {e}")
            break
            
    # Step 3: Format and save data
    print(f"[*] Step 3: Formatting and saving records to CSV...")
    
    # We only need 'limit' number of records for the main corporate list
    all_facilities = all_facilities[:limit]
    
    def format_facilities(facs):
        mapped = []
        for f in facs:
            mapped.append({
                "facility_name": f.get("CWPName"),
                "street": f.get("CWPStreet"),
                "city": f.get("CWPCity"),
                "state": f.get("CWPState"),
                "zip": f.get("CWPZip"),
                "violation_program": f.get("Statute"),
                "violation_type": f.get("CWPViolStatus"),
                "inspection_date": f.get("CWPDateLastInspection"),
                "naics_code": f.get("CWPNAICSCodes")
            })
        return mapped
        
    df_corp = pd.DataFrame(format_facilities(all_facilities))
    df_salvage = pd.DataFrame(format_facilities(salvage_facilities))
    
    try:
        df_corp.to_csv(output_csv, index=False)
        df_salvage.to_csv(salvage_csv, index=False)
        print(f"[+] Successfully wrote {len(df_corp)} corporate leads to {output_csv}")
        print(f"[+] Successfully wrote {len(df_salvage)} address leads to {salvage_csv}")
    except Exception as e:
        print(f"[-] Failed to write CSVs: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape EPA ECHO violations data.")
    parser.add_argument("--url", default="https://echo.epa.gov/rest/services/cwa/cwa_rest_services.get_facilities?output=JSON&p_vio_status=Y&responseset=500", help="EPA ECHO API URL")
    parser.add_argument("--output", default="/Users/syedchamansha/HQ/Leads/EPA_Violations/lead_list_[Corporate_EPA_CA]_[2026-06-18].csv", help="Output Corporate CSV path")
    parser.add_argument("--salvage", default="/Users/syedchamansha/HQ/Leads/EPA_Violations/lead_list_[Salvage_Addresses_EPA_CA]_[2026-06-18].csv", help="Output Salvage CSV path")
    parser.add_argument("--limit", type=int, default=500, help="Maximum number of corporate records to fetch")
    parser.add_argument("--state", default="CA", help="State to filter by (needed to avoid Queryset Limit error)")
    
    args = parser.parse_args()
    
    build_scraper(args.url, args.output, args.salvage, args.limit, args.state)
