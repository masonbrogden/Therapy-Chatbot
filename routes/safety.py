"""Safety check routes."""
from flask import Blueprint, request, jsonify
from services.safety_filter import check_safety

safety_bp = Blueprint('safety', __name__, url_prefix='/api/safety')


@safety_bp.route('/check', methods=['POST'])
def check_text_safety():
    """Check if text contains crisis or self-harm indicators."""
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'text required'}), 400
    
    result = check_safety(text)
    
    return jsonify(result), 200
