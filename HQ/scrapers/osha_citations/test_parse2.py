import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import re

r = requests.get('https://www.osha.gov/news/newsreleases.xml')
root = ET.fromstring(r.text)
for item in root.findall('.//item')[:5]:
    link = item.find('link').text
    
    resp = requests.get(link)
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    article = soup.find('article')
    if article:
        text = article.get_text(separator=' ', strip=True)
    else:
        text = soup.get_text(separator=' ', strip=True)
        
    penalties = re.findall(r'\$[0-9,]+', text)
    penalty_amount = 0
    if penalties:
        penalty_amount = max([int(p.replace('$', '').replace(',', '')) for p in penalties])
        
    # Company name: "cited [company] for"
    # Try different regex patterns
    m_company = re.search(r'cited (.*?) for', text)
    company_name = m_company.group(1) if m_company else 'Unknown'
    
    # Violation type: "for (.*?) violations"
    m_violation = re.search(r'for (.*?) (violations|hazards)', text)
    violation_type = m_violation.group(1) if m_violation else 'Unknown'
    
    # City, State: first words before dash
    # Typically paragraph starts with "CITY, State – " or "CITY – "
    # We can look for caps before " – "
    m_loc = re.search(r'([A-Z\s,.]+?)\s*[–—-]\s*(The|U\.S\.)', text)
    if m_loc:
        loc = m_loc.group(1).strip()
    else:
        loc = 'Unknown'
        
    print("Link:", link)
    print("Company:", company_name)
    print("Violation:", violation_type)
    print("Location:", loc)
    print("Penalty:", penalty_amount)
    print("-----")
