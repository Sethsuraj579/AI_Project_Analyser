"""
Razorpay payment utilities for handling payments and subscriptions.
"""
import logging
import time
from decimal import Decimal
from django.conf import settings
import razorpay

logger = logging.getLogger(__name__)


def _get_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ValueError("Razorpay keys are not configured.")
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_order(user, plan):
    """
    Create a Razorpay Order for a plan upgrade.

    Returns:
        Razorpay Order dict
    """
    client = _get_client()
    amount_paise = int(Decimal(plan.price_per_month) * 100)
    receipt = f"order_{user.id}_{plan.id}_{int(time.time())}"

    order = client.order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": {
                "user_id": str(user.id),
                "user_email": user.email,
                "plan_name": plan.name,
                "plan_id": str(plan.id),
            },
        }
    )

    logger.info("Created Razorpay order %s for user %s", order.get("id"), user.email)
    return order


def create_subscription(user, plan):
    """
    Create a Razorpay Subscription for a monthly plan.

    Returns:
        Razorpay Subscription dict
    """
    client = _get_client()
    amount_paise = int(Decimal(plan.price_per_month) * 100)

    razorpay_plan_id = plan.razorpay_plan_id
    if not razorpay_plan_id:
        plan_response = client.plan.create(
            {
                "period": "monthly",
                "interval": 1,
                "item": {
                    "name": f"{plan.name.upper()} Plan",
                    "amount": amount_paise,
                    "currency": "INR",
                    "description": plan.description or f"{plan.name} subscription",
                },
                "notes": {
                    "plan_id": str(plan.id),
                    "plan_name": plan.name,
                },
            }
        )
        razorpay_plan_id = plan_response["id"]
        plan.razorpay_plan_id = razorpay_plan_id
        plan.save(update_fields=["razorpay_plan_id", "updated_at"])
        logger.info("Cached Razorpay plan ID %s for local plan %s", razorpay_plan_id, plan.name)

    total_count = 12 if plan.name == "basic" else 120

    subscription = client.subscription.create(
        {
            "plan_id": razorpay_plan_id,
            "total_count": total_count,
            "quantity": 1,
            "customer_notify": 1,
            "notes": {
                "user_id": str(user.id),
                "user_email": user.email,
                "plan_id": str(plan.id),
                "plan_name": plan.name,
            },
        }
    )

    logger.info("Created Razorpay subscription %s for user %s", subscription.get("id"), user.email)
    return subscription


def verify_payment_signature(params):
    """
    Verify Razorpay payment signature for order/subscription checkout.

    Args:
        params: dict with razorpay_order_id or razorpay_subscription_id,
                razorpay_payment_id, razorpay_signature
    """
    client = _get_client()
    client.utility.verify_payment_signature(params)


def verify_webhook_signature(payload, signature):
    """
    Verify Razorpay webhook signature.
    """
    client = _get_client()
    client.utility.verify_webhook_signature(payload, signature, settings.RAZORPAY_WEBHOOK_SECRET)
