"""User profile and session attachment routes."""
import json

from flask import Blueprint, request, jsonify, g
from db import db
from models import (
    User,
    MoodEntry,
    ChatSession,
    TherapyProfile,
    TherapyPlan,
    ContactMessage,
    ExerciseCompletion,
)
from services.auth import require_auth, get_request_session_id

user_bp = Blueprint("user", __name__, url_prefix="/api/user")


@user_bp.route("/profile", methods=["GET"])
@require_auth
def get_user_profile():
    """Return the current user's profile."""
    return jsonify(g.current_user.to_dict()), 200


@user_bp.route("/profile", methods=["PUT"])
@require_auth
def update_user_profile():
    """Update user profile details."""
    data = request.get_json() or {}
    name = data.get("display_name")
    preferred_language = data.get("preferred_language")
    therapy_preferences = data.get("therapy_preferences")
    notification_prefs = data.get("notification_prefs")

    if name:
        g.current_user.display_name = name
    if preferred_language:
        g.current_user.preferred_language = preferred_language
    if therapy_preferences is not None:
        g.current_user.therapy_preferences_json = json.dumps(therapy_preferences)
    if notification_prefs is not None:
        g.current_user.notification_prefs_json = json.dumps(notification_prefs)

    db.session.commit()
    return jsonify(g.current_user.to_dict()), 200


@user_bp.route("/attach-session", methods=["POST"])
@require_auth
def attach_session():
    """Attach anonymous session data to the authenticated user."""
    session_id = get_request_session_id()
    if not session_id:
        return jsonify({"error": "session_id required"}), 400

    MoodEntry.query.filter_by(session_id=session_id, user_id=None).update(
        {"user_id": g.current_user.id}
    )
    ChatSession.query.filter_by(session_id=session_id, user_id=None).update(
        {"user_id": g.current_user.id}
    )
    TherapyProfile.query.filter_by(session_id=session_id, user_id=None).update(
        {"user_id": g.current_user.id}
    )
    TherapyPlan.query.filter_by(session_id=session_id, user_id=None).update(
        {"user_id": g.current_user.id}
    )
    ContactMessage.query.filter_by(session_id=session_id, user_id=None).update(
        {"user_id": g.current_user.id}
    )
    ExerciseCompletion.query.filter_by(session_id=session_id, user_id=None).update(
        {"user_id": g.current_user.id}
    )

    db.session.commit()
    return jsonify({"message": "Session data attached."}), 200
