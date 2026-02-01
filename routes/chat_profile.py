"""Chat onboarding profile routes."""
from flask import Blueprint, request, jsonify, g
from db import db
from models import ChatProfile
from services.auth import require_auth

chat_profile_bp = Blueprint("chat_profile", __name__, url_prefix="/api/chat-profile")


def _normalize_string(value):
    value = (value or "").strip()
    return value if value else None


@chat_profile_bp.route("", methods=["GET"])
@require_auth
def get_chat_profile():
    """Return the current user's chat profile."""
    profile = ChatProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile:
        return jsonify(
            {
                "display_name": None,
                "tone": None,
                "goal": None,
                "focus_area": None,
                "response_length": None,
                "boundaries": None,
                "onboarding_completed": False,
                "updated_at": None,
            }
        ), 200
    return jsonify(profile.to_dict()), 200


@chat_profile_bp.route("", methods=["PUT"])
@require_auth
def upsert_chat_profile():
    """Create or update the current user's chat profile."""
    data = request.get_json() or {}
    profile = ChatProfile.query.filter_by(user_id=g.current_user.id).first()

    if not profile:
        profile = ChatProfile(user_id=g.current_user.id)
        db.session.add(profile)

    profile.display_name = _normalize_string(data.get("display_name"))
    profile.tone = _normalize_string(data.get("tone"))
    profile.goal = _normalize_string(data.get("goal"))
    profile.focus_area = _normalize_string(data.get("focus_area"))
    profile.response_length = _normalize_string(data.get("response_length"))
    profile.boundaries = _normalize_string(data.get("boundaries"))
    if data.get("onboarding_completed") is True:
        profile.onboarding_completed = True

    db.session.commit()
    return jsonify(profile.to_dict()), 200
