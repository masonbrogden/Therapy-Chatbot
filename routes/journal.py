"""Journal entry routes."""
from datetime import datetime, date, time
import json

from flask import Blueprint, jsonify, request, g

from db import db
from models import JournalEntry
from services.auth import require_auth

journal_bp = Blueprint("journal", __name__, url_prefix="/api/journal")


def _parse_triggers(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


@journal_bp.route("/entries", methods=["POST"])
@require_auth
def create_entry():
    data = request.get_json() or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content required"}), 400

    entry = JournalEntry(
        user_id=g.current_user.id,
        title=(data.get("title") or "").strip() or None,
        content=content,
        mood=(data.get("mood") or "").strip() or None,
        triggers_json=json.dumps(_parse_triggers(data.get("triggers"))),
        prompt_used=(data.get("prompt_used") or "").strip() or None,
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@journal_bp.route("/entries", methods=["GET"])
@require_auth
def list_entries():
    query = JournalEntry.query.filter_by(user_id=g.current_user.id)

    mood = request.args.get("mood")
    if mood:
        query = query.filter(JournalEntry.mood == mood)

    search = request.args.get("q")
    if search:
        like = f"%{search}%"
        query = query.filter(
            (JournalEntry.title.ilike(like)) | (JournalEntry.content.ilike(like))
        )

    start_date = _parse_date(request.args.get("start_date"))
    end_date = _parse_date(request.args.get("end_date"))
    if start_date:
        query = query.filter(JournalEntry.created_at >= datetime.combine(start_date, time.min))
    if end_date:
        query = query.filter(JournalEntry.created_at <= datetime.combine(end_date, time.max))

    entries = query.order_by(JournalEntry.created_at.desc()).all()
    return jsonify([entry.to_dict() for entry in entries]), 200


@journal_bp.route("/entries/<int:entry_id>", methods=["GET"])
@require_auth
def get_entry(entry_id):
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=g.current_user.id).first()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    return jsonify(entry.to_dict()), 200


@journal_bp.route("/entries/<int:entry_id>", methods=["PUT"])
@require_auth
def update_entry(entry_id):
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=g.current_user.id).first()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    data = request.get_json() or {}
    if "title" in data:
        title = (data.get("title") or "").strip()
        entry.title = title or None
    if "content" in data:
        content = (data.get("content") or "").strip()
        if not content:
            return jsonify({"error": "content required"}), 400
        entry.content = content
    if "mood" in data:
        entry.mood = (data.get("mood") or "").strip() or None
    if "triggers" in data:
        entry.triggers_json = json.dumps(_parse_triggers(data.get("triggers")))
    if "prompt_used" in data:
        entry.prompt_used = (data.get("prompt_used") or "").strip() or None

    db.session.commit()
    return jsonify(entry.to_dict()), 200


@journal_bp.route("/entries/<int:entry_id>", methods=["DELETE"])
@require_auth
def delete_entry(entry_id):
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=g.current_user.id).first()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200
