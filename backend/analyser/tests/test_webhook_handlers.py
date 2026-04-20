from datetime import date

import pytest
from django.contrib.auth.models import User

from analyser.models import Invoice, Payment, Plan, UserSubscription
from analyser.webhook_handlers import (
    handle_invoice_failed,
    handle_invoice_paid,
    handle_payment_captured,
    handle_payment_failed,
    handle_webhook,
)


@pytest.mark.django_db
class TestWebhookHandlers:
    def setup_method(self):
        self.user = User.objects.create_user(username="webhook-user", password="pass12345")
        self.basic = Plan.objects.create(
            name="basic",
            max_projects=10,
            max_analyses_per_month=100,
            price_per_month=99,
        )
        self.premium = Plan.objects.create(
            name="premium",
            max_projects=-1,
            max_analyses_per_month=-1,
            price_per_month=199,
        )

    def test_handle_unknown_event_returns_ok(self):
        response = handle_webhook(None, b"{}", {"event": "unknown.event"})

        assert response.status_code == 200

    def test_payment_captured_updates_payment_and_subscription_basic(self):
        payment = Payment.objects.create(
            user=self.user,
            plan=self.basic,
            amount=99,
            razorpay_order_id="order_basic_1",
            status="pending",
        )

        event = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_basic_1",
                        "order_id": "order_basic_1",
                    }
                }
            },
        }

        response = handle_payment_captured(event)
        payment.refresh_from_db()
        subscription = UserSubscription.objects.get(user=self.user)

        assert response.status_code == 200
        assert payment.status == "succeeded"
        assert payment.razorpay_payment_id == "pay_basic_1"
        assert subscription.plan == self.basic
        assert subscription.is_active is True
        assert subscription.renews_at is not None
        assert subscription.projects_used == 0
        assert subscription.analyses_used == 0

    def test_payment_captured_updates_payment_and_subscription_premium(self):
        Payment.objects.create(
            user=self.user,
            plan=self.premium,
            amount=199,
            razorpay_subscription_id="sub_premium_1",
            status="pending",
        )

        event = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_premium_1",
                        "subscription_id": "sub_premium_1",
                    }
                }
            },
        }

        response = handle_payment_captured(event)
        subscription = UserSubscription.objects.get(user=self.user)

        assert response.status_code == 200
        assert subscription.plan == self.premium
        assert subscription.renews_at is None

    def test_payment_failed_marks_payment_failed(self):
        payment = Payment.objects.create(
            user=self.user,
            plan=self.basic,
            amount=99,
            razorpay_order_id="order_fail_1",
            status="pending",
        )

        event = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_fail_1",
                        "order_id": "order_fail_1",
                    }
                }
            },
        }

        response = handle_payment_failed(event)
        payment.refresh_from_db()

        assert response.status_code == 200
        assert payment.status == "failed"
        assert payment.razorpay_payment_id == "pay_fail_1"

    def test_invoice_paid_marks_invoice_paid(self):
        subscription = UserSubscription.objects.create(user=self.user, plan=self.basic, is_active=True)
        payment = Payment.objects.create(
            user=self.user,
            plan=self.basic,
            amount=99,
            razorpay_order_id="order_invoice_paid",
            status="succeeded",
        )
        invoice = Invoice.objects.create(
            user=self.user,
            subscription=subscription,
            payment=payment,
            amount=99,
            status="open",
            razorpay_invoice_id="inv_1",
            due_date=date.today(),
        )

        event = {
            "event": "invoice.paid",
            "payload": {
                "invoice": {
                    "entity": {
                        "id": "inv_1",
                    }
                }
            },
        }

        response = handle_invoice_paid(event)
        invoice.refresh_from_db()

        assert response.status_code == 200
        assert invoice.status == "paid"
        assert invoice.paid_at is not None

    def test_invoice_failed_marks_invoice_uncollectible(self):
        subscription = UserSubscription.objects.create(user=self.user, plan=self.basic, is_active=True)
        payment = Payment.objects.create(
            user=self.user,
            plan=self.basic,
            amount=99,
            razorpay_order_id="order_invoice_failed",
            status="pending",
        )
        invoice = Invoice.objects.create(
            user=self.user,
            subscription=subscription,
            payment=payment,
            amount=99,
            status="open",
            razorpay_invoice_id="inv_2",
            due_date=date.today(),
        )

        event = {
            "event": "invoice.payment_failed",
            "payload": {
                "invoice": {
                    "entity": {
                        "id": "inv_2",
                    }
                }
            },
        }

        response = handle_invoice_failed(event)
        invoice.refresh_from_db()

        assert response.status_code == 200
        assert invoice.status == "uncollectible"

    def test_payment_handler_error_path_returns_500(self):
        response = handle_payment_captured({"event": "payment.captured", "payload": {"payment": None}})

        assert response.status_code == 500

    def test_invoice_handler_error_path_returns_500(self):
        response = handle_invoice_paid({"event": "invoice.paid", "payload": {"invoice": None}})

        assert response.status_code == 500
