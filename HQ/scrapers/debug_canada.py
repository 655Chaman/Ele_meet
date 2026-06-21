import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        url = "https://www.canada.ca/en/environment-climate-change/services/environmental-enforcement/registry.html"
        print(f"Navigating to {url}...")
        await page.goto(url, wait_until="networkidle")
        
        html = await page.content()
        with open("/Users/syedchamansha/HQ/scrapers/canada_registry.html", "w") as f:
            f.write(html)
            
        print("HTML dumped successfully to /Users/syedchamansha/HQ/scrapers/canada_registry.html")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
