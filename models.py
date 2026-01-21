"""SQLAlchemy models for Therapy Chatbot."""
from datetime import datetime, date
import json

from db import db


class User(db.Model):
    """Authenticated user (Firebase-backed)."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    firebase_uid = db.Column(db.String(255), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255))
    display_name = db.Column(db.String(255))
    preferred_language = db.Column(db.String(10), default="en")
    therapy_preferences_json = db.Column(db.Text, default="{}")
    notification_prefs_json = db.Column(db.Text, default="{}")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "firebase_uid": self.firebase_uid,
            "email": self.email,
            "display_name": self.display_name,
            "preferred_language": self.preferred_language,
            "therapy_preferences": json.loads(self.therapy_preferences_json or "{}"),
            "notification_prefs": json.loads(self.notification_prefs_json or "{}"),
            "created_at": self.created_at.isoformat(),
        }


class MoodEntry(db.Model):
    """User mood check-in tracker."""
    __tablename__ = "mood_entries"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True)
    session_id = db.Column(db.String(255), index=True)
    mood_score = db.Column(db.Integer, nullable=False)
    tags_json = db.Column(db.Text, default="[]")
    note = db.Column(db.Text)
    entry_date = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "mood_score": self.mood_score,
            "tags": json.loads(self.tags_json) if self.tags_json else [],
            "note": self.note,
            "entry_date": self.entry_date.isoformat() if self.entry_date else None,
            "created_at": self.created_at.isoformat(),
        }


class ChatSession(db.Model):
    """Chat session container."""
    __tablename__ = "chat_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True)
    session_id = db.Column(db.String(255), index=True)
    title = db.Column(db.String(255), default="Untitled Chat")
    tags_json = db.Column(db.Text, default="[]")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = db.Column(db.DateTime)

    messages = db.relationship(
        "ChatMessage", backref="session", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "tags": json.loads(self.tags_json) if self.tags_json else [],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_message_at": self.last_message_at.isoformat() if self.last_message_at else None,
            "message_count": len(self.messages),
        }


class ChatMessage(db.Model):
    """Individual chat message."""
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    chat_session_id = db.Column(
        db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False
    )
    role = db.Column(db.String(10), nullable=False)
    content = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(10), default="en")
    safety_flags_json = db.Column(db.Text, default="[]")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "language": self.language,
            "safety_flags": json.loads(self.safety_flags_json or "[]"),
            "created_at": self.created_at.isoformat(),
        }


class TherapyProfile(db.Model):
    """User's therapy intake profile."""
    __tablename__ = "therapy_profile"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, index=True)
    session_id = db.Column(db.String(255), unique=True, index=True)
    main_concern = db.Column(db.String(255), nullable=False)
    concern_extra = db.Column(db.Text)
    approach = db.Column(db.String(50), nullable=False)
    goals = db.Column(db.Text, nullable=False)
    minutes_per_day = db.Column(db.Integer, default=10)
    primary_goals = db.Column(db.Text)
    preferred_approaches = db.Column(db.Text)
    frequency_preference = db.Column(db.String(50))
    focus_areas_json = db.Column(db.Text, default="[]")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "main_concern": self.main_concern,
            "concern_extra": self.concern_extra,
            "approach": self.approach,
            "goals": self.goals,
            "minutes_per_day": self.minutes_per_day,
            "primary_goals": self.primary_goals,
            "preferred_approaches": self.preferred_approaches,
            "frequency_preference": self.frequency_preference,
            "focus_areas": json.loads(self.focus_areas_json or "[]"),
            "updated_at": self.updated_at.isoformat(),
        }


class TherapyPlan(db.Model):
    """Generated therapy plan."""
    __tablename__ = "therapy_plan"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True)
    session_id = db.Column(db.String(255), index=True)
    plan_json = db.Column(db.Text, nullable=False)
    completed_items_json = db.Column(db.Text, default="[]")
    version = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "plan": json.loads(self.plan_json) if self.plan_json else {},
            "completed_items": json.loads(self.completed_items_json or "[]"),
            "version": self.version,
            "created_at": self.created_at.isoformat(),
        }


class ContactMessage(db.Model):
    """User contact form submission."""
    __tablename__ = "contact_messages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True)
    session_id = db.Column(db.String(255), index=True)
    name = db.Column(db.String(255))
    email = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "category": self.category,
            "message": self.message,
            "created_at": self.created_at.isoformat(),
        }


class ExerciseCompletion(db.Model):
    """Tracks completed exercises for streaks and history."""
    __tablename__ = "exercise_completions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True)
    session_id = db.Column(db.String(255), index=True)
    exercise_slug = db.Column(db.String(100), nullable=False)
    completion_date = db.Column(db.Date, default=date.today)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "exercise_slug": self.exercise_slug,
            "completion_date": self.completion_date.isoformat()
            if self.completion_date
            else None,
            "completed_at": self.completed_at.isoformat(),
        }
