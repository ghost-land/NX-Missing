import asyncio
import aiohttp
import json
import os
import logging
from concurrent.futures import ThreadPoolExecutor

# Define log format with colors for better visibility in the console
class CustomFormatter(logging.Formatter):
    """Logging Formatter to add colors and count warning / errors"""

    grey = "\x1b[38;21m"
    blue = "\x1b[38;5;39m"
    yellow = "\x1b[33;21m"
    red = "\x1b[31;21m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"
    format = "%(asctime)s - %(levelname)s - %(message)s"

    FORMATS = {
        logging.DEBUG: grey + format + reset,
        logging.INFO: blue + format + reset,
        logging.WARNING: yellow + format + reset,
        logging.ERROR: red + format + reset,
        logging.CRITICAL: bold_red + format + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()
logger.handlers[0].setFormatter(CustomFormatter())

# Base URL for fetching JSON files
base_url = "https://raw.githubusercontent.com/blawar/titledb/master/"

# List of JSON file endpoints
json_files = [
    "AR.en.json", "AR.es.json", "AT.de.json", "AU.en.json", "BE.fr.json", "BE.nl.json",
    "BG.en.json", "BR.en.json", "BR.pt.json", "CA.en.json", "CA.fr.json", "CH.de.json",
    "CH.fr.json", "CH.it.json", "CL.en.json", "CL.es.json", "CN.en.json", "CN.zh.json",
    "CO.en.json", "CO.es.json", "CY.en.json", "CZ.en.json", "DE.de.json", "DK.en.json",
    "EE.en.json", "ES.es.json", "FI.en.json", "FR.fr.json", "GB.en.json", "GR.en.json",
    "HK.zh.json", "HR.en.json", "HU.en.json", "IE.en.json", "IL.en.json", "IT.it.json",
    "JP.ja.json", "KR.ko.json", "LT.en.json", "LU.de.json", "LU.fr.json", "LV.en.json",
    "MT.en.json", "MX.en.json", "MX.es.json", "NL.nl.json", "NO.en.json", "NZ.en.json",
    "PE.en.json", "PE.es.json", "PL.en.json", "PT.pt.json", "RO.en.json", "RU.ru.json",
    "SE.en.json", "SI.en.json", "SK.en.json", "US.en.json", "US.es.json", "ZA.en.json"
]

# Output data structures
merged_data = {}
txt_output = []
lock = asyncio.Lock()

# Function to fetch and process each JSON file
async def fetch_and_process_json(session, url):
    async with session.get(url) as response:
        if response.status == 200:
            content_type = response.headers.get('Content-Type', '')
            if 'application/json' in content_type:
                try:
                    data = await response.json()
                except json.JSONDecodeError:
                    logger.warning(f"Failed to decode JSON from {url} - Skipping")
                    return
            elif 'text/plain' in content_type:
                try:
                    # Attempt to manually load JSON from the text content
                    text_data = await response.text()
                    data = json.loads(text_data)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse JSON from text/plain content at {url} - Skipping")
                    return
            else:
                logger.warning(f"Skipped {url} - Content-Type was {content_type}")
                return

            async with lock:
                for entry_id, details in data.items():
                    # Extract the required fields
                    title_id = details.get("id")
                    release_date = details.get("releaseDate")
                    title_name = details.get("name")
                    size = details.get("size")

                    # Avoid duplicates: only add if title_id is not already in merged_data
                    if title_id and title_id not in merged_data:
                        merged_data[title_id] = {
                            "Release Date": release_date,
                            "Title Name": title_name,
                            "size": size
                        }
                        txt_output.append(f"{title_id}|{release_date}|{title_name}|{size}")
                logger.info(f"Processed data from {url}")
        else:
            logger.error(f"Failed to fetch data from {url} - Status Code: {response.status}")

# Function to handle all JSON files asynchronously
async def process_all_files():
    async with aiohttp.ClientSession() as session:
        tasks = []
        for file in json_files:
            url = base_url + file
            logger.info(f"Processing: {url}")
            tasks.append(fetch_and_process_json(session, url))
        
        await asyncio.gather(*tasks)

# Function to find missing titles by comparing titles_db.json with working.txt
def find_missing_titles(data_directory):
    # Load titles_db.json
    json_file_path = os.path.join(data_directory, 'titles_db.json')
    with open(json_file_path, 'r', encoding='utf-8') as json_file:
        titles_db = json.load(json_file)
    
    # Load working.txt
    working_txt_path = os.path.join(data_directory, 'working.txt')
    with open(working_txt_path, 'r', encoding='utf-8') as txt_file:
        working_titles = set(line.strip() for line in txt_file)
    
    # Find missing titles that end with '000'
    missing_titles = {}
    missing_txt_output = []
    
    for title_id, details in titles_db.items():
        if title_id.endswith('000') and title_id not in working_titles:
            missing_titles[title_id] = {
                "Release Date": details.get("Release Date"),
                "Title Name": details.get("Title Name"),
                "size": details.get("size")
            }
            missing_txt_output.append(f"{title_id}|{details['Release Date']}|{details['Title Name']}|{details['size']}")
    
    # Write missing-titles.json
    missing_json_file_path = os.path.join(data_directory, 'missing-titles.json')
    with open(missing_json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(missing_titles, json_file, indent=4)
    logger.info(f"Missing JSON titles saved to {missing_json_file_path}")
    
    # Write missing-titles.txt
    missing_txt_file_path = os.path.join(data_directory, 'missing-titles.txt')
    with open(missing_txt_file_path, 'w', encoding='utf-8') as txt_file:
        txt_file.write('\n'.join(missing_txt_output))
    logger.info(f"Missing TXT titles saved to {missing_txt_file_path}")

# Main function to run the asynchronous tasks and save the results
async def main():
    await process_all_files()

    # Define the current directory and output directory
    current_directory = os.path.dirname(os.path.abspath(__file__))
    data_directory = os.path.join(current_directory, 'data')
    os.makedirs(data_directory, exist_ok=True)

    # Write the merged JSON output
    json_file_path = os.path.join(data_directory, 'titles_db.json')
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(merged_data, json_file, indent=4)
    logger.info(f"Merged JSON data saved to {json_file_path}")

    # Write the TXT output
    txt_file_path = os.path.join(data_directory, 'titles_db.txt')
    with open(txt_file_path, 'w', encoding='utf-8') as txt_file:
        txt_file.write('\n'.join(txt_output))
    logger.info(f"Merged TXT data saved to {txt_file_path}")
    
    # Find missing titles
    find_missing_titles(data_directory)

# Run the main function with threading to prevent blocking the main thread
if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(main())
