"""Therapy plan routes."""
import json
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, g
from db import db
from models import TherapyProfile, TherapyPlan
from services.auth import require_auth, get_request_session_id
from services.plan_generator import generate_weekly_plan

plan_bp = Blueprint("plan", __name__, url_prefix="/api")

rate_limit_store = {}


def _check_rate_limit(user_id, max_per_hour=3):
    now = datetime.utcnow()
    cutoff = now - timedelta(hours=1)
    entries = rate_limit_store.get(user_id, [])
    entries = [ts for ts in entries if ts > cutoff]
    if len(entries) >= max_per_hour:
        rate_limit_store[user_id] = entries
        return False
    entries.append(now)
    rate_limit_store[user_id] = entries
    return True


@plan_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile():
    """Get user's therapy profile."""
    profile = TherapyProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile:
        return jsonify(None), 200
    return jsonify(profile.to_dict()), 200


@plan_bp.route("/profile", methods=["POST"])
@require_auth
def upsert_profile():
    """Create or update therapy profile."""
    data = request.get_json() or {}
    profile = TherapyProfile.query.filter_by(user_id=g.current_user.id).first()

    if profile:
        profile.main_concern = data.get("main_concern", profile.main_concern)
        profile.concern_extra = data.get("concern_extra", profile.concern_extra)
        profile.approach = data.get("approach", profile.approach)
        profile.goals = data.get("goals", profile.goals)
        profile.minutes_per_day = data.get("minutes_per_day", profile.minutes_per_day)
        profile.primary_goals = data.get("primary_goals", profile.primary_goals)
        profile.preferred_approaches = data.get(
            "preferred_approaches", profile.preferred_approaches
        )
        profile.frequency_preference = data.get(
            "frequency_preference", profile.frequency_preference
        )
        profile.focus_areas_json = json.dumps(
            data.get("focus_areas", json.loads(profile.focus_areas_json or "[]"))
        )
    else:
        profile = TherapyProfile(
            user_id=g.current_user.id,
            session_id=get_request_session_id(),
            main_concern=data.get("main_concern", "anxiety"),
            concern_extra=data.get("concern_extra"),
            approach=data.get("approach", "cbt"),
            goals=data.get("goals", ""),
            minutes_per_day=data.get("minutes_per_day", 10),
            primary_goals=data.get("primary_goals"),
            preferred_approaches=data.get("preferred_approaches"),
            frequency_preference=data.get("frequency_preference"),
            focus_areas_json=json.dumps(data.get("focus_areas", [])),
        )
        db.session.add(profile)

    db.session.commit()
    return jsonify(profile.to_dict()), 201 if not profile.id else 200


@plan_bp.route("/plan/generate", methods=["POST"])
@require_auth
def generate_plan():
    """Generate a new therapy plan based on profile."""
    if not _check_rate_limit(g.current_user.id):
        return jsonify({"error": "Rate limit exceeded. Try again later."}), 429

    profile = TherapyProfile.query.filter_by(user_id=g.current_user.id).first()
    if not profile:
        return jsonify({"error": "Profile not found. Create profile first."}), 404

    plan_data = generate_weekly_plan(
        {
            "main_concern": profile.main_concern,
            "approach": profile.approach,
            "minutes_per_day": profile.minutes_per_day,
        }
    )

    # Add completion fields
    for item in plan_data.get("weekly_plan", []):
        item["completed"] = False

    existing_count = TherapyPlan.query.filter_by(user_id=g.current_user.id).count()
    plan = TherapyPlan(
        user_id=g.current_user.id,
        session_id=get_request_session_id(),
        plan_json=json.dumps(plan_data),
        completed_items_json=json.dumps([]),
        version=existing_count + 1,
    )
    db.session.add(plan)
    db.session.commit()
    return jsonify(plan.to_dict()), 201


@plan_bp.route("/plan", methods=["GET"])
@require_auth
def get_latest_plan():
    """Get latest therapy plan for user."""
    plan = (
        TherapyPlan.query.filter_by(user_id=g.current_user.id)
        .order_by(TherapyPlan.created_at.desc())
        .first()
    )
    if not plan:
        return jsonify(None), 200
    return jsonify(plan.to_dict()), 200


@plan_bp.route("/plan/history", methods=["GET"])
@require_auth
def get_plan_history():
    """Get plan history for user."""
    plans = (
        TherapyPlan.query.filter_by(user_id=g.current_user.id)
        .order_by(TherapyPlan.created_at.desc())
        .all()
    )
    return jsonify([p.to_dict() for p in plans]), 200


@plan_bp.route("/plan/complete", methods=["PUT"])
@require_auth
def update_plan_completion():
    """Update completion status for a plan item."""
    data = request.get_json() or {}
    plan_id = data.get("plan_id")
    day_index = data.get("day_index")
    completed = data.get("completed", True)

    if plan_id is None or day_index is None:
        return jsonify({"error": "plan_id and day_index required"}), 400

    plan = TherapyPlan.query.filter_by(
        id=plan_id, user_id=g.current_user.id
    ).first()
    if not plan:
        return jsonify({"error": "Plan not found"}), 404

    plan_data = json.loads(plan.plan_json or "{}")
    weekly_plan = plan_data.get("weekly_plan", [])
    if day_index < 0 or day_index >= len(weekly_plan):
        return jsonify({"error": "Invalid day_index"}), 400

    weekly_plan[day_index]["completed"] = bool(completed)
    plan.plan_json = json.dumps(plan_data)
    db.session.commit()

    return jsonify(plan.to_dict()), 200
