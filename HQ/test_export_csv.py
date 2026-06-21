import requests
from bs4 import BeautifulSoup
import re

headers = {'User-Agent': 'Mozilla/5.0'}
session = requests.Session()

print("Step 1: Get front page")
r1 = session.get("https://ocrportal.hhs.gov/ocr/breach/breach_frontpage.jsf", headers=headers)
soup1 = BeautifulSoup(r1.text, 'html.parser')
view_state = soup1.find("input", {"name": "javax.faces.ViewState"}).get("value")
link = soup1.find("a", string="View HIPAA Breach Reports")
match = re.search(r"\{'([^']+)':'[^']+'\}", link.get("onclick"))
post_id = match.group(1) if match else 'ocrForm:j_idt39'

print("Step 2: Submit front page to get report page")
data = {
    'ocrForm': 'ocrForm',
    post_id: post_id,
    'javax.faces.ViewState': view_state
}
r2 = session.post("https://ocrportal.hhs.gov/ocr/breach/breach_frontpage.jsf", data=data, headers=headers)
soup2 = BeautifulSoup(r2.text, 'html.parser')

print("Step 3: Find CSV export link and ViewState")
view_state2_node = soup2.find("input", {"name": "javax.faces.ViewState"})
view_state2 = view_state2_node.get("value") if view_state2_node else view_state

csv_post_id = None
for a in soup2.find_all('a'):
    img = a.find('img')
    if img and 'csv.png' in img.get('src', ''):
        match = re.search(r"\{'([^']+)':'[^']+'\}", a.get("onclick"))
        if match:
            csv_post_id = match.group(1)
            break

if csv_post_id:
    print(f"Found CSV export ID: {csv_post_id}")
    data_csv = {
        'ocrForm': 'ocrForm',
        csv_post_id: csv_post_id,
        'javax.faces.ViewState': view_state2
    }
    r3 = session.post("https://ocrportal.hhs.gov/ocr/breach/breach_report_hip.jsf", data=data_csv, headers=headers)
    print("CSV Status:", r3.status_code)
    print("CSV Headers:", r3.headers.get('Content-Disposition'))
    print("CSV Data Start:", repr(r3.text[:200]))
else:
    print("Could not find CSV export link.")
