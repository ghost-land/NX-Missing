import os
import subprocess
import sys
import json
from datetime import datetime

# Define the current directory and the unique data directory
current_directory = os.path.dirname(os.path.abspath(__file__))
data_directory = os.path.abspath(os.path.join(current_directory, './../data'))

# Ensure the data directory exists
if not os.path.exists(data_directory):
    print(f"Directory {data_directory} does not exist. Please create it and try again.")
    sys.exit(1)

# Function to run a script and capture its output
def run_script(script_name):
    python_path = os.path.join(current_directory, "env/bin/python")
    try:
        print(f"\nRunning {script_name}...")
        result = subprocess.run(
            [python_path, os.path.join(current_directory, script_name)],
            capture_output=True,
            text=True,
            check=True,
            encoding='utf-8',
            errors='replace'
        )
        print(f"Output of {script_name}:\n{result.stdout}")
    except subprocess.CalledProcessError as e:
        print(f"Error running {script_name}:\n{e.stderr}")
        sys.exit(1)

# Function to count entries in TXT files
def count_entries_in_txt(file_path):
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        return 0
    with open(file_path, 'r') as f:
        return sum(1 for line in f if line.strip())
    
# Function to count entries in JSON files
def count_entries_in_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            entry_count = len(data)
            print(f"File {file_path} contains {entry_count} entries.")
            return entry_count
    except FileNotFoundError:
        print(f"File {file_path} not found.")
        return 0
    except json.JSONDecodeError as e:
        print(f"Error reading JSON from {file_path}: {e}")
        return 0

# List of scripts to run
scripts = ['list.py', 'check_titles.py', 'check_updates.py', 'check_dlcs.py']

# Execute each script in order
for script in scripts:
    run_script(script)

print("\nAll scripts executed successfully.")

# Get counts of entries
updates_count = count_entries_in_json(os.path.join(data_directory, 'missing-updates.json'))
titles_count = count_entries_in_json(os.path.join(data_directory, 'missing-titles.json'))
dlcs_count = count_entries_in_json(os.path.join(data_directory, 'missing-dlcs.json'))
working_count = count_entries_in_txt(os.path.join(data_directory, 'working.txt'))

# Calculate total entries
total_entries = updates_count + titles_count + dlcs_count

# Prepare commit message
commit_message = (
    f"Update data files on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    f"Current content count:\n"
    f"missing updates: {updates_count} entries\n"
    f"missing titles: {titles_count} entries\n"
    f"missing dlcs: {dlcs_count} entries\n"
    f"Total Missing Content: {total_entries} entries\n"
    f"Total Working Content: {working_count} entries\n"
)

# Function to push changes to GitHub using SSH
def push_changes():
    try:
        # Add modified files to the git staging area
        subprocess.run(['git', '-C', current_directory, 'add', data_directory], check=True)
        # Commit the changes with a detailed message
        subprocess.run(['git', '-C', current_directory, 'commit', '-m', commit_message], check=True)
        # Push the changes to the remote repository using SSH
        subprocess.run(['git', '-C', current_directory, 'push', 'origin', 'master'], check=True)
        print("\nChanges pushed to GitHub successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error pushing changes to GitHub: {e.stderr}")
        sys.exit(1)

# Check for changes and push if there are any
print("\nChecking for changes in the data directory...")
try:
    result = subprocess.run(
        ['git', '-C', current_directory, 'status', '--porcelain', data_directory],
        capture_output=True,
        text=True,
        check=True
    )
    if result.stdout.strip():
        print("\nChanges detected. Pushing to GitHub...")
        push_changes()
    else:
        print("\nNo changes detected. No push needed.")
except subprocess.CalledProcessError as e:
    print(f"Error checking for changes: {e.stderr}")
    sys.exit(1)
