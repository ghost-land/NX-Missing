import json
import os
import logging

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

# Function to find the base game name by searching for any TID that matches the first 12 characters + ends with '000'
def find_base_game_name(base_tid_start, titles_db):
    for tid, details in titles_db.items():
        if tid.startswith(base_tid_start) and tid.endswith('000'):
            return details.get('Title Name', 'Unknown Base Game')
    return 'Unknown Base Game'

# Function to find missing DLCs by comparing titles_db.json with working.txt
def find_missing_dlcs_with_base_names(data_directory):
    # Load titles_db.json
    json_file_path = os.path.join(data_directory, 'titles_db.json')
    with open(json_file_path, 'r', encoding='utf-8') as json_file:
        titles_db = json.load(json_file)
    
    # Load working.txt
    working_txt_path = os.path.join(data_directory, 'working.txt')
    with open(working_txt_path, 'r', encoding='utf-8') as txt_file:
        working_titles = set(line.strip() for line in txt_file)
    
    # Find missing DLCs (titles that do not end with '000' or '800')
    missing_dlcs = {}
    missing_dlcs_txt_output = []
    
    for title_id, details in titles_db.items():
        if not title_id.endswith(('000', '800')) and title_id not in working_titles:
            # Determine base game TID start
            base_tid_start = title_id[:12]
            base_game_name = find_base_game_name(base_tid_start, titles_db)

            missing_dlcs[title_id] = {
                "Release Date": details.get("Release Date"),
                "Title Name": details.get("Title Name"),
                "Base Game": base_game_name,
                "size": details.get("size")
            }
            missing_dlcs_txt_output.append(
                f"{title_id}|{details['Release Date']}|{details['Title Name']}|{base_game_name}|{details['size']}"
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
