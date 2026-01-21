"""Validators utility."""
import re


def validate_email(email):
    """Basic email validation."""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None


def validate_message_length(message, min_length=1, max_length=5000):
    """Validate message length."""
    return min_length <= len(message.strip()) <= max_length
