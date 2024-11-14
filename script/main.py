import os
import subprocess
import sys
import shutil
import json
from datetime import datetime
from dotenv import load_dotenv  # Import dotenv to load environment variables

# Load environment variables from .env file
load_dotenv()

# Get Git username and email from environment variables
git_user_name = os.getenv('GIT_USER_NAME', 'Default Name')
git_user_email = os.getenv('GIT_USER_EMAIL', 'default_email@example.com')

# Define the current directory and dynamically locate the Git repository root
current_directory = os.path.dirname(os.path.abspath(__file__))
git_repo_path = os.path.abspath(os.path.join(current_directory, '..'))
data_directory = os.path.join(current_directory, 'data')
git_data_directory = os.path.join(git_repo_path, 'data')

# Set PYTHONIOENCODING to utf-8 to ensure UTF-8 encoding for all scripts
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Function to run a script and capture its output
def run_script(script_name):
    try:
        print(f"\nRunning {script_name}...")
        result = subprocess.run(
            ['python', os.path.join(current_directory, script_name)],
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

# Function to count entries in JSON files
def count_entries_in_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return len(data)
    except FileNotFoundError:
        return 0
    except json.JSONDecodeError:
        print(f"Error reading JSON from {file_path}")
        return 0

# List of scripts to run
scripts = ['list.py', 'check_titles.py', 'check_updates.py', 'check_dlcs.py']

# Execute each script in order
for script in scripts:
    run_script(script)

print("\nAll scripts executed successfully.")

# Get counts of entries before committing changes
before_update_count = count_entries_in_json(os.path.join(data_directory, 'missing-updates.json'))
before_titles_count = count_entries_in_json(os.path.join(data_directory, 'missing-titles.json'))
before_dlcs_count = count_entries_in_json(os.path.join(data_directory, 'missing-dlcs.json'))

# Prepare commit message with a simplified summary
commit_message = (
    f"Update data files on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    f"Current content count:\n"
    f"missing-updates.json: {before_update_count} entries\n"
    f"missing-titles.json: {before_titles_count} entries\n"
    f"missing-dlcs.json: {before_dlcs_count} entries\n"
)

# Function to set Git username and email if needed
def set_git_config():
    try:
        subprocess.run(['git', '-C', git_repo_path, 'config', 'user.name', git_user_name], check=True)
        subprocess.run(['git', '-C', git_repo_path, 'config', 'user.email', git_user_email], check=True)
        print(f"\nGit username ({git_user_name}) and email ({git_user_email}) configured.")
    except subprocess.CalledProcessError as e:
        print(f"Error setting Git configuration: {e.stderr}")
        sys.exit(1)

# Function to check if there are changes in the Git repository
def check_for_changes():
    try:
        # Run 'git status' to check for changes in the specified git repository path
        result = subprocess.run(
            ['git', '-C', git_repo_path, 'status', '--porcelain', git_data_directory],
            capture_output=True,
            text=True,
            check=True
        )
        # If there is output, there are changes
        return bool(result.stdout.strip())
    except subprocess.CalledProcessError as e:
        print(f"Error checking for changes: {e.stderr}")
        sys.exit(1)

# Function to push changes to GitHub using SSH
def push_changes_ssh():
    try:
        # Add modified files to the git staging area
        subprocess.run(['git', '-C', git_repo_path, 'add', 'data'], check=True)
        # Commit the changes with a detailed message
        subprocess.run(['git', '-C', git_repo_path, 'commit', '-m', commit_message], check=True)
        # Push the changes to the remote repository using SSH
        subprocess.run(['git', '-C', git_repo_path, 'push', 'origin', 'main'], check=True)
        print("\nChanges pushed to GitHub successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error pushing changes to GitHub: {e.stderr}")
        sys.exit(1)

# Check for changes and push if there are any
if check_for_changes():
    print("\nChanges detected in the data directory. Pushing to GitHub...")
    set_git_config()
    push_changes_ssh()
else:
    print("\nNo changes detected in the data directory. No push needed.")
