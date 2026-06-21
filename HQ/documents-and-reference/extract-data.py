import json, os, glob

path = "/Users/krdeeksha/HQ/ENTIRE SOURCE/"
files = glob.glob(path + "*.json")

def extract_strings(obj, keys_of_interest):
    found = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if any(key in k.lower() for key in keys_of_interest) and isinstance(v, str) and len(v) > 20:
                found.append((k, v))
            found.extend(extract_strings(v, keys_of_interest))
    elif isinstance(obj, list):
        for item in obj:
            found.extend(extract_strings(item, keys_of_interest))
    return found

print("Extracting Prompts, Subjects, and Copy...")
for f in files:
    try:
        with open(f, "r") as file:
            data = json.load(file)
            
            # Look for keys like prompt, message, subject, body, content, text
            matches = extract_strings(data, ['prompt', 'content', 'text', 'subject', 'body'])
            
            if matches:
                print(f"\n--- {os.path.basename(f)} ---")
                # Deduplicate and limit output size per file
                seen = set()
                count = 0
                for k, v in matches:
                    if v not in seen:
                        seen.add(v)
                        print(f"[{k}]: {v[:200]}...")
                        count += 1
                        if count > 5:  # print up to 5 samples per file
                            print("... (more found)")
                            break
    except Exception as e:
        pass
