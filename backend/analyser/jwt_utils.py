"""Custom JWT helpers for password-based token invalidation."""

from hashlib import sha256
from calendar import timegm
from datetime import datetime

from django.contrib.auth import get_user_model

import jwt

from graphql_jwt.utils import jwt_decode as default_jwt_decode
from graphql_jwt.utils import jwt_payload as default_jwt_payload


def _password_fingerprint(password_hash):
    return sha256(password_hash.encode("utf-8")).hexdigest()


def jwt_payload(user, context=None):
    payload = default_jwt_payload(user, context)
    payload["pwd"] = _password_fingerprint(user.password)
    return payload


def jwt_decode(token, context=None):
    payload = default_jwt_decode(token, context)

    username_field = get_user_model().USERNAME_FIELD
    username = payload.get(username_field)
    password_fingerprint = payload.get("pwd")
    orig_iat = payload.get("origIat")

    if username and password_fingerprint:
        user = get_user_model()._default_manager.filter(**{username_field: username}).only("password").first()
        if user is not None and _password_fingerprint(user.password) != password_fingerprint:
            raise jwt.InvalidTokenError("Password changed. Please sign in again.")

    if username and orig_iat:
        user = get_user_model()._default_manager.select_related("profile").filter(**{username_field: username}).first()
        if user is not None:
            profile = getattr(user, "profile", None)
            password_changed_at = getattr(profile, "password_changed_at", None)
            if password_changed_at is not None:
                changed_at = timegm(password_changed_at.utctimetuple())
                if orig_iat < changed_at:
                    raise jwt.InvalidTokenError("Password changed. Please sign in again.")

    return payload