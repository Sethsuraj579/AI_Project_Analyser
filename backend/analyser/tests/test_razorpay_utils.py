from unittest.mock import Mock, patch

import pytest
from django.contrib.auth.models import User
from django.test import override_settings

from analyser.models import Plan
from analyser.razorpay_utils import (
    _get_client,
    create_order,
    create_subscription,
    verify_payment_signature,
    verify_webhook_signature,
)


@pytest.mark.django_db
class TestRazorpayUtils:
    @override_settings(RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET="")
    def test_get_client_raises_when_keys_missing(self):
        with pytest.raises(ValueError, match="Razorpay keys are not configured"):
            _get_client()

    @override_settings(RAZORPAY_KEY_ID="key", RAZORPAY_KEY_SECRET="secret")
    @patch("analyser.razorpay_utils.razorpay.Client")
    def test_get_client_returns_client(self, mock_client_cls):
        _get_client()
        mock_client_cls.assert_called_once_with(auth=("key", "secret"))

    @patch("analyser.razorpay_utils._get_client")
    def test_create_order_calls_razorpay_order_create(self, mock_get_client):
        fake_client = Mock()
        fake_client.order.create.return_value = {"id": "order_1"}
        mock_get_client.return_value = fake_client

        user = User.objects.create_user(username="u1", email="u1@example.com", password="pass12345")
        plan = Plan.objects.create(
            name="basic",
            max_projects=10,
            max_analyses_per_month=100,
            price_per_month=99,
        )

        order = create_order(user, plan)

        assert order["id"] == "order_1"
        fake_client.order.create.assert_called_once()
        payload = fake_client.order.create.call_args.args[0]
        assert payload["amount"] == 9900
        assert payload["currency"] == "INR"
        assert payload["notes"]["user_email"] == "u1@example.com"
        assert payload["notes"]["plan_name"] == "basic"

    @patch("analyser.razorpay_utils._get_client")
    def test_create_subscription_creates_remote_plan_when_missing_cached_id(self, mock_get_client):
        fake_client = Mock()
        fake_client.plan.create.return_value = {"id": "rp_plan_1"}
        fake_client.subscription.create.return_value = {"id": "sub_1"}
        mock_get_client.return_value = fake_client

        user = User.objects.create_user(username="u2", email="u2@example.com", password="pass12345")
        plan = Plan.objects.create(
            name="basic",
            max_projects=10,
            max_analyses_per_month=100,
            price_per_month=99,
            description="Basic plan",
        )

        subscription = create_subscription(user, plan)
        plan.refresh_from_db()

        assert subscription["id"] == "sub_1"
        assert plan.razorpay_plan_id == "rp_plan_1"
        fake_client.plan.create.assert_called_once()
        fake_client.subscription.create.assert_called_once()
        sub_payload = fake_client.subscription.create.call_args.args[0]
        assert sub_payload["plan_id"] == "rp_plan_1"
        assert sub_payload["total_count"] == 12

    @patch("analyser.razorpay_utils._get_client")
    def test_create_subscription_uses_cached_plan_id(self, mock_get_client):
        fake_client = Mock()
        fake_client.subscription.create.return_value = {"id": "sub_2"}
        mock_get_client.return_value = fake_client

        user = User.objects.create_user(username="u3", email="u3@example.com", password="pass12345")
        plan = Plan.objects.create(
            name="premium",
            max_projects=-1,
            max_analyses_per_month=-1,
            price_per_month=199,
            razorpay_plan_id="cached_plan_id",
        )

        subscription = create_subscription(user, plan)

        assert subscription["id"] == "sub_2"
        fake_client.plan.create.assert_not_called()
        sub_payload = fake_client.subscription.create.call_args.args[0]
        assert sub_payload["plan_id"] == "cached_plan_id"
        assert sub_payload["total_count"] == 120

    @patch("analyser.razorpay_utils._get_client")
    def test_verify_payment_signature_subscription_path(self, mock_get_client):
        fake_client = Mock()
        mock_get_client.return_value = fake_client

        params = {
            "razorpay_subscription_id": "sub_1",
            "razorpay_payment_id": "pay_1",
            "razorpay_signature": "sig",
        }
        verify_payment_signature(params)

        fake_client.utility.verify_subscription_payment_signature.assert_called_once_with(params)
        fake_client.utility.verify_payment_signature.assert_not_called()

    @patch("analyser.razorpay_utils._get_client")
    def test_verify_payment_signature_order_path(self, mock_get_client):
        fake_client = Mock()
        mock_get_client.return_value = fake_client

        params = {
            "razorpay_order_id": "order_1",
            "razorpay_payment_id": "pay_1",
            "razorpay_signature": "sig",
        }
        verify_payment_signature(params)

        fake_client.utility.verify_payment_signature.assert_called_once_with(params)
        fake_client.utility.verify_subscription_payment_signature.assert_not_called()

    @patch("analyser.razorpay_utils._get_client")
    def test_verify_payment_signature_raises_without_order_or_subscription(self, mock_get_client):
        mock_get_client.return_value = Mock()

        with pytest.raises(ValueError, match="Missing razorpay_order_id or razorpay_subscription_id"):
            verify_payment_signature({"razorpay_payment_id": "pay_1"})

    @override_settings(RAZORPAY_WEBHOOK_SECRET="whsec_123")
    @patch("analyser.razorpay_utils._get_client")
    def test_verify_webhook_signature(self, mock_get_client):
        fake_client = Mock()
        mock_get_client.return_value = fake_client

        payload = b'{"event":"payment.captured"}'
        signature = "sig_abc"
        verify_webhook_signature(payload, signature)

        fake_client.utility.verify_webhook_signature.assert_called_once_with(
            payload,
            signature,
            "whsec_123",
        )
