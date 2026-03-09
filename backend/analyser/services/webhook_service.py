"""Service helpers for outbound webhook CRUD and test dispatch."""

from analyser.models import OutboundWebhook
from analyser.tasks import send_outbound_webhooks_async


def _validate_events(event_types):
    valid_events = {choice[0] for choice in OutboundWebhook.EVENT_CHOICES}
    return all(event in valid_events for event in event_types)


def create_webhook_for_user(user, name, url, secret="", event_types=None, is_active=True):
    events = event_types or ["analysis.completed"]
    if not _validate_events(events):
        return {"webhook": None, "success": False, "message": "Invalid event type in selection."}

    webhook = OutboundWebhook.objects.create(
        user=user,
        name=name.strip(),
        url=url.strip(),
        secret=secret.strip(),
        event_types=events,
        is_active=is_active,
    )
    return {"webhook": webhook, "success": True, "message": "Webhook created successfully."}


def update_webhook_for_user(user, webhook_id, name=None, url=None, secret=None, event_types=None, is_active=None):
    webhook = OutboundWebhook.objects.filter(id=webhook_id, user=user).first()
    if not webhook:
        return {"webhook": None, "success": False, "message": "Webhook not found."}

    if event_types is not None:
        if not _validate_events(event_types):
            return {"webhook": None, "success": False, "message": "Invalid event type in selection."}
        webhook.event_types = event_types

    if name is not None:
        webhook.name = name.strip()
    if url is not None:
        webhook.url = url.strip()
    if secret is not None:
        webhook.secret = secret.strip()
    if is_active is not None:
        webhook.is_active = is_active

    webhook.save()
    return {"webhook": webhook, "success": True, "message": "Webhook updated successfully."}


def delete_webhook_for_user(user, webhook_id):
    deleted, _ = OutboundWebhook.objects.filter(id=webhook_id, user=user).delete()
    if not deleted:
        return {"success": False, "message": "Webhook not found."}
    return {"success": True, "message": "Webhook deleted successfully."}


def test_webhook_for_user(user, webhook_id):
    webhook = OutboundWebhook.objects.filter(id=webhook_id, user=user).first()
    if not webhook:
        return {"success": False, "message": "Webhook not found."}

    send_outbound_webhooks_async.delay(
        user.id,
        "analysis.completed",
        {
            "test": True,
            "webhook_id": str(webhook.id),
            "message": "This is a test webhook event from AI Project Analyser.",
        },
    )
    return {"success": True, "message": "Test event dispatched."}
