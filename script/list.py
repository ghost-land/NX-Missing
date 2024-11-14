import os
import re
import json
import threading
import asyncio
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Récupérer le chemin du dossier depuis le .env
folder_path = os.getenv('FOLDER_PATH')
if not folder_path:
    raise ValueError("FOLDER_PATH is not set in the .env file.")

# Regex pattern
pattern = re.compile(r'^(?P<game_name>.+?) (?:[\[\(].*?[\]\)])*\[(?P<titleid>[0-9A-Fa-f]+)\]\[v(?P<version>\d+)\]\.(?P<type>nsp|nsz|xci|xcz)$')

# Initialize data structures for txt and json
txt_content = []
json_content = {}
lock = threading.Lock()

# Function to process a single file
def process_file(file_path, filename):
    match = pattern.match(filename)
    if match:
        game_name = match.group('game_name')
        titleid = match.group('titleid')
        version = match.group('version')
        
        # Get file size with error handling
        try:
            file_size = os.path.getsize(file_path)
        except FileNotFoundError:
            print(f"Error: File not found or inaccessible: {file_path}")
            return
        except OSError as e:
            print(f"Error: OS error occurred for file {file_path}: {e}")
            return
        
        # Add to txt content
        with lock:
            txt_content.append(f"{titleid}|{int(version)}")
        
        # Add to json content
        with lock:
            json_content[titleid] = {
                "Game Name": game_name,
                "Version": version,
                "Size": file_size
            }
        
        # Print file processing info
        print(f"Processed {filename}: ID = {titleid}, Version = {version}, Size = {file_size} bytes")

# Async function to walk through directories and process files
async def walk_and_process():
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        tasks = []
        for root, dirs, files in os.walk(folder_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                # Only process files that match the specified pattern
                if pattern.match(filename):
                    tasks.append(loop.run_in_executor(executor, process_file, file_path, filename))
        await asyncio.gather(*tasks)

# Main function to run the script
async def main():
    print(f"Starting to scan files in folder {folder_path}...")
    await walk_and_process()

    # Define the current directory (same as the script)
    current_directory = os.path.dirname(os.path.abspath(__file__))

    # Create the 'data' directory if it doesn't exist
    data_directory = os.path.join(current_directory, './../data')
    os.makedirs(data_directory, exist_ok=True)

    # Write working.txt file
    txt_file_path = os.path.join(data_directory, 'working.txt')
    with open(txt_file_path, 'w') as txt_file:
        txt_file.write('\n'.join(txt_content))
    print(f"File {txt_file_path} generated successfully.")

    # Write working.json file
    json_file_path = os.path.join(data_directory, 'working.json')
    with open(json_file_path, 'w') as json_file:
        json.dump(json_content, json_file, indent=4)
    print(f"File {json_file_path} generated successfully.")

    print("Processing complete.")

# Run the main function
asyncio.run(main())
