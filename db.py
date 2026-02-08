"""SQLAlchemy database initialization and configuration."""
from flask_sqlalchemy import SQLAlchemy
import os
from pathlib import Path
from sqlalchemy import text

db = SQLAlchemy()


def init_db(app):
    """Initialize database with Flask app."""
    # Ensure instance directory exists
    instance_dir = Path(__file__).resolve().parent / 'instance'
    instance_dir.mkdir(parents=True, exist_ok=True)
    db_path = (instance_dir / 'therapy_chatbot.db').resolve()
    database_url = os.getenv('DATABASE_URL') or app.config.get('SQLALCHEMY_DATABASE_URI')
    is_production = os.getenv("FLASK_ENV") == "production" or os.getenv("ENV") == "production"
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    if not database_url or database_url.startswith('sqlite:///instance/'):
        if is_production:
            raise RuntimeError("DATABASE_URL is required in production.")
        database_url = f"sqlite:///{db_path.as_posix()}"
    elif database_url.startswith('sqlite:///'):
        sqlite_path = database_url.replace('sqlite:///', '', 1)
        if not os.path.isabs(sqlite_path):
            if is_production:
                raise RuntimeError("DATABASE_URL must be set to Postgres in production.")
            database_url = f"sqlite:///{db_path.as_posix()}"
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
