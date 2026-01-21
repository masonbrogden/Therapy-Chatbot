"""Reset the local SQLite database (dev only)."""
import os
from pathlib import Path

from app import app
from db import db


def main():
    instance_dir = Path(__file__).resolve().parents[1] / "instance"
    db_path = instance_dir / "therapy_chatbot.db"

    if db_path.exists():
        backup_path = instance_dir / "therapy_chatbot.db.bak"
        db_path.replace(backup_path)
        print(f"Backed up existing DB to {backup_path}")

    with app.app_context():
        db.create_all()

    print("Database initialized.")


if __name__ == "__main__":
    main()
