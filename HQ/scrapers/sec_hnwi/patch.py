with open('/Users/syedchamansha/HQ/scrapers/sec_hnwi/scraper.py', 'r') as f:
    code = f.read()

code = code.replace("sales_data = []", "sales_data = []\n    processed_urls = set()")

code = code.replace("txt_url = href.replace('-index.htm', '.txt')", """txt_url = href.replace('-index.htm', '.txt')
        if txt_url.startswith('/'):
            txt_url = "https://www.sec.gov" + txt_url
            
        if txt_url in processed_urls:
            continue
        processed_urls.add(txt_url)
""")

code = code.replace("        if txt_url.startswith('/'):\n            txt_url = \"https://www.sec.gov\" + txt_url\n", "")

with open('/Users/syedchamansha/HQ/scrapers/sec_hnwi/scraper.py', 'w') as f:
    f.write(code)
