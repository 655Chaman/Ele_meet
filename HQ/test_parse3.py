import requests
from bs4 import BeautifulSoup

headers = {'User-Agent': 'Mozilla/5.0'}
session = requests.Session()
r = session.get("https://ocrportal.hhs.gov/ocr/breach/breach_frontpage.jsf", headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')
for a in soup.find_all('a'):
    print(a.get('href'), a.text.strip(), a.get('onclick'))
