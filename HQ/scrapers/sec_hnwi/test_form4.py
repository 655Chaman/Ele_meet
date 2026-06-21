import requests
import xml.etree.ElementTree as ET

url = "https://www.sec.gov/Archives/edgar/data/1428439/000139357126000014/0001393571-26-000014.txt"
headers = {"User-Agent": "HQ-Research admin@hq.com"}
res = requests.get(url, headers=headers)
txt_content = res.text
xml_start = txt_content.find("<XML>")
xml_end = txt_content.find("</XML>")
xml_string = txt_content[xml_start+5:xml_end].strip()
form_xml = ET.fromstring(xml_string)
for trans in form_xml.findall('.//nonDerivativeTransaction'):
    shares = trans.findtext('.//transactionShares/value')
    price = trans.findtext('.//transactionPricePerShare/value')
    owner = trans.findtext('.//directOrIndirectOwnership/value')
    print(f"Shares: {shares}, Price: {price}, Owner: {owner}")
