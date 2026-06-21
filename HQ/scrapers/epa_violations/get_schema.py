import requests

url = "https://api.apify.com/v2/acts/scraperlink~google-search-results-serp-scraper"
res = requests.get(url)
print(res.json())
