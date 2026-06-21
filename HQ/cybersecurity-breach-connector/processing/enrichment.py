import logging
import os
import random

logger = logging.getLogger(__name__)

# In a real-world scenario, you would use API keys from a service like Apollo.io, Hunter.io, or Clearbit.
APOLLO_API_KEY = os.getenv("APOLLO_API_KEY", "")

def get_company_domain(company_name):
    """
    Mock function to simulate finding a company domain based on its name.
    In reality, you'd use a Search API or Clearbit Discovery API.
    """
    cleaned_name = company_name.lower().replace(" ", "").replace(",", "").replace(".", "").replace("inc", "").replace("llc", "")
    if not cleaned_name:
        return "unknown.com"
    return f"{cleaned_name}.com"

def enrich_contact(company_name):
    """
    Simulates calling an enrichment API (like Apollo.io or Hunter.io) 
    to find the CEO, CTO, or CISO's contact information.
    """
    logger.info(f"Enriching contact info for {company_name}...")
    
    domain = get_company_domain(company_name)
    
    # Mock Response
    # In production, this is where you'd make a request like:
    # requests.post('https://api.apollo.io/v1/people/search', json={"api_key": APOLLO_API_KEY, "q_organization_domains": domain, "person_titles": ["CEO", "CTO", "CISO"]})
    
    titles = ["CEO", "CTO", "CISO", "VP of IT"]
    first_names = ["John", "Sarah", "Michael", "Emma", "David", "Jessica"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia"]
    
    # Simulate a 70% success rate in finding a contact
    if random.random() > 0.3:
        title = random.choice(titles)
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        email = f"{first_name.lower()}.{last_name.lower()}@{domain}"
        
        return {
            "contact_name": f"{first_name} {last_name}",
            "contact_title": title,
            "contact_email": email,
            "domain": domain,
            "enrichment_status": "Success"
        }
    else:
        return {
            "contact_name": "Unknown",
            "contact_title": "Unknown",
            "contact_email": "Unknown",
            "domain": domain,
            "enrichment_status": "Failed"
        }

def process_breaches(breaches_df):
    """
    Takes a DataFrame of breaches and enriches them with contact info.
    """
    logger.info("Starting enrichment process for scraped breaches...")
    
    enriched_data = []
    
    for index, row in breaches_df.iterrows():
        company_name = row.get("company_name", "")
        if not company_name or company_name == "Unknown":
            continue
            
        contact_info = enrich_contact(company_name)
        
        # Merge dictionaries
        combined_record = {**row.to_dict(), **contact_info}
        enriched_data.append(combined_record)
        
    return enriched_data
