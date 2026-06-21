import pandas as pd
import logging
from scrapers.scraper_utils import fetch_html, clean_text

logger = logging.getLogger(__name__)

MAINE_AG_URL = "https://apps.web.maine.gov/online/aeviewer/ME/40/list.shtml"

def scrape_maine_ag():
    """
    Scrapes the Maine Attorney General's Data Breach Notification portal.
    Maine requires reporting of all breaches affecting Maine residents,
    making it one of the most comprehensive public databases nationally.
    """
    logger.info("Starting Maine AG data breach scrape...")
    soup = fetch_html(MAINE_AG_URL)
    
    if not soup:
        logger.error("Failed to retrieve Maine AG page.")
        return []

    # Find the main data table
    tables = soup.find_all("table")
    if not tables:
        logger.warning("No tables found on Maine AG page.")
        return []
        
    # The breach data is typically in the first substantial table
    data_table = None
    for table in tables:
        if len(table.find_all("tr")) > 5:
            data_table = table
            break
            
    if not data_table:
        logger.warning("Could not identify the main data table.")
        return []

    breaches = []
    rows = data_table.find_all("tr")
    
    # Typically headers: [Title/Company, Data Breach Date, Submitted Date, Details...]
    # We will skip the header row (index 0)
    for row in rows[1:]:
        cols = row.find_all("td")
        if len(cols) < 3:
            continue
            
        company_name = clean_text(cols[0].text)
        breach_date = clean_text(cols[1].text)
        submitted_date = clean_text(cols[2].text)
        
        # Link to the actual PDF letter or detailed view
        link_tag = cols[0].find("a")
        details_link = f"https://apps.web.maine.gov{link_tag['href']}" if link_tag and 'href' in link_tag.attrs else None
        
        breach = {
            "source": "Maine AG",
            "company_name": company_name,
            "breach_date": breach_date,
            "submitted_date": submitted_date,
            "details_link": details_link,
            "impacted_count": "Unknown", # Often requires clicking into the detail page to extract
            "breach_type": "Data Breach"
        }
        breaches.append(breach)
        
    logger.info(f"Successfully scraped {len(breaches)} records from Maine AG.")
    return breaches

if __name__ == "__main__":
    results = scrape_maine_ag()
    df = pd.DataFrame(results)
    if not df.empty:
        print(df.head())
