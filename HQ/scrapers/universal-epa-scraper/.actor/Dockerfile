FROM apify/actor-python-playwright:3.11

# Copy requirements.txt
COPY requirements.txt ./

# Install packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . ./

# Run the actor
CMD ["python3", "-m", "src.main"]
