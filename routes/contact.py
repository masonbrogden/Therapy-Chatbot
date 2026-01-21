"""Contact form routes."""
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, g
from db import db
from models import ContactMessage
from services.auth import require_auth, get_request_session_id

contact_bp = Blueprint("contact", __name__, url_prefix="/api")

rate_limit_store = {}


def _check_rate_limit(user_id, max_per_hour=5):
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


@contact_bp.route("/contact", methods=["POST"])
@require_auth
def create_contact_message():
    """Submit contact form."""
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    category = data.get("category") or data.get("reason")
    message = data.get("message")
    honeypot = data.get("company")

    if honeypot:
        return jsonify({"error": "Spam detected."}), 400

    if not all([email, category, message]):
        return jsonify({"error": "email, category, and message required"}), 400

    if not _check_rate_limit(g.current_user.id, max_per_hour=5):
        return jsonify({"error": "Rate limit exceeded."}), 429

    contact = ContactMessage(
        user_id=g.current_user.id,
        session_id=get_request_session_id(),
        name=name,
        email=email,
        category=category,
        message=message[:2000],
    )
    db.session.add(contact)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Contact form submitted successfully.",
                "contact_id": contact.id,
            }
        ),
        201,
    )
