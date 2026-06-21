import requests
from bs4 import BeautifulSoup
import re
import csv
from io import StringIO

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

view_state2 = soup2.find("input", {"name": "javax.faces.ViewState"}).get("value")

csv_post_id = None
for a in soup2.find_all('a'):
    img = a.find('img')
    if img and 'csv.png' in img.get('src', ''):
        match = re.search(r"\{'([^']+)':'[^']+'\}", a.get("onclick"))
        if match:
            csv_post_id = match.group(1)
            break

if csv_post_id:
    data_csv = {
        'ocrForm': 'ocrForm',
        csv_post_id: csv_post_id,
        'javax.faces.ViewState': view_state2
    }
    r3 = session.post("https://ocrportal.hhs.gov/ocr/breach/breach_report_hip.jsf", data=data_csv, headers=headers)
    reader = csv.reader(StringIO(r3.text))
    rows = list(reader)
    print("Header:", rows[0])
    print("Row 1:", rows[1] if len(rows)>1 else "No data")
