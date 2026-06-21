import pandas as pd
import logging
from datetime import datetime
import os
import sys

# Ensure the root project directory is in the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.maine_ag_scraper import scrape_maine_ag
from scrapers.california_ag_scraper import scrape_california_ag
from processing.enrichment import process_breaches

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_pipeline():
    logger.info("--- Starting Cybersecurity Breach Connector Pipeline ---")
    
    # 1. Scrape data
    logger.info("Stage 1: Scraping Public Attorney General Portals...")
    maine_data = scrape_maine_ag()
    ca_data = scrape_california_ag()
    
    all_breaches = maine_data + ca_data
    
    if not all_breaches:
        logger.warning("No breaches found. Exiting pipeline.")
        return
        
    df_breaches = pd.DataFrame(all_breaches)
    logger.info(f"Total raw breaches collected: {len(df_breaches)}")
    
    # 2. Deduplicate
    # In reality, companies might report to multiple states for the same incident.
    logger.info("Stage 2: Deduplicating records...")
    df_breaches.drop_duplicates(subset=['company_name'], keep='first', inplace=True)
    logger.info(f"Breaches after deduplication: {len(df_breaches)}")
    
    # 3. Enrich Contacts
    logger.info("Stage 3: Enriching records with CEO/CTO/CISO contacts...")
    enriched_records = process_breaches(df_breaches)
    df_enriched = pd.DataFrame(enriched_records)
    
    # 4. Save Output
    logger.info("Stage 4: Saving structured leads...")
    os.makedirs("output", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"output/breach_leads_{timestamp}.csv"
    
    df_enriched.to_csv(output_filename, index=False)
    logger.info(f"Pipeline completed successfully! Saved {len(df_enriched)} enriched leads to {output_filename}")
    
if __name__ == "__main__":
    run_pipeline()
