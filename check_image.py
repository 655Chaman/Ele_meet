import pytesseract
from PIL import Image

try:
    img = Image.open('/Users/krdeeksha/ELE-MEET/bot-admission.png')
    text = pytesseract.image_to_string(img)
    print("TEXT FOUND ON SCREEN:")
    print(text)
except Exception as e:
    print(f"Error: {e}")
