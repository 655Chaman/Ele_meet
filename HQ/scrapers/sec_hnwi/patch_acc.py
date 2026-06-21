with open('/Users/syedchamansha/HQ/scrapers/sec_hnwi/scraper.py', 'r') as f:
    code = f.read()

code = code.replace("processed_urls.add(txt_url)", """
        acc_no = txt_url.split('/')[-1].replace('.txt', '')
        if acc_no in processed_urls:
            continue
        processed_urls.add(acc_no)
""")
code = code.replace("if txt_url in processed_urls:\n            continue", "")

with open('/Users/syedchamansha/HQ/scrapers/sec_hnwi/scraper.py', 'w') as f:
    f.write(code)
