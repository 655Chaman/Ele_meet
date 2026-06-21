import asyncio
import requests
from apify import Actor

async def main():
    async with Actor:
        actor_input = await Actor.get_input() or {}
        location = actor_input.get('location', 'US')
        limit = actor_input.get('limit', 500)

        Actor.log.info(f"🚀 Starting Universal Environmental Scraper")
        Actor.log.info(f"📍 Target Country: {location}")
        Actor.log.info(f"📊 Requested Limit: {limit}")
        
        results = []
        
        if location == 'US':
            # US EPA ECHO REST API
            Actor.log.info("Connecting to US EPA ECHO Database...")
            url = f"https://echodata.epa.gov/echo/cwa_rest_services.get_facilities?output=JSON&p_vio_status=Y&p_st=CA&responseset={limit}"
            resp = requests.get(url)
            if resp.status_code == 200:
                data = resp.json()
                facilities = data.get('Results', {}).get('Facilities', [])
                for f in facilities:
                    results.append({
                        "country": "US",
                        "lead_category": "Convicted Violator",
                        "facility_name": f.get("FacName", ""),
                        "street": f.get("FacStreet", ""),
                        "city": f.get("FacCity", ""),
                        "state": f.get("FacState", ""),
                        "violation_type": "Clean Water Act Violation"
                    })
            else:
                Actor.log.error("Failed to fetch data from US EPA ECHO.")

        elif location == 'UK':
            # UK data.gov.uk Environment Agency API
            Actor.log.info("Connecting to UK Environment Agency National Register...")
            url = f"https://environment.data.gov.uk/public-register/enforcement-action/action.json?_limit={limit}"
            resp = requests.get(url)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get('items', [])
                for item in items:
                    results.append({
                        "country": "UK",
                        "lead_category": "Convicted Violator",
                        "facility_name": item.get("offenderName", ""),
                        "street": "UK Database (Address lookup required)",
                        "city": "UK",
                        "state": "",
                        "violation_type": item.get("offence", ""),
                        "date_of_action": item.get("date", "")
                    })
            else:
                Actor.log.error("Failed to fetch data from UK Environment Agency.")
                
        elif location == 'Canada':
            Actor.log.info("Connecting to Environment and Climate Change Canada (ECCC)...")
            Actor.log.info("Launching Playwright Headless Browser to bypass anti-bot protections...")
            
            from playwright.async_api import async_playwright
            from bs4 import BeautifulSoup
            
            try:
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    page = await browser.new_page()
                    # Go to the Canadian Registry (using the most common search portal)
                    url = "https://www.canada.ca/en/environment-climate-change/services/environmental-enforcement/environmental-offenders-registry.html"
                    await page.goto(url, wait_until="networkidle")
                    
                    # Wait for table to render if any
                    html = await page.content()
                    soup = BeautifulSoup(html, "html.parser")
                    
                    # Extract tables
                    tables = soup.find_all('table')
                    if tables:
                        # Assuming the first data table contains the registry
                        target_table = tables[0]
                        rows = target_table.find_all('tr')
                        for row in rows[1:limit+1]:  # Skip header, respect limit
                            cols = row.find_all(['td', 'th'])
                            if len(cols) >= 3:
                                results.append({
                                    "country": "Canada",
                                    "lead_category": "Convicted Violator",
                                    "facility_name": cols[0].text.strip(),
                                    "violation_type": cols[1].text.strip() if len(cols) > 1 else "",
                                    "date_of_action": cols[2].text.strip() if len(cols) > 2 else "",
                                    "street": "Canada Database",
                                    "city": "",
                                    "state": ""
                                })
                    else:
                        Actor.log.warning("No tables found on the Canadian registry page. The page structure might have changed or it requires an interactive search.")
                    
                    await browser.close()
            except Exception as e:
                Actor.log.error(f"Playwright execution failed: {str(e)}")

        elif location == 'Australia':
            Actor.log.info("Connecting to Australia (NSW EPA) Public Register...")
            Actor.log.info("Launching Playwright Headless Browser to bypass anti-bot protections...")
            
            from playwright.async_api import async_playwright
            from bs4 import BeautifulSoup
            
            try:
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    page = await browser.new_page()
                    url = "https://apps.epa.nsw.gov.au/prpoeoapp/"
                    await page.goto(url, wait_until="networkidle")
                    
                    html = await page.content()
                    soup = BeautifulSoup(html, "html.parser")
                    
                    tables = soup.find_all('table')
                    if tables:
                        target_table = tables[0]
                        rows = target_table.find_all('tr')
                        for row in rows[1:limit+1]:
                            cols = row.find_all(['td', 'th'])
                            if len(cols) >= 3:
                                results.append({
                                    "country": "Australia",
                                    "lead_category": "Convicted Violator",
                                    "company_name": cols[0].text.strip(),
                                    "violation_type": cols[1].text.strip() if len(cols) > 1 else "Environmental Offence",
                                    "date_issued": cols[2].text.strip() if len(cols) > 2 else "",
                                    "location": "NSW, Australia",
                                    "source_url": url
                                })
                    else:
                        Actor.log.warning("No tables found on the NSW EPA registry page. The page structure might require an interactive search.")
                    
                    await browser.close()
            except Exception as e:
                Actor.log.error(f"Playwright execution failed: {str(e)}")

        elif location in ('EU', 'Ireland'):
            Actor.log.info("Connecting to European Union (Ireland EPA) National Priority Sites...")
            Actor.log.info("Launching Playwright Headless Browser to bypass anti-bot protections...")
            
            from playwright.async_api import async_playwright
            from bs4 import BeautifulSoup
            
            try:
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    page = await browser.new_page()
                    url = "https://www.epa.ie/our-services/compliance--enforcement/industrial-emissions-licensing/national-priority-sites/"
                    await page.goto(url, wait_until="networkidle")
                    
                    html = await page.content()
                    soup = BeautifulSoup(html, "html.parser")
                    
                    tables = soup.find_all('table')
                    if tables:
                        target_table = tables[0]
                        rows = target_table.find_all('tr')
                        for row in rows[1:limit+1]:
                            cols = row.find_all(['td', 'th'])
                            if len(cols) >= 3:
                                results.append({
                                    "country": "EU",
                                    "lead_category": "Heavy Industrial Polluter",
                                    "company_name": cols[0].text.strip(),
                                    "violation_type": "National Priority Site (Non-Compliant)",
                                    "date_issued": "",
                                    "location": "Ireland",
                                    "source_url": url
                                })
                    else:
                        Actor.log.warning("No tables found on the Ireland EPA registry page.")
                    
                    await browser.close()
            except Exception as e:
                Actor.log.error(f"Playwright execution failed: {str(e)}")

        elif location in ('Germany', 'France'):
            Actor.log.info(f"Connecting to EU Industrial Emissions Portal for heavy polluters in {location}...")
            Actor.log.info("Launching Playwright Headless Browser to bypass anti-bot protections...")
            
            from playwright.async_api import async_playwright
            from bs4 import BeautifulSoup
            
            try:
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    page = await browser.new_page()
                    url = "https://industry.eea.europa.eu/"
                    await page.goto(url, wait_until="networkidle")
                    
                    html = await page.content()
                    soup = BeautifulSoup(html, "html.parser")
                    
                    tables = soup.find_all('table')
                    if tables:
                        target_table = tables[0]
                        rows = target_table.find_all('tr')
                        for row in rows[1:limit+1]:
                            cols = row.find_all(['td', 'th'])
                            if len(cols) >= 3:
                                results.append({
                                    "country": location,
                                    "lead_category": "Heavy Industrial Polluter",
                                    "company_name": cols[0].text.strip(),
                                    "violation_type": "Heavy Industrial Polluter (E-PRTR)",
                                    "date_issued": "",
                                    "location": location,
                                    "source_url": url
                                })
                    else:
                        Actor.log.warning(f"No tables found on the EU Industrial Emissions Portal for {location}.")
                    
                    await browser.close()
            except Exception as e:
                Actor.log.error(f"Playwright execution failed: {str(e)}")

        else:
            Actor.log.warning(f"Location '{location}' is not a recognized target.")
            results.append({"status": f"Invalid location: {location}."})

        if results:
            await Actor.push_data(results)
            Actor.log.info(f"✅ Successfully extracted and pushed {len(results)} corporate violators to the dataset.")
        else:
            Actor.log.warning("No results were found or pushed.")

if __name__ == "__main__":
    asyncio.run(main())
