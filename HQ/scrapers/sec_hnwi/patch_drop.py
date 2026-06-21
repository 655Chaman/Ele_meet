with open('/Users/syedchamansha/HQ/scrapers/sec_hnwi/scraper.py', 'r') as f:
    code = f.read()

code = code.replace("df = df.sort_values(by='total_value_usd', ascending=False)", "df = df.drop_duplicates()\n        df = df.sort_values(by='total_value_usd', ascending=False)")

with open('/Users/syedchamansha/HQ/scrapers/sec_hnwi/scraper.py', 'w') as f:
    f.write(code)
