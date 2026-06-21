import xml.etree.ElementTree as ET
import requests

url = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&owner=include&count=100&output=atom"
headers = {"User-Agent": "HQ-Research admin@hq.com"}
res = requests.get(url, headers=headers)
root = ET.fromstring(res.text)
ns = {'atom': 'http://www.w3.org/2005/Atom'}
entries = root.findall('atom:entry', ns)
for e in entries[:5]:
    print(e.findtext('atom:title', namespaces=ns))
