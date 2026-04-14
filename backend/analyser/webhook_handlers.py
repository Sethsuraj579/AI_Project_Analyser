"""
Razorpay webhook handler for payment events.
"""
import logging
from datetime import timedelta
from django.utils import timezone
from django.http import JsonResponse
from .models import Payment, Invoice, UserSubscription

logger = logging.getLogger(__name__)


def handle_webhook(request, payload, event):
    """
    Route Razorpay webhook events to appropriate handlers.
    """
    event_type = event.get("event")

    if event_type == "payment.captured":
        return handle_payment_captured(event)
    if event_type == "payment.failed":
        return handle_payment_failed(event)
    if event_type == "subscription.activated":
        return handle_subscription_activated(event)
    if event_type == "subscription.charged":
        return handle_subscription_charged(event)
    if event_type == "subscription.cancelled":
        return handle_subscription_cancelled(event)
    if event_type == "invoice.paid":
        return handle_invoice_paid(event)
    if event_type == "invoice.payment_failed":
        return handle_invoice_failed(event)

    logger.info("Unhandled webhook event: %s", event_type)
    return JsonResponse({"status": "ok"})


def handle_payment_captured(event):
    """
    Handle successful Razorpay payment.
    """
    try:
        payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payment_entity.get("id")
        order_id = payment_entity.get("order_id")
        subscription_id = payment_entity.get("subscription_id")

        payment = None
        if order_id:
            payment = Payment.objects.filter(razorpay_order_id=order_id).first()
        if not payment and subscription_id:
            payment = Payment.objects.filter(razorpay_subscription_id=subscription_id).first()

        if not payment:
            logger.warning("Payment not found for order %s", order_id)
            return JsonResponse({"status": "ok"})

        payment.status = "succeeded"
        payment.succeeded_at = timezone.now()
        payment.razorpay_payment_id = payment_id or None
        payment.save()

        if payment.plan:
            subscription, _ = UserSubscription.objects.get_or_create(user=payment.user)
            subscription.plan = payment.plan
            subscription.is_active = True

            if payment.plan.name == "basic":
                subscription.renews_at = timezone.now() + timedelta(days=30)
                subscription.projects_used = 0
                subscription.analyses_used = 0
            elif payment.plan.name == "premium":
                subscription.renews_at = None

            subscription.save()

        logger.info("Payment %s captured for user %s", payment_id, payment.user.email)
        return JsonResponse({"status": "ok"})

    except Exception as exc:
        logger.error("Error handling payment.captured: %s", exc)
        return JsonResponse({"status": "error"}, status=500)


def handle_payment_failed(event):
    """
    Handle failed Razorpay payment.
    """
    try:
        payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payment_entity.get("id")
        order_id = payment_entity.get("order_id")
        subscription_id = payment_entity.get("subscription_id")

        payment = None
        if order_id:
            payment = Payment.objects.filter(razorpay_order_id=order_id).first()
        if not payment and subscription_id:
            payment = Payment.objects.filter(razorpay_subscription_id=subscription_id).first()

        if payment:
            payment.status = "failed"
            payment.razorpay_payment_id = payment_id or None
            payment.save()
            logger.warning("Payment failed for user %s", payment.user.email)

        return JsonResponse({"status": "ok"})

    except Exception as exc:
        logger.error("Error handling payment.failed: %s", exc)
        return JsonResponse({"status": "error"}, status=500)


def handle_subscription_activated(event):
    """
    Handle Razorpay subscription activation.
    """
    try:
        subscription_entity = event.get("payload", {}).get("subscription", {}).get("entity", {})
        subscription_id = subscription_entity.get("id")
        status = subscription_entity.get("status")

        logger.info("Subscription %s activated - status: %s", subscription_id, status)
        return JsonResponse({"status": "ok"})

    except Exception as exc:
        logger.error("Error handling subscription.activated: %s", exc)
        return JsonResponse({"status": "error"}, status=500)


def handle_subscription_charged(event):
    """
    Handle recurring subscription charge.
    """
    try:
        subscription_entity = event.get("payload", {}).get("subscription", {}).get("entity", {})
        subscription_id = subscription_entity.get("id")
        status = subscription_entity.get("status")

        logger.info("Subscription %s charged - status: %s", subscription_id, status)
        return JsonResponse({"status": "ok"})

    except Exception as exc:
        logger.error("Error handling subscription.charged: %s", exc)
        return JsonResponse({"status": "error"}, status=500)


def handle_subscription_cancelled(event):
    """
    Handle subscription cancellation.
    """
    try:
        subscription_entity = event.get("payload", {}).get("subscription", {}).get("entity", {})
        subscription_id = subscription_entity.get("id")

        logger.info("Subscription %s cancelled", subscription_id)
        return JsonResponse({"status": "ok"})

    except Exception as exc:
        logger.error("Error handling subscription.cancelled: %s", exc)
        return JsonResponse({"status": "error"}, status=500)


def handle_invoice_paid(event):
    """
    Handle successful invoice payment.
    """
    try:
        invoice_obj = event.get("payload", {}).get("invoice", {}).get("entity", {})
        invoice_id = invoice_obj.get("id")

        invoice = Invoice.objects.filter(
            razorpay_invoice_id=invoice_id
        ).first()
        
        if invoice:
            invoice.status = "paid"
            invoice.paid_at = timezone.now()
            invoice.save()
            logger.info(f"Invoice {invoice_id} marked as paid")
        
        return JsonResponse({"status": "ok"})
        
    except Exception as e:
        logger.error(f"Error handling invoice.payment_succeeded: {e}")
        return JsonResponse({"status": "error"}, status=500)


def handle_invoice_failed(event):
    """
    Handle failed invoice payment.
    """
    try:
        invoice_obj = event.get("payload", {}).get("invoice", {}).get("entity", {})
        invoice_id = invoice_obj.get("id")

        invoice = Invoice.objects.filter(
            razorpay_invoice_id=invoice_id
        ).first()
        
        if invoice:
            invoice.status = "uncollectible"
            invoice.save()
            logger.warning(f"Invoice {invoice_id} payment failed")
        
        return JsonResponse({"status": "ok"})
        
    except Exception as e:
        logger.error(f"Error handling invoice.payment_failed: {e}")
        return JsonResponse({"status": "error"}, status=500)
