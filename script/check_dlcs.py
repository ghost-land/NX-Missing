import json
import os
import logging
import requests
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Function to normalize title IDs
def normalize_title_id(tid):
    return tid.strip().lower()

# Function to decrement the 13th character in the TID by one
def decrement_13th_character(tid):
    char_13 = tid[12]
    if char_13.isdigit():
        new_char_13 = str(int(char_13) - 1)
    else:
        new_char_13 = chr(ord(char_13) - 1)
    return tid[:12] + new_char_13 + '000'

# Asynchronous function to fetch game name from tinfoil.io
async def fetch_game_name(session, base_tid):
    url = f"https://tinfoil.io/Title/{base_tid}"
    try:
        async with session.get(url) as response:
            response.raise_for_status()
            text = await response.text()
            soup = BeautifulSoup(text, 'html.parser')
            base_game_name = soup.title.string.strip() if soup.title else 'Unknown Base Game'
            logger.debug(f"Fetched base game name for {base_tid}: {base_game_name}")
            return base_tid, base_game_name
    except Exception as e:
        logger.error(f"Error fetching game name for {base_tid}: {e}")
        return base_tid, 'Unknown Base Game'

# Asynchronous function to manage the fetching process
async def fetch_all_game_names(base_tids):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_game_name(session, base_tid) for base_tid in base_tids]
        return await asyncio.gather(*tasks)

# Function to fetch all game names using threading and asyncio
def fetch_game_names(base_tids):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(fetch_all_game_names(base_tids))

# Function to find missing DLCs by comparing titles_db.json with working.txt
def find_missing_dlcs_with_base_names(data_directory):
    # Load titles_db.json
    json_file_path = os.path.join(data_directory, 'titles_db.json')
    with open(json_file_path, 'r', encoding='utf-8') as json_file:
        titles_db = json.load(json_file)
    
    # Load working.txt
    working_txt_path = os.path.join(data_directory, 'working.txt')
    with open(working_txt_path, 'r', encoding='utf-8') as txt_file:
        working_titles = set(normalize_title_id(line.split('|')[0]) for line in txt_file)
    
    # Identify missing DLCs and prepare base TIDs for fetching game names
    missing_dlcs = {}
    missing_dlcs_txt_output = []
    base_tids_to_fetch = set()

    for title_id, details in titles_db.items():
        normalized_title_id = normalize_title_id(title_id)
        if not normalized_title_id.endswith(('000', '800')) and normalized_title_id not in working_titles:
            base_tid = decrement_13th_character(normalized_title_id)
            base_tids_to_fetch.add(base_tid)
            
            missing_dlcs[normalized_title_id] = {
                "Release Date": details.get("Release Date"),
                "dlc_name": details.get("Title Name"),
                "base_game": "Fetching...",
                "size": details.get("size")
            }

    logger.info(f"Identified {len(missing_dlcs)} missing DLCs to fetch base game names for.")

    # Fetch all game names using threading and asyncio
    with ThreadPoolExecutor() as executor:
        fetched_game_names = list(executor.map(fetch_game_names, [base_tids_to_fetch]))

    # Update missing DLCs with fetched base game names
    game_name_map = {base_tid: game_name for base_tid, game_name in fetched_game_names[0]}
    for title_id in missing_dlcs:
        base_tid = decrement_13th_character(title_id)
        missing_dlcs[title_id]['base_game'] = game_name_map.get(base_tid, 'Unknown Base Game')
        missing_dlcs_txt_output.append(
            f"{title_id}|{missing_dlcs[title_id]['Release Date']}|{missing_dlcs[title_id]['dlc_name']}|{missing_dlcs[title_id]['base_game']}|{missing_dlcs[title_id]['size']}"
        )

    # Write missing-dlcs.json
    missing_dlcs_json_file_path = os.path.join(data_directory, 'missing-dlcs.json')
    with open(missing_dlcs_json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(missing_dlcs, json_file, indent=4)
    logger.info(f"Missing DLCs JSON saved to {missing_dlcs_json_file_path}")
    
    # Write missing-dlcs.txt
    missing_dlcs_txt_file_path = os.path.join(data_directory, 'missing-dlcs.txt')
    with open(missing_dlcs_txt_file_path, 'w', encoding='utf-8') as txt_file:
        txt_file.write('\n'.join(missing_dlcs_txt_output))
    logger.info(f"Missing DLCs TXT saved to {missing_dlcs_txt_file_path}")

# Main function to find and save missing DLCs
def main():
    # Define the current directory and output directory
    current_directory = os.path.dirname(os.path.abspath(__file__))
    data_directory = os.path.join(current_directory, 'data')
    os.makedirs(data_directory, exist_ok=True)

    # Find missing DLCs
    find_missing_dlcs_with_base_names(data_directory)

# Run the main function
if __name__ == "__main__":
    main()
