import json
from unittest.mock import patch

import pytest
from django.http import JsonResponse
from django.test import RequestFactory

from analyser.payment_views import health_check, razorpay_webhook


@pytest.mark.django_db
class TestRazorpayWebhookView:
    def setup_method(self):
        self.factory = RequestFactory()

    def test_missing_signature_returns_400(self):
        request = self.factory.post(
            "/webhooks/razorpay/",
            data=json.dumps({"event": "payment.captured"}),
            content_type="application/json",
        )

        response = razorpay_webhook(request)

        assert response.status_code == 400
        assert json.loads(response.content) == {"error": "Missing signature"}

    def test_invalid_json_returns_400(self):
        request = self.factory.post(
            "/webhooks/razorpay/",
            data="{not-json}",
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE="sig",
        )

        response = razorpay_webhook(request)

        assert response.status_code == 400
        assert json.loads(response.content) == {"error": "Invalid payload"}

    @patch("analyser.payment_views.handle_webhook")
    @patch("analyser.payment_views.verify_webhook_signature")
    def test_valid_payload_delegates_to_handler(self, mock_verify, mock_handle):
        mock_handle.return_value = JsonResponse({"status": "ok"})
        payload = {"event": "payment.captured", "payload": {"payment": {"entity": {"id": "pay_1"}}}}

        request = self.factory.post(
            "/webhooks/razorpay/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE="valid-sig",
        )

        response = razorpay_webhook(request)

        assert response.status_code == 200
        assert json.loads(response.content) == {"status": "ok"}
        mock_verify.assert_called_once()
        mock_handle.assert_called_once()

    @patch("analyser.payment_views.verify_webhook_signature", side_effect=Exception("bad sig"))
    def test_signature_verification_error_returns_500(self, _mock_verify):
        payload = {"event": "payment.captured"}
        request = self.factory.post(
            "/webhooks/razorpay/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE="invalid",
        )

        response = razorpay_webhook(request)

        assert response.status_code == 500
        assert json.loads(response.content) == {"error": "Webhook processing failed"}


@pytest.mark.django_db
class TestHealthCheckView:
    def setup_method(self):
        self.factory = RequestFactory()

    def test_health_check_ok(self):
        request = self.factory.get("/health/")

        response = health_check(request)
        data = json.loads(response.content)

        assert response.status_code == 200
        assert data["status"] == "ok"
        assert data["checks"]["database"] == "ok"
        assert data["checks"]["cache"] == "ok"

    @patch("django.core.cache.cache.set", side_effect=Exception("cache down"))
    def test_health_check_degraded_when_cache_fails(self, _mock_cache_set):
        request = self.factory.get("/health/")

        response = health_check(request)
        data = json.loads(response.content)

        assert response.status_code == 200
        assert data["status"] == "degraded"
        assert data["checks"]["database"] == "ok"
        assert data["checks"]["cache"].startswith("error:")
