"""SQLAlchemy database initialization and configuration."""
from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()


def init_db(app):
    """Initialize database with Flask app."""
    # Ensure instance directory exists
    instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
    os.makedirs(instance_dir, exist_ok=True)
    
    db_path = os.path.join(instance_dir, 'therapy_chatbot.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL',
        f'sqlite:///{db_path}'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
