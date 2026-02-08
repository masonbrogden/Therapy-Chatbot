"""Supabase JWT authentication helpers and decorators."""
import os
from functools import wraps

import jwt
from flask import g, jsonify, request

from db import db
from models import User


AUTH_BYPASS_ENV_KEY = "AUTH_BYPASS"
SUPABASE_JWT_SECRET_ENV_KEY = "SUPABASE_JWT_SECRET"
SUPABASE_JWT_ISSUER_ENV_KEY = "SUPABASE_JWT_ISSUER"
SUPABASE_JWT_AUDIENCE_ENV_KEY = "SUPABASE_JWT_AUDIENCE"


def _auth_bypass_enabled():
    return os.getenv(AUTH_BYPASS_ENV_KEY, "false").lower() in ("1", "true", "yes")


def _get_expected_issuer():
    issuer = os.getenv(SUPABASE_JWT_ISSUER_ENV_KEY, "").strip()
    return issuer or None


def _get_expected_audience():
    audience = os.getenv(SUPABASE_JWT_AUDIENCE_ENV_KEY, "").strip()
    return audience or None


def _verify_id_token(token):
    secret = os.getenv(SUPABASE_JWT_SECRET_ENV_KEY)
    if not secret:
        raise RuntimeError(f"{SUPABASE_JWT_SECRET_ENV_KEY} is not set.")

    options = {"verify_signature": True, "verify_exp": True}
    issuer = _get_expected_issuer()
    audience = _get_expected_audience()

    return jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        issuer=issuer,
        audience=audience,
        options=options,
    )


def get_current_user():
    if _auth_bypass_enabled():
        user = User.query.filter_by(firebase_uid="dev-user").first()
        if user:
            return user
        user = User(
            firebase_uid="dev-user",
            email="dev@local",
            display_name="Developer",
        )
        db.session.add(user)
        db.session.commit()
        return user

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.replace("Bearer ", "", 1).strip()
    if not token:
        return None
    try:
        decoded = _verify_id_token(token)
    except Exception:
        return None

    auth_uid = decoded.get("sub")
    email = decoded.get("email")
    name = decoded.get("user_metadata", {}).get("full_name") or decoded.get("name") or email

    if not auth_uid:
        return None

    user = User.query.filter_by(firebase_uid=auth_uid).first()
    if user:
        if email and user.email != email:
            user.email = email
        if name and user.display_name != name:
            user.display_name = name
        db.session.commit()
        return user

    user = User(
        firebase_uid=auth_uid,
        email=email,
        display_name=name,
    )
    db.session.add(user)
    db.session.commit()
    return user


def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        g.current_user = user
        return func(*args, **kwargs)

    return wrapper


def get_request_session_id():
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id") or request.args.get("session_id")
    return session_id
