import os
import json
import requests
from datetime import datetime

with open('config.json') as config_file:
    config = json.load(config_file)

def download_jsons():
    data_dir = 'data'
    os.makedirs(data_dir, exist_ok=True)
    last_updated_filepath = os.path.join(data_dir, 'last-updated.json')
    
    if os.path.exists(last_updated_filepath):
        with open(last_updated_filepath, 'r', encoding='utf-8') as f:
            last_updated = json.load(f)
    else:
        last_updated = {key: {} for key in config['urls']}
    
    all_json_data = {
        "last_updated": last_updated,
    }
    
    for key, url in config['urls'].items():
        filepath = os.path.join(data_dir, f"{key}.json")  # Define filepath here
        response = requests.get(url)
        if response.status_code == 200:
            try:
                json_data = response.json()
                all_json_data[key] = json_data
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(json_data, f, ensure_ascii=False, indent=2)
                print(f"Downloaded and validated {key}.json")
                last_updated[key] = {
                    'last_successful_timestamp': datetime.now().isoformat(),
                    'timestamp': datetime.now().isoformat(),
                    'success': True,
                }
            except json.JSONDecodeError:
                print(f"Failed to download {key}: Invalid JSON")
                last_updated[key]['timestamp'] = datetime.now().isoformat()
                last_updated[key]['success'] = False
        else:
            print(f"Failed to download {key}: HTTP status {response.status_code}")
            last_updated[key]['timestamp'] = datetime.now().isoformat()
            last_updated[key]['success'] = False
            
        if not last_updated[key].get('success'):  # Check for failure
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    all_json_data[key] = json.load(f)
    
    with open(last_updated_filepath, 'w', encoding='utf-8') as f:
        json.dump(last_updated, f, ensure_ascii=False, indent=2)
    
    return all_json_data
