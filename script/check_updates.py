import os
import json
import requests
import subprocess
import sys

# Define the current directory and data directory
current_directory = os.path.dirname(os.path.abspath(__file__))
data_directory = os.path.join(current_directory, 'data')

# Path for working.json
working_file_path = os.path.join(data_directory, 'working.json')

# Function to load working.json data
def load_working_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as working_file:
            working_data = json.load(working_file)
        print(f"Loaded working.json with {len(working_data)} entries.")
        return working_data
    except FileNotFoundError:
        print(f"Error: working.json file not found at {file_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error decoding working.json: {e}")
        return None

# Check if working.json exists
working_data = load_working_data(working_file_path)

# If working.json does not exist, run list.py to generate it
if working_data is None:
    print("Running list.py to generate working.json...")
    try:
        # Run list.py in the same directory as the current script
        subprocess.run(['python', os.path.join(current_directory, 'list.py')], check=True)
        # Reload working.json after running list.py
        working_data = load_working_data(working_file_path)
        if working_data is None:
            print("Error: Unable to load working.json even after running list.py.")
            sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Error running list.py: {e}")
        sys.exit(1)

# Load the versions.json data from GitHub
try:
    response = requests.get("https://raw.githubusercontent.com/blawar/titledb/master/versions.json")
    latest_versions_data = response.json()
    print(f"Loaded versions.json with {len(latest_versions_data)} entries from GitHub.")
except requests.RequestException as e:
    print(f"Error downloading versions.json: {e}")
    latest_versions_data = {}

# Normalize function to handle case differences and strip whitespace
def normalize_title_id(tid):
    return tid.strip().lower()

# Find the actual key in the dictionary after normalization
def find_normalized_key(search_key, data_dict):
    normalized_search_key = normalize_title_id(search_key)
    for key in data_dict:
        if normalize_title_id(key) == normalized_search_key:
            return key
    return None

# Data structures to hold missing updates
missing_updates_txt = []
missing_updates_json = {}
missing_old_updates_json = {}

# Counters for statistics
total_entries = 0
missing_updates_count = 0
missing_old_updates_count = 0

# Check for missing or outdated versions
for title_id, version_info in latest_versions_data.items():
    # Modify the title_id: change the last three digits from 000 to 800
    modified_title_id = title_id[:-3] + '800'

    # Get the latest version and date from the versions.json data
    latest_version = max(map(int, version_info.keys()))
    latest_date = version_info[str(latest_version)]

    # Find the actual key for modified_title_id in working.json
    found_key = find_normalized_key(modified_title_id, working_data)

    if found_key:
        working_version = int(working_data[found_key]["Version"])
        game_name = working_data[found_key]["Game Name"]

        # Check if the working version is outdated
        if latest_version > working_version:
            missing_updates_count += 1
            missing_updates_txt.append(f"{modified_title_id}|{game_name}|{latest_version}|{latest_date}")
            missing_updates_json[modified_title_id] = {
                "Game Name": game_name,
                "Version": str(latest_version),
                "Release Date": latest_date
            }

            # Add any versions between the working version and the latest version
            for version in sorted(map(int, version_info.keys())):
                if version > working_version:
                    missing_old_updates_count += 1
                    missing_old_updates_json.setdefault(modified_title_id, []).append({
                        "Version": str(version),
                        "Release Date": version_info[str(version)]
                    })
    else:
        # If the modified_title_id is not found, try the original_title_id with '000' suffix
        original_title_id = title_id[:-3] + '000'
        found_key = find_normalized_key(original_title_id, working_data)

        if found_key:
            game_name = working_data[found_key]["Game Name"]
        else:
            game_name = "UNKNOWN GAME"

        missing_updates_count += 1
        missing_updates_txt.append(f"{modified_title_id}|{game_name}|{latest_version}|{latest_date}")
        missing_updates_json[modified_title_id] = {
            "Game Name": game_name,
            "Version": str(latest_version),
            "Release Date": latest_date
        }

        # Add any versions for missing_old_updates_json
        for version, date in version_info.items():
            missing_old_updates_count += 1
            missing_old_updates_json.setdefault(modified_title_id, []).append({
                "Version": version,
                "Release Date": date
            })

    total_entries += 1

# Write missing-updates.txt file
missing_txt_file_path = os.path.join(data_directory, 'missing-updates.txt')
with open(missing_txt_file_path, 'w', encoding='utf-8') as txt_file:
    txt_file.write('\n'.join(missing_updates_txt))
print(f"\nFile {missing_txt_file_path} generated successfully.")

# Write missing-updates.json file
missing_json_file_path = os.path.join(data_directory, 'missing-updates.json')
with open(missing_json_file_path, 'w', encoding='utf-8') as json_file:
    json.dump(missing_updates_json, json_file, indent=4)
print(f"\nFile {missing_json_file_path} generated successfully.")

# Write missing-old-updates.json file
missing_old_updates_file_path = os.path.join(data_directory, 'missing-old-updates.json')
with open(missing_old_updates_file_path, 'w', encoding='utf-8') as json_file:
    json.dump(missing_old_updates_json, json_file, indent=4)
print(f"\nFile {missing_old_updates_file_path} generated successfully.")

# Print summary
print(f"\nSummary:")
print(f"Total entries in versions.json: {total_entries}")
print(f"Total missing updates found: {missing_updates_count}")
print(f"Total old missing updates found: {missing_old_updates_count}")
print(f"Total entries in missing-updates.json: {len(missing_updates_json)}")
print(f"Total entries in missing-old-updates.json: {len(missing_old_updates_json)}")
