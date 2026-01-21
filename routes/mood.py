"""Mood tracking routes."""
from datetime import datetime, timedelta, date
import json

from flask import Blueprint, request, jsonify, g
from db import db
from models import MoodEntry
from services.auth import require_auth, get_request_session_id

mood_bp = Blueprint('mood', __name__, url_prefix='/api/mood')


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _parse_tags(args):
    tags = []
    raw_tags = args.get("tags")
    if raw_tags:
        tags = [tag.strip() for tag in raw_tags.split(",") if tag.strip()]
    if not tags:
        tags = [tag for tag in args.getlist("tag") if tag]
    return tags


def _filter_entries_by_tags(entries, tags):
    if not tags:
        return entries
    filtered = []
    for entry in entries:
        entry_tags = json.loads(entry.tags_json or "[]")
        if any(tag in entry_tags for tag in tags):
            filtered.append(entry)
    return filtered


def _calculate_streak(entries):
    streak = 0
    if not entries:
        return streak
    dates = {entry.entry_date for entry in entries if entry.entry_date}
    day = date.today()
    while day in dates:
        streak += 1
        day = day - timedelta(days=1)
    return streak


def _calculate_trend(entries, window_days=7):
    if not entries:
        return {"direction": "flat", "delta": 0, "window_days": window_days}
    today = date.today()
    current_start = today - timedelta(days=window_days - 1)
    previous_start = current_start - timedelta(days=window_days)
    previous_end = current_start - timedelta(days=1)

    current_scores = [
        entry.mood_score
        for entry in entries
        if entry.entry_date and current_start <= entry.entry_date <= today
    ]
    previous_scores = [
        entry.mood_score
        for entry in entries
        if entry.entry_date and previous_start <= entry.entry_date <= previous_end
    ]

    if not current_scores or not previous_scores:
        return {"direction": "flat", "delta": 0, "window_days": window_days}

    current_avg = sum(current_scores) / len(current_scores)
    previous_avg = sum(previous_scores) / len(previous_scores)
    delta = current_avg - previous_avg
    if delta > 0.25:
        direction = "up"
    elif delta < -0.25:
        direction = "down"
    else:
        direction = "flat"
    return {"direction": direction, "delta": round(delta, 2), "window_days": window_days}


@mood_bp.route('', methods=['POST'])
@require_auth
def create_mood_entry():
    """Create or update today's mood entry."""
    data = request.get_json() or {}
    mood_score = data.get('mood_score')
    tags = data.get('tags', [])
    note = data.get('note', '')

    if mood_score is None:
        return jsonify({'error': 'mood_score required'}), 400

    if not 1 <= mood_score <= 10:
        return jsonify({'error': 'mood_score must be between 1 and 10'}), 400

    today = date.today()
    entry = MoodEntry.query.filter_by(
        user_id=g.current_user.id, entry_date=today
    ).first()

    if entry:
        entry.mood_score = mood_score
        entry.tags_json = json.dumps(tags)
        entry.note = note[:500] if note else None
        status_code = 200
    else:
        entry = MoodEntry(
            user_id=g.current_user.id,
            session_id=get_request_session_id(),
            mood_score=mood_score,
            tags_json=json.dumps(tags),
            note=note[:500] if note else None,
            entry_date=today,
        )
        db.session.add(entry)
        status_code = 201

    db.session.commit()
    return jsonify(entry.to_dict()), status_code


@mood_bp.route('/today', methods=['POST', 'PUT'])
@require_auth
def upsert_today_mood_entry():
    """Create or update today's check-in."""
    return create_mood_entry()


@mood_bp.route('', methods=['GET'])
@require_auth
def get_mood_entries():
    """Get mood entries for a user with optional range and tag filters."""
    range_filter = request.args.get('range', 'all')  # 7d, 30d, all
    start_date = _parse_date(request.args.get('start_date'))
    end_date = _parse_date(request.args.get('end_date'))
    tags = _parse_tags(request.args)

    query = MoodEntry.query.filter_by(user_id=g.current_user.id)

    if range_filter == '7d':
        cutoff = date.today() - timedelta(days=6)
        query = query.filter(MoodEntry.entry_date >= cutoff)
    elif range_filter == '30d':
        cutoff = date.today() - timedelta(days=29)
        query = query.filter(MoodEntry.entry_date >= cutoff)

    if start_date:
        query = query.filter(MoodEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(MoodEntry.entry_date <= end_date)

    entries = query.order_by(MoodEntry.entry_date.asc(), MoodEntry.created_at.asc()).all()
    entries = _filter_entries_by_tags(entries, tags)

    if entries:
        scores = [entry.mood_score for entry in entries]
        avg_mood = sum(scores) / len(scores)
        min_mood = min(scores)
        max_mood = max(scores)
    else:
        avg_mood = min_mood = max_mood = None

    streak = _calculate_streak(entries)
    trend = _calculate_trend(entries)

    return jsonify({
        'entries': [entry.to_dict() for entry in entries],
        'stats': {
            'count': len(entries),
            'average_mood': avg_mood,
            'min_mood': min_mood,
            'max_mood': max_mood,
            'streak_days': streak,
            'trend': trend,
        },
    }), 200


@mood_bp.route('/summary', methods=['GET'])
@require_auth
def get_mood_summary():
    """Get summary stats for mood entries."""
    start_date = _parse_date(request.args.get('start_date'))
    end_date = _parse_date(request.args.get('end_date'))
    tags = _parse_tags(request.args)

    query = MoodEntry.query.filter_by(user_id=g.current_user.id)
    if start_date:
        query = query.filter(MoodEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(MoodEntry.entry_date <= end_date)

    entries = query.order_by(MoodEntry.entry_date.asc()).all()
    entries = _filter_entries_by_tags(entries, tags)

    if entries:
        scores = [entry.mood_score for entry in entries]
        avg_mood = sum(scores) / len(scores)
        min_mood = min(scores)
        max_mood = max(scores)
    else:
        avg_mood = min_mood = max_mood = None

    streak = _calculate_streak(entries)
    trend = _calculate_trend(entries)

    return jsonify({
        'count': len(entries),
        'average_mood': avg_mood,
        'min_mood': min_mood,
        'max_mood': max_mood,
        'streak_days': streak,
        'trend': trend,
    }), 200


@mood_bp.route('', methods=['DELETE'])
@require_auth
def delete_mood_entries():
    """Delete all mood entries for a user."""
    MoodEntry.query.filter_by(user_id=g.current_user.id).delete()
    db.session.commit()
    
    return jsonify({'message': 'All mood entries deleted'}), 200
