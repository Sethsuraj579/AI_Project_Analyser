import json
from unittest.mock import patch

import pytest
from django.contrib.auth.models import User
from django.test import Client

from analyser.models import AnalysisRun, OutboundWebhook, Plan, Project, ProjectSummary, UserSubscription


@pytest.mark.django_db
class TestGraphQLExtendedMutations:
    def setup_method(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="extuser",
            password="testpass123",
            email="ext@example.com",
        )
        self.free_plan, _ = Plan.objects.get_or_create(
            name="free",
            defaults={"max_projects": 2, "max_analyses_per_month": 10, "price_per_month": 0},
        )
        self.basic_plan, _ = Plan.objects.get_or_create(
            name="basic",
            defaults={"max_projects": 10, "max_analyses_per_month": 100, "price_per_month": 99},
        )
        self.premium_plan, _ = Plan.objects.get_or_create(
            name="premium",
            defaults={"max_projects": -1, "max_analyses_per_month": -1, "price_per_month": 199},
        )
        UserSubscription.objects.update_or_create(
            user=self.user,
            defaults={"plan": self.basic_plan, "is_active": True},
        )
        self.project = Project.objects.create(user=self.user, name="Extended Project", description="d")
        self.token = self._get_token()

    def _graphql(self, query, variables=None, token=None):
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
        kwargs = {"content_type": "application/json"}
        if token:
            kwargs["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        resp = self.client.post("/graphql/", data=json.dumps(payload), **kwargs)
        return json.loads(resp.content)

    def _get_token(self):
        data = self._graphql(
            """
            mutation {
              tokenAuth(username: \"extuser\", password: \"testpass123\") {
                token
              }
            }
            """
        )
        return data["data"]["tokenAuth"]["token"]

    def test_update_project_success(self):
        data = self._graphql(
            """
            mutation($id: UUID!) {
              updateProject(id: $id, name: \"Updated Name\") {
                success
                project { id name }
              }
            }
            """,
            variables={"id": str(self.project.id)},
            token=self.token,
        )

        assert data["data"]["updateProject"]["success"] is True
        assert data["data"]["updateProject"]["project"]["name"] == "Updated Name"

    def test_update_project_not_found(self):
        data = self._graphql(
            """
            mutation {
              updateProject(id: \"00000000-0000-0000-0000-000000000000\", name: \"Nope\") {
                success
                project { id }
              }
            }
            """,
            token=self.token,
        )

        assert data["data"]["updateProject"]["success"] is False
        assert data["data"]["updateProject"]["project"] is None

    def test_delete_project_success(self):
        project = Project.objects.create(user=self.user, name="Delete Me")
        data = self._graphql(
            """
            mutation($id: UUID!) {
              deleteProject(id: $id) {
                success
              }
            }
            """,
            variables={"id": str(project.id)},
            token=self.token,
        )

        assert data["data"]["deleteProject"]["success"] is True
        assert not Project.objects.filter(id=project.id).exists()

    @patch("analyser.schema.run_analysis_for_user_project")
    def test_run_analysis_success(self, mock_run_analysis):
        run = AnalysisRun.objects.create(project=self.project, status="completed", overall_score=80.0, overall_grade="B")
        mock_run_analysis.return_value = {
            "analysis_run": run,
            "async_dispatched": False,
            "success": True,
            "message": "Analysis complete",
        }

        data = self._graphql(
            """
            mutation($projectId: UUID!) {
              runAnalysis(projectId: $projectId) {
                success
                asyncDispatched
                message
                analysisRun { id overallGrade }
              }
            }
            """,
            variables={"projectId": str(self.project.id)},
            token=self.token,
        )

        payload = data["data"]["runAnalysis"]
        assert payload["success"] is True
        assert payload["message"] == "Analysis complete"
        assert payload["analysisRun"]["id"] == str(run.id)

    @patch("analyser.schema.generate_summary_for_user_project")
    def test_generate_project_summary_success(self, mock_generate_summary):
        summary = ProjectSummary.objects.create(project=self.project, summary="Looks good")
        mock_generate_summary.return_value = {
            "project_summary": summary,
            "async_dispatched": False,
            "success": True,
            "message": "Summary generated",
        }

        data = self._graphql(
            """
            mutation($projectId: UUID!) {
              generateProjectSummary(projectId: $projectId) {
                success
                message
                asyncDispatched
                projectSummary { summary }
              }
            }
            """,
            variables={"projectId": str(self.project.id)},
            token=self.token,
        )

        payload = data["data"]["generateProjectSummary"]
        assert payload["success"] is True
        assert payload["projectSummary"]["summary"] == "Looks good"

    def test_create_and_update_and_test_and_delete_outbound_webhook(self):
        create_data = self._graphql(
            """
            mutation {
              createOutboundWebhook(
                name: \"Primary\"
                url: \"https://example.com/hook\"
                secret: \"shh\"
                eventTypes: [\"analysis.completed\"]
                isActive: true
              ) {
                success
                message
                webhook { id name url isActive }
              }
            }
            """,
            token=self.token,
        )
        assert create_data["data"]["createOutboundWebhook"]["success"] is True
        webhook_id = create_data["data"]["createOutboundWebhook"]["webhook"]["id"]

        update_data = self._graphql(
            """
            mutation($id: ID!) {
              updateOutboundWebhook(webhookId: $id, name: \"Updated\", isActive: false) {
                success
                webhook { id name isActive }
              }
            }
            """,
            variables={"id": webhook_id},
            token=self.token,
        )
        assert update_data["data"]["updateOutboundWebhook"]["success"] is True
        assert update_data["data"]["updateOutboundWebhook"]["webhook"]["name"] == "Updated"

        with patch("analyser.tasks.send_outbound_webhooks_async.delay") as mock_delay:
            test_data = self._graphql(
                """
                mutation($id: ID!) {
                  testOutboundWebhook(webhookId: $id) {
                    success
                    message
                  }
                }
                """,
                variables={"id": webhook_id},
                token=self.token,
            )
            assert test_data["data"]["testOutboundWebhook"]["success"] is True
            mock_delay.assert_called_once()

        delete_data = self._graphql(
            """
            mutation($id: ID!) {
              deleteOutboundWebhook(webhookId: $id) {
                success
                message
              }
            }
            """,
            variables={"id": webhook_id},
            token=self.token,
        )
        assert delete_data["data"]["deleteOutboundWebhook"]["success"] is True
        assert not OutboundWebhook.objects.filter(id=webhook_id).exists()

    def test_upgrade_plan_invalid_then_valid(self):
        invalid_data = self._graphql(
            """
            mutation {
              upgradePlan(planName: \"gold\") {
                success
                message
                subscription { id }
              }
            }
            """,
            token=self.token,
        )
        assert invalid_data["data"]["upgradePlan"]["success"] is False

        valid_data = self._graphql(
            """
            mutation {
              upgradePlan(planName: \"premium\") {
                success
                message
                subscription { plan { name } }
              }
            }
            """,
            token=self.token,
        )
        assert valid_data["data"]["upgradePlan"]["success"] is True
        assert valid_data["data"]["upgradePlan"]["subscription"]["plan"]["name"] == "PREMIUM"

    def test_create_razorpay_order_free_plan_branch(self):
        data = self._graphql(
            """
            mutation {
              createRazorpayOrder(planName: \"free\") {
                success
                message
                orderId
                subscriptionId
                payment { id }
              }
            }
            """,
            token=self.token,
        )

        payload = data["data"]["createRazorpayOrder"]
        assert payload["success"] is True
        assert payload["payment"] is None

    def test_verify_razorpay_payment_missing_ids(self):
        data = self._graphql(
            """
            mutation {
              verifyRazorpayPayment(
                razorpayPaymentId: \"pay_1\"
                razorpaySignature: \"sig_1\"
              ) {
                success
                message
                payment { id }
              }
            }
            """,
            token=self.token,
        )

        payload = data["data"]["verifyRazorpayPayment"]
        assert payload["success"] is False
        assert payload["payment"] is None
