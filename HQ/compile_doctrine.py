import os

directories_to_scan = [
    '/Users/syedchamansha/HQ/memory',
    '/Users/syedchamansha/HQ/business-operations',
    '/Users/syedchamansha/HQ/documents-and-reference'
]

output_file = '/Users/syedchamansha/HQ/compiled-doctrine.md'

with open(output_file, 'w', encoding='utf-8') as outfile:
    for directory in directories_to_scan:
        for root, dirs, files in os.walk(directory):
            # Ignore node_modules
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            for file in files:
                if file.endswith('.md') or file.endswith('.json') or file.endswith('.txt'):
                    filepath = os.path.join(root, file)
                    outfile.write(f"\n\n--- FILE: {filepath} ---\n\n")
                    try:
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"Could not read file: {e}")

print(f"Compilation complete: {output_file}")
