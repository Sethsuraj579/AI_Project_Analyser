import json
from unittest.mock import patch

import pytest
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.test import Client
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from analyser.models import Plan, UserSubscription


@pytest.mark.django_db
class TestPasswordResetMutations:
    def setup_method(self):
        self.client = Client(HTTP_HOST="localhost")
        self.user = User.objects.create_user(
            username="resetuser",
            password="oldpassword123",
            email="reset@example.com",
        )
        plan, _ = Plan.objects.get_or_create(
            name="basic",
            defaults={"max_projects": 10, "max_analyses_per_month": 100, "price_per_month": 0},
        )
        UserSubscription.objects.update_or_create(
            user=self.user,
            defaults={"plan": plan, "is_active": True},
        )

    def _graphql(self, query, variables=None, token=None):
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
        headers = {}
        if token:
            headers["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        response = self.client.post("/graphql/", data=json.dumps(payload), content_type="application/json", **headers)
        return json.loads(response.content)

    def test_request_password_reset_sends_reset_link(self):
        with patch("analyser.schema.send_mail") as mock_send_mail:
            data = self._graphql(
                """
                mutation($email: String!) {
                  requestPasswordReset(email: $email) {
                    success
                    message
                  }
                }
                """,
                variables={"email": "reset@example.com"},
            )

        payload = data["data"]["requestPasswordReset"]
        assert payload["success"] is True
        assert "password reset link" in payload["message"].lower()

        mock_send_mail.assert_called_once()
        message = mock_send_mail.call_args.kwargs["message"]
        assert "/reset-password?uid=" in message
        assert "token=" in message

    def test_reset_password_with_valid_token_updates_password(self):
        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        data = self._graphql(
            """
            mutation($uidb64: String!, $token: String!, $newPassword: String!) {
              resetPassword(uidb64: $uidb64, token: $token, newPassword: $newPassword) {
                success
                message
              }
            }
            """,
            variables={
                "uidb64": uidb64,
                "token": token,
                "newPassword": "newpassword123",
            },
        )

        payload = data["data"]["resetPassword"]
        assert payload["success"] is True

        self.user.refresh_from_db()
        assert self.user.check_password("newpassword123")

    def test_reset_password_rejects_invalid_token(self):
        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))

        data = self._graphql(
            """
            mutation($uidb64: String!, $token: String!, $newPassword: String!) {
              resetPassword(uidb64: $uidb64, token: $token, newPassword: $newPassword) {
                success
                message
              }
            }
            """,
            variables={
                "uidb64": uidb64,
                "token": "invalid-token",
                "newPassword": "newpassword123",
            },
        )

        payload = data["data"]["resetPassword"]
        assert payload["success"] is False
        self.user.refresh_from_db()
        assert self.user.check_password("oldpassword123")

    def test_reset_password_invalidates_existing_jwt(self):
        login_data = self._graphql(
            """
            mutation {
              loginUser(username: "resetuser", password: "oldpassword123") {
                success
                token
              }
            }
            """
        )
        old_token = login_data["data"]["loginUser"]["token"]

        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        reset_data = self._graphql(
            """
            mutation($uidb64: String!, $token: String!, $newPassword: String!) {
              resetPassword(uidb64: $uidb64, token: $token, newPassword: $newPassword) {
                success
              }
            }
            """,
            variables={
                "uidb64": uidb64,
                "token": token,
                "newPassword": "newpassword123",
            },
        )
        assert reset_data["data"]["resetPassword"]["success"] is True

        old_token_response = self._graphql(
            """
            mutation {
              createProject(name: "Should Fail") {
                success
                message
              }
            }
            """,
            token=old_token,
        )

        assert old_token_response.get("errors") is not None

        new_login = self._graphql(
            """
            mutation {
              loginUser(username: "resetuser", password: "newpassword123") {
                success
                token
              }
            }
            """
        )

        assert new_login["data"]["loginUser"]["success"] is True