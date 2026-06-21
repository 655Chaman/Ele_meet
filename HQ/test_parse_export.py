import requests
from bs4 import BeautifulSoup
import re

headers = {'User-Agent': 'Mozilla/5.0'}
session = requests.Session()
r1 = session.get("https://ocrportal.hhs.gov/ocr/breach/breach_frontpage.jsf", headers=headers)
soup1 = BeautifulSoup(r1.text, 'html.parser')
view_state = soup1.find("input", {"name": "javax.faces.ViewState"}).get("value")

link = soup1.find("a", string="View HIPAA Breach Reports")
match = re.search(r"\{'([^']+)':'[^']+'\}", link.get("onclick"))
post_id = match.group(1) if match else 'ocrForm:j_idt39'

data = {
    'ocrForm': 'ocrForm',
    post_id: post_id,
    'javax.faces.ViewState': view_state
}

r2 = session.post("https://ocrportal.hhs.gov/ocr/breach/breach_frontpage.jsf", data=data, headers=headers)
soup2 = BeautifulSoup(r2.text, 'html.parser')

for a in soup2.find_all('a'):
    if 'j_idt' in (a.get('onclick') or ''):
        img = a.find('img')
        if img:
            print("Link with image:", a.get('onclick'), img.get('src'), img.get('title') or img.get('alt'))
