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
    Simple health check endpoint.
    """
    return JsonResponse({"status": "ok", "service": "AI Project Analyser"})
