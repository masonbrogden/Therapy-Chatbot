"""Crisis resources routes."""
from flask import Blueprint, request, jsonify
from services.crisis_resources import get_crisis_resources

crisis_bp = Blueprint('crisis', __name__, url_prefix='/api')


@crisis_bp.route('/crisis-resources', methods=['GET'])
def fetch_crisis_resources():
    """Get crisis resources for a specific country."""
    country = request.args.get('country', 'US')
    
    resources = get_crisis_resources(country)
    
    return jsonify(resources), 200


@crisis_bp.route('/geo-country', methods=['GET'])
def get_geo_country():
    """Get detected country from IP (or fallback)."""
    # In a production app, use a geolocation service
    # For local testing, always return None (frontend fallback to US)
    return jsonify({'country': None}), 200
