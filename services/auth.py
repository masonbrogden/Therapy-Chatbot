"""Firebase authentication helpers and decorators."""
import json
import os
from functools import wraps

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from flask import g, jsonify, request

from db import db
from models import User


FIREBASE_ENV_KEY = "FIREBASE_ADMIN_JSON"
AUTH_BYPASS_ENV_KEY = "AUTH_BYPASS"


def _auth_bypass_enabled():
    return os.getenv(AUTH_BYPASS_ENV_KEY, "false").lower() in ("1", "true", "yes")


def _init_firebase():
    if firebase_admin._apps:
        return
    raw_json = os.getenv(FIREBASE_ENV_KEY)
    if not raw_json:
        raise RuntimeError(f"{FIREBASE_ENV_KEY} is not set.")
    try:
        service_account = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{FIREBASE_ENV_KEY} must be valid JSON.") from exc
    cred = credentials.Certificate(service_account)
    firebase_admin.initialize_app(cred)


def _verify_id_token(token):
    _init_firebase()
    return firebase_auth.verify_id_token(token)


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

    firebase_uid = decoded.get("uid")
    email = decoded.get("email")
    name = decoded.get("name") or decoded.get("email")

    if not firebase_uid:
        return None

    user = User.query.filter_by(firebase_uid=firebase_uid).first()
    if user:
        if email and user.email != email:
            user.email = email
        if name and user.display_name != name:
            user.display_name = name
        db.session.commit()
        return user

    user = User(
        firebase_uid=firebase_uid,
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
