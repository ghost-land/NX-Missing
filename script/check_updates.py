import os
import json
import requests
import subprocess
import sys
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup

# Define the current directory and data directory
current_directory = os.path.dirname(os.path.abspath(__file__))
data_directory = os.path.join(current_directory, 'data')

# Path for working.txt
working_file_path = os.path.join(data_directory, 'working.txt')

# Function to load working.txt data
def load_working_data(file_path):
    try:
        working_data = {}
        with open(file_path, 'r', encoding='utf-8') as working_file:
            for line in working_file:
                if '|' in line:
                    title_id, version = line.strip().split('|')
                    version = int(version)
                    if title_id not in working_data:
                        working_data[title_id] = {"Versions": set(), "Game Name": title_id}
                    working_data[title_id]["Versions"].add(version)
        print(f"Loaded working.txt with {len(working_data)} entries.")
        return working_data
    except FileNotFoundError:
        print(f"Error: working.txt file not found at {file_path}")
        return None
    except Exception as e:
        print(f"Error reading working.txt: {e}")
        return None

# Asynchronous function to fetch game name from tinfoil.io
async def fetch_game_name(session, title_id):
    url = f"https://tinfoil.io/Title/{title_id[:-3]}000"
    try:
        async with session.get(url) as response:
            response.raise_for_status()
            text = await response.text()
            soup = BeautifulSoup(text, 'html.parser')
            return title_id, soup.title.string.strip()  # Get the entire title as the game name
    except Exception as e:
        print(f"Error fetching game name for {title_id}: {e}")
        return title_id, "UNKNOWN GAME"

# Asynchronous function to manage the fetching process
async def fetch_all_game_names(title_ids):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_game_name(session, title_id) for title_id in title_ids]
        return await asyncio.gather(*tasks)

# Function to fetch all game names using threading and asyncio
def fetch_game_names(title_ids):
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(fetch_all_game_names(title_ids))

# Check if working.txt exists
working_data = load_working_data(working_file_path)

# If working.txt does not exist, run list.py to generate it
if working_data is None:
    print("Running list.py to generate working.txt...")
    try:
        # Run list.py in the same directory as the current script
        subprocess.run(['python', os.path.join(current_directory, 'list.py')], check=True)
        # Reload working.txt after running list.py
        working_data = load_working_data(working_file_path)
        if working_data is None:
            print("Error: Unable to load working.txt even after running list.py.")
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

# Prepare a list of title_ids to fetch game names
title_ids_to_fetch = set()

# Check for missing or outdated versions
for title_id, version_info in latest_versions_data.items():
    # Modify the title_id: change the last three digits from 000 to 800
    modified_title_id = title_id[:-3] + '800'

    # Get the latest version and date from the versions.json data
    latest_version = max(map(int, version_info.keys()))
    latest_date = version_info[str(latest_version)]

    # Find the actual key for modified_title_id in working.txt data
    found_key = find_normalized_key(modified_title_id, working_data)

    if found_key:
        working_versions = working_data[found_key]["Versions"]
        game_name = None

        # Check if the latest version is missing in working.txt
        if latest_version not in working_versions:
            missing_updates_count += 1
            # We need to fetch the game name
            title_ids_to_fetch.add(found_key)

            # Add only the missing versions that are not the latest version to missing_old_updates_json
            for version in sorted(map(int, version_info.keys())):
                if version > max(working_versions) and version != latest_version:
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
            title_ids_to_fetch.add(found_key)
        else:
            title_ids_to_fetch.add(title_id[:-3] + '000')

        missing_updates_count += 1

        # Add only the missing versions that are not the latest version to missing_old_updates_json
        for version, date in version_info.items():
            if int(version) != latest_version:
                missing_old_updates_count += 1
                missing_old_updates_json.setdefault(modified_title_id, []).append({
                    "Version": version,
                    "Release Date": date
                })

    total_entries += 1

# Fetch all game names asynchronously
fetched_game_names = fetch_game_names(title_ids_to_fetch)

# Map fetched game names to their title IDs
game_name_map = {title_id: game_name for title_id, game_name in fetched_game_names}

# Update missing_updates_json with fetched game names
for title_id, version_info in latest_versions_data.items():
    modified_title_id = title_id[:-3] + '800'
    latest_version = max(map(int, version_info.keys()))
    latest_date = version_info[str(latest_version)]

    found_key = find_normalized_key(modified_title_id, working_data)

    if found_key:
        if latest_version not in working_data[found_key]["Versions"]:
            game_name = game_name_map.get(found_key, "UNKNOWN GAME")
            missing_updates_txt.append(f"{modified_title_id}|{game_name}|{latest_version}|{latest_date}")
            missing_updates_json[modified_title_id] = {
                "Game Name": game_name,
                "Version": str(latest_version),
                "Release Date": latest_date
            }
    else:
        original_title_id = title_id[:-3] + '000'
        found_key = find_normalized_key(original_title_id, working_data)
        game_name = game_name_map.get(found_key or title_id[:-3] + '000', "UNKNOWN GAME")
        missing_updates_txt.append(f"{modified_title_id}|{game_name}|{latest_version}|{latest_date}")
        missing_updates_json[modified_title_id] = {
            "Game Name": game_name,
            "Version": str(latest_version),
            "Release Date": latest_date
        }

# Sort missing updates by Release Date in descending order
missing_updates_txt.sort(key=lambda x: x.split('|')[-1], reverse=True)
missing_updates_json = dict(sorted(missing_updates_json.items(), key=lambda item: item[1]['Release Date'], reverse=True))
missing_old_updates_json = {k: sorted(v, key=lambda x: x['Release Date'], reverse=True) for k, v in missing_old_updates_json.items()}

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
