"""Chat routes."""
import json
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, g
from sqlalchemy import or_
from db import db
from models import ChatSession, ChatMessage
from services.auth import require_auth, get_request_session_id
from services.safety_filter import (
    check_safety,
    get_crisis_response,
    get_medium_support_response,
)

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")
rate_limit_store = {}


def _check_rate_limit(user_id, max_per_minute=20):
    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=1)
    entries = rate_limit_store.get(user_id, [])
    entries = [ts for ts in entries if ts > cutoff]
    if len(entries) >= max_per_minute:
        rate_limit_store[user_id] = entries
        return False
    entries.append(now)
    rate_limit_store[user_id] = entries
    return True


def _make_title_from_message(content):
    trimmed = (content or "").strip().replace("\n", " ")
    return trimmed[:60] if trimmed else "New Chat"


@chat_bp.route("/session", methods=["POST"])
@require_auth
def create_chat_session():
    """Create a new chat session."""
    session_id = get_request_session_id()
    new_session = ChatSession(
        user_id=g.current_user.id,
        session_id=session_id,
        title="New Chat",
    )
    db.session.add(new_session)
    db.session.commit()
    return jsonify(new_session.to_dict()), 201


@chat_bp.route("/sessions", methods=["GET"])
@require_auth
def get_chat_sessions():
    """Get all chat sessions for a user (with optional search)."""
    query = request.args.get("q", "").strip()

    sessions_query = ChatSession.query.filter_by(user_id=g.current_user.id)
    if query:
        sessions_query = (
            sessions_query.join(ChatMessage, isouter=True)
            .filter(
                or_(
                    ChatSession.title.ilike(f"%{query}%"),
                    ChatMessage.content.ilike(f"%{query}%"),
                )
            )
            .distinct()
        )

    sessions = sessions_query.order_by(ChatSession.created_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions]), 200


@chat_bp.route("/session/<int:chat_session_id>", methods=["GET"])
@require_auth
def get_chat_session_detail(chat_session_id):
    """Get messages in a specific chat session."""
    session = ChatSession.query.filter_by(
        id=chat_session_id, user_id=g.current_user.id
    ).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    messages = (
        ChatMessage.query.filter_by(chat_session_id=chat_session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return jsonify(
        {"session": session.to_dict(), "messages": [m.to_dict() for m in messages]}
    ), 200


@chat_bp.route("/session/<int:chat_session_id>/title", methods=["PUT"])
@require_auth
def rename_chat_session(chat_session_id):
    """Rename a chat session."""
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title required"}), 400

    session = ChatSession.query.filter_by(
        id=chat_session_id, user_id=g.current_user.id
    ).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    session.title = title[:120]
    db.session.commit()
    return jsonify(session.to_dict()), 200


@chat_bp.route("/session/<int:chat_session_id>/export", methods=["GET"])
@require_auth
def export_chat_session(chat_session_id):
    """Export chat session as JSON or HTML."""
    export_format = request.args.get("format", "json")
    session = ChatSession.query.filter_by(
        id=chat_session_id, user_id=g.current_user.id
    ).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    messages = (
        ChatMessage.query.filter_by(chat_session_id=chat_session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    payload = {
        "session": session.to_dict(),
        "messages": [m.to_dict() for m in messages],
    }

    if export_format == "html":
        html = [
            "<html><head><title>Session Export</title>",
            "<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#2c3e50;}li{margin:10px 0;}@media print{body{margin:20px;}}</style>",
            "</head><body>",
            f"<h1>{session.title}</h1>",
            "<ul>",
        ]
        for msg in messages:
            html.append(
                f"<li><strong>{msg.role}:</strong> {msg.content}</li>"
            )
        html.extend(["</ul>", "</body></html>"])
        return "".join(html), 200, {"Content-Type": "text/html"}

    return jsonify(payload), 200


@chat_bp.route("/message", methods=["POST"])
@require_auth
def create_chat_message():
    """Save a user/assistant message and return bot response."""
    data = request.get_json() or {}
    chat_session_id = data.get("chat_session_id")
    content = data.get("content")
    language = data.get("language", g.current_user.preferred_language or "en")

    if not all([chat_session_id, content]):
        return jsonify({"error": "chat_session_id and content required"}), 400

    if not _check_rate_limit(g.current_user.id):
        return jsonify({"error": "Rate limit exceeded. Slow down."}), 429

    chat_session = ChatSession.query.filter_by(
        id=chat_session_id, user_id=g.current_user.id
    ).first()
    if not chat_session:
        return jsonify({"error": "Chat session not found"}), 404

    safety_check = check_safety(content)
    crisis_mode = safety_check["risk_level"] == "high"

    user_message = ChatMessage(
        chat_session_id=chat_session_id,
        role="user",
        content=content,
        language=language,
        safety_flags_json=json.dumps(safety_check.get("reasons", [])),
    )
    db.session.add(user_message)

    if crisis_mode:
        bot_response = get_crisis_response()
    elif safety_check["risk_level"] == "medium":
        bot_response = get_medium_support_response()
    else:
        try:
            from app import rag_chain

            response = rag_chain.invoke({"input": f"[Language: {language}] {content}"})
            bot_response = response.get(
                "answer", "I understood your message. How can I help further?"
            )
        except Exception as exc:
            print(f"LLM error: {exc}")
            bot_response = (
                "Thank you for sharing. I'm here to listen and support you. "
                f"(Language: {language}) What aspect would you like to explore further?"
            )

    bot_message = ChatMessage(
        chat_session_id=chat_session_id,
        role="assistant",
        content=bot_response,
        language=language,
        safety_flags_json=json.dumps(safety_check.get("reasons", [])),
    )
    db.session.add(bot_message)

    if chat_session.title in ("Untitled Chat", "New Chat") and content:
        chat_session.title = _make_title_from_message(content)

    chat_session.last_message_at = datetime.utcnow()
    db.session.commit()

    return (
        jsonify(
            {
                "message_id": user_message.id,
                "bot_response": bot_response,
                "crisis_mode": crisis_mode,
                "safety_check": safety_check,
            }
        ),
        201,
    )


@chat_bp.route("/session/<int:chat_session_id>", methods=["DELETE"])
@require_auth
def delete_chat_session(chat_session_id):
    """Delete a specific chat session."""
    session = ChatSession.query.filter_by(
        id=chat_session_id, user_id=g.current_user.id
    ).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    db.session.delete(session)
    db.session.commit()
    return jsonify({"message": "Session deleted"}), 200


@chat_bp.route("/sessions", methods=["DELETE"])
@require_auth
def delete_all_chat_sessions():
    """Delete all chat sessions for a user."""
    ChatSession.query.filter_by(user_id=g.current_user.id).delete()
    db.session.commit()
    return jsonify({"message": "All sessions deleted"}), 200
