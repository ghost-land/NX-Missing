import requests
import os
import re
import json
import shutil

# URL of the working.txt file on GitHub
url = "https://raw.githubusercontent.com/ghost-land/NX-Missing/master/data/working.txt"

# Root folder containing the files
file_directory = r"./check_missing"

# Folders to store already in Ghost eShop and missing files
already_in_ghosteshop_dir = r"./already_in_ghosteshop"
missing_files_dir = r"./missing_files"

# Create directories if they don't exist
os.makedirs(already_in_ghosteshop_dir, exist_ok=True)
os.makedirs(missing_files_dir, exist_ok=True)

# Download the content of working.txt
response = requests.get(url)
working_data = response.text.splitlines()

# Create a set for quick access to TID and versions from working.txt
working_set = {f"{line.split('|')[0]}|{line.split('|')[1]}" for line in working_data}

# Function to extract TID and version from the file name
def extract_tid_version(file_name):
    match = re.search(r'\[(010[0-9A-F]{13})\]\[v(\d+)\]', file_name)
    if match:
        return match.group(1), match.group(2)
    return None, None

# Lists to hold files already in Ghost eShop and missing files
already_in_ghosteshop = []
missing_files = []

# File extensions to check
valid_extensions = (".nsp", ".nsz", ".xci", ".xcz")

# Recursively search for files in the specified directory and subdirectories
for root, dirs, files in os.walk(file_directory):
    for file_name in files:
        if file_name.endswith(valid_extensions):  # Check if the file has a valid extension
            tid, version = extract_tid_version(file_name)
            if tid and version:
                file_path = os.path.join(root, file_name)
                if f"{tid}|{version}" in working_set:
                    already_in_ghosteshop.append(file_name)  # File already in Ghost eShop
                    shutil.move(file_path, os.path.join(already_in_ghosteshop_dir, file_name))  # Move to Ghost eShop folder
                else:
                    missing_files.append(file_name)  # File missing
                    shutil.move(file_path, os.path.join(missing_files_dir, file_name))  # Move to Missing folder

# Generate a JSON file for files already in Ghost eShop
with open("already_in_ghosteshop.json", "w", encoding="utf-8") as f:
    json.dump(already_in_ghosteshop, f, ensure_ascii=False, indent=4)

# Generate a JSON file for missing files
with open("missing_files.json", "w", encoding="utf-8") as f:
    json.dump(missing_files, f, ensure_ascii=False, indent=4)

# Print the list of files for each category in the console
print("Files already in Ghost eShop:")
for file_name in already_in_ghosteshop:
    print(file_name)

print("\nMissing files:")
for file_name in missing_files:
    print(file_name)

print("Two JSON files have been generated: 'already_in_ghosteshop.json' and 'missing_files.json'")
print(f"Files have been moved to '{already_in_ghosteshop_dir}' and '{missing_files_dir}' respectively.")
