"""
GitHub Auto-Deploy Script
Creates a GitHub repo and pushes all project files using the GitHub REST API.
No git CLI required!

Usage:
    python github_push.py --token YOUR_TOKEN --username YOUR_USERNAME

Get your token at: https://github.com/settings/tokens
  Required scopes: repo, workflow
"""

import os
import sys
import json
import base64
import argparse
import requests
from pathlib import Path

# ---- Files to exclude from push ----
EXCLUDE_DIRS  = {".git", "__pycache__", ".venv", "venv", "env", ".eggs", "*.egg-info"}
EXCLUDE_FILES = {"database.db", "*.db", "*.sqlite3", ".env"}

def should_exclude(path: Path) -> bool:
    for part in path.parts:
        if part in EXCLUDE_DIRS or part.endswith(".egg-info"):
            return True
    if path.name in EXCLUDE_FILES or path.suffix in {".db", ".sqlite3", ".pyc", ".pyo"}:
        return True
    return False


def read_file_b64(filepath: Path) -> str:
    with open(filepath, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def push_to_github(token: str, username: str, repo_name: str, project_dir: Path):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    api = "https://api.github.com"

    # ---- 1. Create repository ----
    print(f"\n🔧 Creating GitHub repository '{repo_name}'...")
    r = requests.post(f"{api}/user/repos", headers=headers, json={
        "name": repo_name,
        "description": "Drug Discovery + Bioinformatics Platform — Flask · Biopython · Three.js · Chart.js",
        "private": False,
        "auto_init": False,
    })
    if r.status_code == 201:
        print(f"✅ Repository created: https://github.com/{username}/{repo_name}")
    elif r.status_code == 422:
        print(f"ℹ️  Repository already exists, continuing...")
    else:
        print(f"❌ Failed to create repo: {r.status_code} — {r.json()}")
        return False

    # ---- 2. Get all files ----
    all_files = []
    for filepath in project_dir.rglob("*"):
        if filepath.is_file() and not should_exclude(filepath):
            rel = filepath.relative_to(project_dir)
            all_files.append((str(rel).replace("\\", "/"), filepath))

    print(f"\n📦 Uploading {len(all_files)} files to GitHub...")

    # ---- 3. Push files one by one ----
    success = 0
    failed = 0
    for rel_path, abs_path in all_files:
        try:
            content_b64 = read_file_b64(abs_path)
            url = f"{api}/repos/{username}/{repo_name}/contents/{rel_path}"

            # Check if file exists (to get its SHA for update)
            existing = requests.get(url, headers=headers)
            sha = existing.json().get("sha") if existing.status_code == 200 else None

            payload = {
                "message": f"Add {rel_path}",
                "content": content_b64,
            }
            if sha:
                payload["sha"] = sha

            r = requests.put(url, headers=headers, json=payload)
            if r.status_code in (200, 201):
                print(f"  ✓ {rel_path}")
                success += 1
            else:
                print(f"  ✗ {rel_path}: {r.status_code}")
                failed += 1
        except Exception as e:
            print(f"  ✗ {rel_path}: {e}")
            failed += 1

    print(f"\n{'='*50}")
    print(f"✅ Done! {success} files uploaded, {failed} failed.")
    print(f"\n🔗 Repository: https://github.com/{username}/{repo_name}")
    print(f"\n🚀 Next Steps:")
    print(f"  1. Deploy to Render: https://render.com")
    print(f"     → New Web Service → GitHub → {repo_name}")
    print(f"     → Root dir: backend | Start: gunicorn wsgi:app --bind 0.0.0.0:$PORT")
    print(f"  2. Deploy to Netlify: https://netlify.com")
    print(f"     → Import from GitHub → Publish dir: frontend")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Push BioDiscover to GitHub")
    parser.add_argument("--token", required=True, help="GitHub Personal Access Token")
    parser.add_argument("--username", required=True, help="GitHub username")
    parser.add_argument("--repo", default="biodiscover-platform", help="Repository name")
    args = parser.parse_args()

    project_dir = Path(__file__).parent
    push_to_github(args.token, args.username, args.repo, project_dir)
