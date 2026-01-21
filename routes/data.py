"""Data export and deletion routes."""
from datetime import datetime

from flask import Blueprint, jsonify, g
from db import db
from models import (
    MoodEntry,
    ChatSession,
    ChatMessage,
    ContactMessage,
    TherapyProfile,
    TherapyPlan,
    ExerciseCompletion,
)
from services.auth import require_auth

data_bp = Blueprint("data", __name__, url_prefix="/api")


@data_bp.route("/export", methods=["GET"])
@require_auth
def export_user_data():
    """Export all user data as JSON."""
    mood_entries = MoodEntry.query.filter_by(user_id=g.current_user.id).all()
    chat_sessions = ChatSession.query.filter_by(user_id=g.current_user.id).all()
    contact_messages = ContactMessage.query.filter_by(user_id=g.current_user.id).all()
    profile = TherapyProfile.query.filter_by(user_id=g.current_user.id).first()
    latest_plan = (
        TherapyPlan.query.filter_by(user_id=g.current_user.id)
        .order_by(TherapyPlan.created_at.desc())
        .first()
    )
    exercise_completions = ExerciseCompletion.query.filter_by(
        user_id=g.current_user.id
    ).all()

    chat_data = []
    for cs in chat_sessions:
        messages = ChatMessage.query.filter_by(chat_session_id=cs.id).all()
        chat_data.append(
            {"session": cs.to_dict(), "messages": [m.to_dict() for m in messages]}
        )

    export_data = {
        "exported_at": datetime.utcnow().isoformat(),
        "user_id": g.current_user.id,
        "mood_entries": [m.to_dict() for m in mood_entries],
        "chat_data": chat_data,
        "contact_messages": [c.to_dict() for c in contact_messages],
        "therapy_profile": profile.to_dict() if profile else None,
        "latest_plan": latest_plan.to_dict() if latest_plan else None,
        "exercise_completions": [e.to_dict() for e in exercise_completions],
    }

    return jsonify(export_data), 200


@data_bp.route("/data", methods=["DELETE"])
@require_auth
def delete_all_user_data():
    """Delete ALL user data."""
    chat_sessions = ChatSession.query.filter_by(user_id=g.current_user.id).all()
    chat_session_ids = [cs.id for cs in chat_sessions]

    for chat_session_id in chat_session_ids:
        ChatMessage.query.filter_by(chat_session_id=chat_session_id).delete()

    ChatSession.query.filter_by(user_id=g.current_user.id).delete()
    MoodEntry.query.filter_by(user_id=g.current_user.id).delete()
    ContactMessage.query.filter_by(user_id=g.current_user.id).delete()
    TherapyProfile.query.filter_by(user_id=g.current_user.id).delete()
    TherapyPlan.query.filter_by(user_id=g.current_user.id).delete()
    ExerciseCompletion.query.filter_by(user_id=g.current_user.id).delete()

    db.session.commit()
    return jsonify({"message": "All user data deleted successfully"}), 200
