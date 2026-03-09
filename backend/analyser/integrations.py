"""Helpers for dispatching outbound webhooks to user-configured integrations."""
import hashlib
import hmac
import json
import logging
from urllib import request, error

from django.utils import timezone

from .models import OutboundWebhook

logger = logging.getLogger("analyser.integrations")


def _hmac_signature(secret, payload):
    if not secret:
        return ""
    digest = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def dispatch_outbound_webhooks(user, event_name, payload):
    """Send an event payload to all matching active webhooks for the user."""
    hooks = OutboundWebhook.objects.filter(user=user, is_active=True)
    if not hooks.exists():
        return

    body = json.dumps(
        {
            "event": event_name,
            "timestamp": timezone.now().isoformat(),
            "data": payload,
        }
    ).encode("utf-8")

    for hook in hooks:
        configured_events = hook.event_types or []
        if configured_events and event_name not in configured_events:
            continue

        headers = {
            "Content-Type": "application/json",
            "X-AIA-Event": event_name,
            "User-Agent": "AI-Project-Analyser-Webhook/1.0",
        }

        signature = _hmac_signature(hook.secret, body)
        if signature:
            headers["X-AIA-Signature"] = signature

        req = request.Request(hook.url, data=body, headers=headers, method="POST")

        status_code = None
        response_text = ""
        try:
            with request.urlopen(req, timeout=8) as resp:
                status_code = int(resp.getcode())
                response_text = (resp.read() or b"").decode("utf-8", errors="ignore")
        except error.HTTPError as exc:
            status_code = int(exc.code)
            response_text = (exc.read() or b"").decode("utf-8", errors="ignore")
            logger.warning("Webhook '%s' HTTP error: %s", hook.name, exc)
        except Exception as exc:  # pragma: no cover
            status_code = 0
            response_text = str(exc)
            logger.warning("Webhook '%s' delivery failed: %s", hook.name, exc)

        hook.last_status = status_code
        hook.last_response = (response_text or "")[:1000]
        hook.last_triggered_at = timezone.now()
        hook.save(update_fields=["last_status", "last_response", "last_triggered_at", "updated_at"])
