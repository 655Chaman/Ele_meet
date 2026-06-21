import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import re

r = requests.get('https://www.osha.gov/news/newsreleases.xml')
root = ET.fromstring(r.text)
for item in root.findall('.//item')[:10]:
    link = item.find('link').text
    title = item.find('title').text
    pubDate = item.find('pubDate').text
    
    resp = requests.get(link)
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    article = soup.find('article')
    if article:
        text = article.get_text(separator=' ', strip=True)
    else:
        text = soup.get_text(separator=' ', strip=True)
        
    penalties = re.findall(r'\$[0-9,]+', text)
    print("-----")
    print("Title:", title)
    print("Date:", pubDate)
    print("Penalties:", penalties)
