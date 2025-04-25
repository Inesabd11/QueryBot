import json
import os
import sys
from pathlib import Path
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config.paths import STORAGE_DIR

# Ensure storage directory exists
os.makedirs(STORAGE_DIR, exist_ok=True)
#print(f"Storage directory: {STORAGE_DIR}")

#Chat history file
HISTORY_FILE = Path(STORAGE_DIR) / "chat_history.json"

def load_history():
    """
    upload chat history file
    """
    if os.path.exists(HISTORY_FILE):
        with open (HISTORY_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                return[] # Empty file → return empty list
            try: 
                return json.loads(content) # Try to parse JSON
            except json.JSONDecodeError:
                return[] # Invalid JSON → return empty list
    return []

def save_message(role, message):
    """
    save a new message in chat
    """
    history = load_history()
    history.append({
        "role": role,
        "message": message,
        "timestamp": datetime.now().isoformat()
    })
    with open (HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)
        
def clear_history():
    """
    delete chat history (optional)
    """
    if os.path.exists(HISTORY_FILE):
        os.remove(HISTORY_FILE)