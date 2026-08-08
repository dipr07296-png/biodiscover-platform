"""
WSGI entry point for production deployment (Render, Gunicorn).
Run from the backend/ directory.
"""
import sys
import os

# Ensure backend/ is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
