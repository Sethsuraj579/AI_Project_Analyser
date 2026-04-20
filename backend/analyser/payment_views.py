"""
Django views for Razorpay payment handling.
"""
import logging
import json
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings
from .razorpay_utils import verify_webhook_signature
from .webhook_handlers import handle_webhook

logger = logging.getLogger(__name__)


@require_http_methods(["POST"])
@csrf_exempt
def razorpay_webhook(request):
    """
    Handle incoming Razorpay webhooks.
    """
    payload = request.body
    sig_header = request.META.get("HTTP_X_RAZORPAY_SIGNATURE")
    
    if not sig_header:
        logger.error("Missing Razorpay signature header")
        return JsonResponse({"error": "Missing signature"}, status=400)
    
    try:
        event = json.loads(payload.decode("utf-8"))
        verify_webhook_signature(payload, sig_header)
        return handle_webhook(request, payload, event)
        
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return JsonResponse({"error": "Invalid payload"}, status=400)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return JsonResponse({"error": "Webhook processing failed"}, status=500)


@require_http_methods(["GET"])
def health_check(request):
    """
    Comprehensive health check endpoint.
    Checks database and Redis connectivity.
    """
    health = {"status": "ok", "service": "AI Project Analyser", "checks": {}}
    
    # Database check
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health["checks"]["database"] = "ok"
    except Exception as e:
        health["checks"]["database"] = f"error: {str(e)}"
        health["status"] = "degraded"
    
    # Redis/Cache check
    try:
        from django.core.cache import cache
        cache.set("_health_check", "ok", timeout=1)
        cache.get("_health_check")
        health["checks"]["cache"] = "ok"
    except Exception as e:
        health["checks"]["cache"] = f"error: {str(e)}"
        health["status"] = "degraded"
    
    return JsonResponse(health)
