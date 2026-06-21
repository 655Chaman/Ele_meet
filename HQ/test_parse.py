import requests
from bs4 import BeautifulSoup

headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get("https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf", headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')
for script in soup.find_all('script'):
    if script.get('src'):
        print(script['src'])

print("--- Data? ---")
print("breach" in r.text.lower())
