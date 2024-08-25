import os
import subprocess
import sys
import shutil
import json

# Define the current directory and data directory
current_directory = os.path.dirname(os.path.abspath(__file__))
data_directory = os.path.join(current_directory, 'data')

# Define the path to the local Git repository and its data directory
git_repo_path = "D:/github/ghost-land/nx-missing-website"
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

# Function to copy files from one directory to another
def copy_files(src_directory, dest_directory):
    try:
        if os.path.exists(dest_directory):
            shutil.rmtree(dest_directory)  # Remove the existing directory
        shutil.copytree(src_directory, dest_directory)  # Copy the entire directory
        print(f"\nCopied files from {src_directory} to {dest_directory}.")
    except Exception as e:
        print(f"Error copying files: {e}")
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

# Get counts of entries before copying
before_update_count = count_entries_in_json(os.path.join(data_directory, 'missing-updates.json'))
before_titles_count = count_entries_in_json(os.path.join(data_directory, 'missing-titles.json'))
before_dlcs_count = count_entries_in_json(os.path.join(data_directory, 'missing-dlcs.json'))

# Copy files from the local data directory to the Git repository data directory
copy_files(data_directory, git_data_directory)

# Get counts of entries after copying
after_update_count = count_entries_in_json(os.path.join(git_data_directory, 'missing-updates.json'))
after_titles_count = count_entries_in_json(os.path.join(git_data_directory, 'missing-titles.json'))
after_dlcs_count = count_entries_in_json(os.path.join(git_data_directory, 'missing-dlcs.json'))

# Calculate the difference in counts
update_diff = after_update_count - before_update_count
titles_diff = after_titles_count - before_titles_count
dlcs_diff = after_dlcs_count - before_dlcs_count

# Prepare commit message with summary
commit_message = (
    f"Update data files\n\n"
    f"missing-updates.json: {update_diff} changes\n"
    f"missing-titles.json: {titles_diff} changes\n"
    f"missing-dlcs.json: {dlcs_diff} changes\n"
)

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

# Function to push changes to GitHub
def push_changes():
    try:
        # Add modified files to the git staging area
        subprocess.run(['git', '-C', git_repo_path, 'add', 'data'], check=True)
        # Commit the changes with a detailed message
        subprocess.run(['git', '-C', git_repo_path, 'commit', '-m', commit_message], check=True)
        # Push the changes to the remote repository
        subprocess.run(['git', '-C', git_repo_path, 'push'], check=True)
        print("\nChanges pushed to GitHub successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error pushing changes to GitHub: {e.stderr}")
        sys.exit(1)

# Check for changes and push if there are any
if check_for_changes():
    print("\nChanges detected in the data directory. Pushing to GitHub...")
    push_changes()
else:
    print("\nNo changes detected in the data directory. No push needed.")
