import requests
import xml.etree.ElementTree as ET

url = "https://www.sec.gov/Archives/edgar/data/1805735/000180573526000004/0001805735-26-000004.txt"
headers = {"User-Agent": "HQ-Research admin@hq.com"}
res = requests.get(url, headers=headers)
txt = res.text
start = txt.find("<XML>")
end = txt.find("</XML>")
xml_content = txt[start+5:end].strip()

root = ET.fromstring(xml_content)
print("periodOfReport:", root.findtext(".//periodOfReport"))
print("signatureDate:", root.findtext(".//signatureDate"))

for owner in root.findall(".//reportingOwner"):
    name = owner.findtext(".//rptOwnerName")
    title = owner.findtext(".//officerTitle")
    isDirector = owner.findtext(".//isDirector")
    isOfficer = owner.findtext(".//isOfficer")
    isTenPercentOwner = owner.findtext(".//isTenPercentOwner")
    isOther = owner.findtext(".//isOther")
    
    print(f"Name: {name}, Title: {title}, Dir: {isDirector}, Off: {isOfficer}, 10%: {isTenPercentOwner}, Other: {isOther}")

