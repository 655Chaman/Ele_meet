import requests
from bs4 import BeautifulSoup

headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get("https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf", headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')
print(soup.find_all(text=lambda t: t and 'CSV' in t))
print("---")
for a in soup.find_all('a'):
    print(a.get('href'), a.text.strip())
print("--- form ---")
for f in soup.find_all('form'):
    print(f.get('action'), f.get('id'))
    for inp in f.find_all('input'):
        print(" ", inp.get('name'), inp.get('value'))
