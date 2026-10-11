import json
import time
from pathlib import Path
from typing import List, Dict, Any
from app.config import settings

HISTORY_FILE = settings.STORAGE_DIR / "query_history.json"

class HistoryManager:
    def __init__(self):
        self.history: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if HISTORY_FILE.exists():
            try:
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    self.history = json.load(f)
            except Exception:
                self.history = []

    def _save(self):
        try:
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(self.history, f, indent=2)
        except Exception:
            pass

    def add_entry(self, entry: Dict[str, Any]):
        entry["id"] = f"HIST-{int(time.time() * 1000)}"
        entry["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
        self.history.insert(0, entry)
        # Keep last 100 entries
        if len(self.history) > 100:
            self.history = self.history[:100]
        self._save()

    def get_entries(self) -> List[Dict[str, Any]]:
        return self.history

    def clear(self):
        self.history = []
        self._save()

history_manager = HistoryManager()
