from bs4 import BeautifulSoup

with open('/Users/krdeeksha/ELE-MEET/dom_dump.html', 'r') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')
    
# Print visible text
text = soup.get_text(separator='\n', strip=True)
print("Visible text on page:")
print("---")
print(text[:1000]) # First 1000 chars

# Look for specific buttons
print("\n---")
for btn in soup.find_all(['button', 'a']):
    btn_text = btn.get_text(strip=True)
    if btn_text:
        print(f"{btn.name}: {btn_text}")
        
