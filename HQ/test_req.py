import requests

try:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    r = requests.get("https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf", headers=headers)
    print(r.status_code)
    print(len(r.text))
    print(r.text[:500])
except Exception as e:
    print(e)
