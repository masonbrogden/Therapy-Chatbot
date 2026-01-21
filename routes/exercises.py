"""Exercises routes."""
from flask import Blueprint, request, jsonify, g
from db import db
from models import ExerciseCompletion
from services.auth import require_auth, get_request_session_id
from services.exercises_data import get_all_exercises, get_exercise_by_slug

exercises_bp = Blueprint('exercises', __name__, url_prefix='/api/exercises')


@exercises_bp.route('', methods=['GET'])
def fetch_all_exercises():
    """Get all exercises (summary)."""
    exercises = get_all_exercises()
    
    return jsonify(exercises), 200


@exercises_bp.route('/<slug>', methods=['GET'])
def fetch_exercise_detail(slug):
    """Get full exercise details by slug."""
    exercise = get_exercise_by_slug(slug)
    
    if not exercise:
        return jsonify({'error': 'Exercise not found'}), 404
    
    return jsonify(exercise), 200


@exercises_bp.route('/complete', methods=['POST'])
@require_auth
def complete_exercise():
    """Track an exercise completion."""
    data = request.get_json() or {}
    slug = data.get('slug')
    if not slug:
        return jsonify({'error': 'slug required'}), 400

    completion = ExerciseCompletion(
        user_id=g.current_user.id,
        session_id=get_request_session_id(),
        exercise_slug=slug,
    )
    db.session.add(completion)
    db.session.commit()

    return jsonify(completion.to_dict()), 201


@exercises_bp.route('/progress', methods=['GET'])
@require_auth
def get_exercise_progress():
    """Get exercise completion history."""
    completions = ExerciseCompletion.query.filter_by(user_id=g.current_user.id).all()
    return jsonify([c.to_dict() for c in completions]), 200


@exercises_bp.route('/guided', methods=['POST'])
@require_auth
def guided_exercise_step():
    """Return a guided exercise step (scripted or AI-guided)."""
    data = request.get_json() or {}
    slug = data.get('slug')
    step_index = data.get('step_index', 0)
    if step_index < 0:
        return jsonify({'error': 'Invalid step_index'}), 400
    mode = data.get('mode', 'scripted')

    exercise = get_exercise_by_slug(slug)
    if not exercise:
        return jsonify({'error': 'Exercise not found'}), 404

    steps = exercise.get('steps', [])
    if mode == 'ai':
        language = g.current_user.preferred_language or "en"
        try:
            from app import rag_chain
            prompt = (
                "You are guiding a short wellness exercise. "
                "Return JSON with keys: title, text, timer_seconds. "
                f"Exercise: {exercise['title']}. Step index: {step_index}. "
                f"Respond in language: {language}."
            )
            response = rag_chain.invoke({"input": prompt})
            text = response.get('answer', '')
            return jsonify({
                'title': f"Step {step_index + 1}",
                'text': text,
                'timer_seconds': None,
            }), 200
        except Exception:
            pass

    step = steps[step_index] if step_index < len(steps) else None
    if not step:
        return jsonify({'error': 'Step not found'}), 404

    return jsonify({
        'title': f"Step {step.get('number')}",
        'text': step.get('instruction'),
        'timer_seconds': None,
    }), 200
