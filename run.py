"""Development launcher - run from project root."""
import sys
import os

BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, BACKEND_DIR)

from app import create_app

if __name__ == "__main__":
    app = create_app()
    print("\n" + "="*60)
    print("  Drug Discovery + Bioinformatics Platform")
    print("  http://localhost:5000")
    print("="*60 + "\n")
    app.run(debug=True, port=5000, host="0.0.0.0", use_reloader=False)
