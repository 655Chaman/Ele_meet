import requests

url = "https://api.apify.com/v2/acts/scraperlink~google-search-results-serp-scraper"
res = requests.get(url).json()
print("Fetching schema...")
# We need to get the source code or input schema if available.
# Apify usually stores input schema in the 'versions' array.
# But it's hidden if isSourceCodeHidden: True
print(res)
