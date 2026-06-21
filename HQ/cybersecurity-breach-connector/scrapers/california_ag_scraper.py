import pandas as pd
import logging
from scrapers.scraper_utils import fetch_html, clean_text

logger = logging.getLogger(__name__)

CALIFORNIA_AG_URL = "https://oag.ca.gov/privacy/databreach/list"

def scrape_california_ag():
    """
    Scrapes the California Attorney General's Data Breach Notification list.
    """
    logger.info("Starting California AG data breach scrape...")
    soup = fetch_html(CALIFORNIA_AG_URL)
    
    if not soup:
        logger.error("Failed to retrieve California AG page.")
        return []

    # CA OAG typically puts these in a view-content div
    view_content = soup.find("div", class_="view-content")
    if not view_content:
        logger.warning("Could not find view-content on CA AG page. The page structure might have changed.")
        return []

    breaches = []
    # Usually listed as table rows or dl/dt/dd structures. Assuming standard table for the MVP parser.
    tables = view_content.find_all("table")
    if tables:
        rows = tables[0].find_all("tr")
        for row in rows[1:]:
            cols = row.find_all("td")
            if len(cols) < 2:
                continue
                
            company_name = clean_text(cols[0].text)
            submitted_date = clean_text(cols[1].text) if len(cols) > 1 else "Unknown"
            
            link_tag = cols[0].find("a")
            details_link = f"https://oag.ca.gov{link_tag['href']}" if link_tag and 'href' in link_tag.attrs else None
            
            breach = {
                "source": "California OAG",
                "company_name": company_name,
                "breach_date": "Unknown", # CA often requires clicking through to find the actual breach date
                "submitted_date": submitted_date,
                "details_link": details_link,
                "impacted_count": "Unknown",
                "breach_type": "Data Breach"
            }
            breaches.append(breach)
    else:
        # Fallback if it's a list format
        items = view_content.find_all("div", class_="views-row")
        for item in items:
            title_tag = item.find("span", class_="field-content")
            if title_tag:
                company_name = clean_text(title_tag.text)
                
                link_tag = title_tag.find("a")
                details_link = f"https://oag.ca.gov{link_tag['href']}" if link_tag and 'href' in link_tag.attrs else None
                
                breach = {
                    "source": "California OAG",
                    "company_name": company_name,
                    "breach_date": "Unknown",
                    "submitted_date": "Recent",
                    "details_link": details_link,
                    "impacted_count": "Unknown",
                    "breach_type": "Data Breach"
                }
                breaches.append(breach)
            
    logger.info(f"Successfully scraped {len(breaches)} records from California OAG.")
    return breaches

if __name__ == "__main__":
    results = scrape_california_ag()
    df = pd.DataFrame(results)
    if not df.empty:
        print(df.head())
