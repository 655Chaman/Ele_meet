# Cybersecurity Breach Connector MVP

This repository contains the MVP system for the "Cybersecurity Breach Connector" business model. It automates the process of identifying newly breached companies via public State Attorney General filings, enriching those records with executive contact information, and generating structured lead lists for immediate outreach.

## System Architecture

1. **Scraping Engine (`scrapers/`)**: Periodically pulls public data breach notifications from state portals.
   - `maine_ag_scraper.py`: Extracts from Maine's highly comprehensive portal.
   - `california_ag_scraper.py`: Extracts from the CA Office of the Attorney General portal.
2. **Processing & Enrichment (`processing/`)**: 
   - Deduplicates the raw data.
   - Uses an enrichment module (`enrichment.py`) to simulate finding CEO, CTO, and CISO emails for the breached companies.
3. **Outreach (`outreach/`)**:
   - Contains `outreach_templates.md` with pre-written, highly empathetic cold-email templates designed to pitch Incident Response (IR) services to executives in crisis.
4. **Orchestration (`pipeline.py`)**: The main script that runs the entire workflow and outputs a clean CSV file of enriched leads.

## How to Run

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the pipeline:**
   ```bash
   python pipeline.py
   ```

3. **Check the output:**
   The script will generate a CSV file in the `output/` directory containing the leads, looking something like `breach_leads_20240101_120000.csv`.

## Next Steps for Production

1. **Add Real API Keys**: Update `processing/enrichment.py` to actually call an API like Apollo.io, Hunter.io, or Clearbit.
2. **Database Integration**: Swap the CSV output for a PostgreSQL or SQLite database using an ORM like SQLAlchemy to track historical breaches and outreach statuses.
3. **Automate Outreach**: Integrate the system directly with a CRM (e.g., HubSpot) or a cold-email tool (e.g., Instantly, Lemlist) to automatically draft the emails based on the templates in the `outreach/` directory.
