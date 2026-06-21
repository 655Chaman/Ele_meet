import requests
from bs4 import BeautifulSoup

headers = {'User-Agent': 'Mozilla/5.0'}
session = requests.Session()
r1 = session.get("https://ocrportal.hhs.gov/ocr/breach/breach_frontpage.jsf", headers=headers)
soup1 = BeautifulSoup(r1.text, 'html.parser')

view_state = soup1.find("input", {"name": "javax.faces.ViewState"}).get("value")

# Submit form for 'View HIPAA Breach Reports'
# ocrForm:j_idt39 (from output)
# We need to find the exact id of the link. Let's find it dynamically:
link = soup1.find("a", string="View HIPAA Breach Reports")
onclick = link.get("onclick")
print("onclick:", onclick)
import re
match = re.search(r"\{'([^']+)':'[^']+'\}", onclick)
if match:
    post_id = match.group(1)
else:
    post_id = 'ocrForm:j_idt39'

data = {
    'ocrForm': 'ocrForm',
    post_id: post_id,
    'javax.faces.ViewState': view_state
}

r2 = session.post("https://ocrportal.hhs.gov/ocr/breach/breach_frontpage.jsf", data=data, headers=headers)
print("r2 url:", r2.url)
print("r2 status:", r2.status_code)
# Is this the breach report page?
soup2 = BeautifulSoup(r2.text, 'html.parser')
print(soup2.find("title").text if soup2.find("title") else "no title")

# If we are on the breach report page, find the CSV download link.
print(soup2.find_all(string=lambda t: t and 'CSV' in t))
for a in soup2.find_all('a'):
    if 'csv' in a.text.lower() or 'export' in a.text.lower() or 'download' in a.text.lower():
        print(a.get('href'), a.text.strip(), a.get('onclick'))
        
print("--- Links in r2 ---")
for a in soup2.find_all('a'):
    print(a.get('href'), a.get('onclick'), a.get('id'), a.text.strip())

print("--- Buttons in r2 ---")
for b in soup2.find_all('button'):
    print(b.get('id'), b.get('onclick'), b.text.strip())
