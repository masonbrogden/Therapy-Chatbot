"""Data export and deletion routes."""
from datetime import datetime

from flask import Blueprint, jsonify, request
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
from services.auth import get_current_user

data_bp = Blueprint("data", __name__, url_prefix="/api")


@data_bp.route("/export", methods=["GET"])
def export_user_data():
    """Export all user data as JSON."""
    session_id = request.args.get("session_id")
    user = get_current_user()
    if not user and not session_id:
        return jsonify({"error": "session_id required"}), 400

    mood_entries = (
        MoodEntry.query.filter_by(user_id=user.id).all()
        if user
        else MoodEntry.query.filter_by(session_id=session_id).all()
    )
    chat_sessions = (
        ChatSession.query.filter_by(user_id=user.id).all()
        if user
        else ChatSession.query.filter_by(session_id=session_id).all()
    )
    contact_messages = (
        ContactMessage.query.filter_by(user_id=user.id).all()
        if user
        else ContactMessage.query.filter_by(session_id=session_id).all()
    )
    profile = (
        TherapyProfile.query.filter_by(user_id=user.id).first()
        if user
        else TherapyProfile.query.filter_by(session_id=session_id).first()
    )
    latest_plan = (
        TherapyPlan.query.filter_by(user_id=user.id)
        .order_by(TherapyPlan.created_at.desc())
        .first()
        if user
        else TherapyPlan.query.filter_by(session_id=session_id)
        .order_by(TherapyPlan.created_at.desc())
        .first()
    )
    exercise_completions = (
        ExerciseCompletion.query.filter_by(user_id=user.id).all()
        if user
        else ExerciseCompletion.query.filter_by(session_id=session_id).all()
    )

    chat_data = []
    for cs in chat_sessions:
        messages = ChatMessage.query.filter_by(chat_session_id=cs.id).all()
        chat_data.append(
            {"session": cs.to_dict(), "messages": [m.to_dict() for m in messages]}
        )

    export_data = {
        "exported_at": datetime.utcnow().isoformat(),
        "user_id": user.id if user else None,
        "session_id": session_id,
        "mood_entries": [m.to_dict() for m in mood_entries],
        "chat_data": chat_data,
        "contact_messages": [c.to_dict() for c in contact_messages],
        "therapy_profile": profile.to_dict() if profile else None,
        "latest_plan": latest_plan.to_dict() if latest_plan else None,
        "exercise_completions": [e.to_dict() for e in exercise_completions],
    }

    return jsonify(export_data), 200


@data_bp.route("/data", methods=["DELETE"])
def delete_all_user_data():
    """Delete ALL user data."""
    session_id = request.args.get("session_id")
    user = get_current_user()
    if not user and not session_id:
        return jsonify({"error": "session_id required"}), 400

    chat_sessions = (
        ChatSession.query.filter_by(user_id=user.id).all()
        if user
        else ChatSession.query.filter_by(session_id=session_id).all()
    )
    chat_session_ids = [cs.id for cs in chat_sessions]

    for chat_session_id in chat_session_ids:
        ChatMessage.query.filter_by(chat_session_id=chat_session_id).delete()

    if user:
        ChatSession.query.filter_by(user_id=user.id).delete()
        MoodEntry.query.filter_by(user_id=user.id).delete()
        ContactMessage.query.filter_by(user_id=user.id).delete()
        TherapyProfile.query.filter_by(user_id=user.id).delete()
        TherapyPlan.query.filter_by(user_id=user.id).delete()
        ExerciseCompletion.query.filter_by(user_id=user.id).delete()
    else:
        ChatSession.query.filter_by(session_id=session_id).delete()
        MoodEntry.query.filter_by(session_id=session_id).delete()
        ContactMessage.query.filter_by(session_id=session_id).delete()
        TherapyProfile.query.filter_by(session_id=session_id).delete()
        TherapyPlan.query.filter_by(session_id=session_id).delete()
        ExerciseCompletion.query.filter_by(session_id=session_id).delete()

    db.session.commit()
    return jsonify({"message": "All user data deleted successfully"}), 200
