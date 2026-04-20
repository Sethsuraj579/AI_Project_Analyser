import json
from unittest.mock import Mock, patch

import pytest
from django.contrib.auth.models import User
from django.test import RequestFactory

from analyser.models import AnalysisRun, MetricSnapshot, Plan, Project, UserSubscription
from analyser.report_views import (
    _build_dimension_bar_chart,
    _build_grade_pie_chart,
    _get_authenticated_user,
    download_project_report_pdf,
)


@pytest.mark.django_db
class TestReportViewHelpers:
    def setup_method(self):
        self.factory = RequestFactory()

    def test_get_authenticated_user_requires_bearer_header(self):
        request = self.factory.get("/api/projects/x/report/pdf/")

        user = _get_authenticated_user(request)

        assert user is None

    def test_get_authenticated_user_invalid_token_returns_none(self):
        request = self.factory.get(
            "/api/projects/x/report/pdf/",
            HTTP_AUTHORIZATION="Bearer invalid-token",
        )

        with patch("analyser.report_views.get_user_by_token", side_effect=Exception("bad token")):
            user = _get_authenticated_user(request)

        assert user is None

    def test_get_authenticated_user_valid_token_returns_user(self):
        request = self.factory.get(
            "/api/projects/x/report/pdf/",
            HTTP_AUTHORIZATION="Bearer valid-token",
        )
        mock_user = Mock()
        mock_user.is_authenticated = True

        with patch("analyser.report_views.get_user_by_token", return_value=mock_user):
            user = _get_authenticated_user(request)

        assert user is mock_user


@pytest.mark.django_db
class TestReportDownloadView:
    def setup_method(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(username="reportuser", password="pass12345", email="r@example.com")
        self.project = Project.objects.create(user=self.user, name="Repo A", description="desc")

    def _request(self):
        return self.factory.get("/api/projects/any/report/pdf/")

    def test_download_requires_authentication(self):
        request = self._request()

        with patch("analyser.report_views._get_authenticated_user", return_value=None):
            response = download_project_report_pdf(request, self.project.id)

        assert response.status_code == 401
        assert json.loads(response.content)["error"] == "Authentication required."

    def test_download_for_free_plan_returns_403_upgrade_required(self):
        free_plan = Plan.objects.create(
            name="free",
            max_projects=2,
            max_analyses_per_month=5,
            price_per_month=0,
        )
        UserSubscription.objects.create(user=self.user, plan=free_plan, is_active=True)

        request = self._request()
        with patch("analyser.report_views._get_authenticated_user", return_value=self.user):
            response = download_project_report_pdf(request, self.project.id)

        assert response.status_code == 403
        payload = json.loads(response.content)
        assert payload["upgradeRequired"] is True

    def test_download_without_subscription_returns_403(self):
        request = self._request()

        with patch("analyser.report_views._get_authenticated_user", return_value=self.user):
            response = download_project_report_pdf(request, self.project.id)

        assert response.status_code == 403
        payload = json.loads(response.content)
        assert payload["upgradeRequired"] is True

    def test_download_unknown_project_returns_404(self):
        basic = Plan.objects.create(
            name="basic",
            max_projects=10,
            max_analyses_per_month=100,
            price_per_month=99,
        )
        UserSubscription.objects.create(user=self.user, plan=basic, is_active=True)

        request = self._request()
        with patch("analyser.report_views._get_authenticated_user", return_value=self.user):
            response = download_project_report_pdf(
                request,
                "00000000-0000-0000-0000-000000000000",
            )

        assert response.status_code == 404

    def test_download_pdf_without_completed_run_returns_pdf(self):
        basic = Plan.objects.create(
            name="basic",
            max_projects=10,
            max_analyses_per_month=100,
            price_per_month=99,
        )
        UserSubscription.objects.create(user=self.user, plan=basic, is_active=True)

        request = self._request()
        with patch("analyser.report_views._get_authenticated_user", return_value=self.user):
            response = download_project_report_pdf(request, self.project.id)

        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        assert "attachment; filename=" in response["Content-Disposition"]

    def test_download_pdf_with_completed_run_returns_pdf(self):
        basic = Plan.objects.create(
            name="basic",
            max_projects=10,
            max_analyses_per_month=100,
            price_per_month=99,
        )
        UserSubscription.objects.create(user=self.user, plan=basic, is_active=True)

        run = AnalysisRun.objects.create(
            project=self.project,
            status="completed",
            overall_score=87.2,
            overall_grade="A",
        )
        MetricSnapshot.objects.create(
            analysis_run=run,
            dimension="frontend",
            metric_name="Frontend_load_time",
            raw_value=123.0,
            unit="ms",
            normalised_score=90.0,
            grade="A",
            weight=0.15,
        )

        request = self._request()
        with patch("analyser.report_views._get_authenticated_user", return_value=self.user):
            response = download_project_report_pdf(request, self.project.id)

        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"


@pytest.mark.django_db
class TestReportChartBuilders:
    def test_build_dimension_bar_chart(self):
        metric = Mock()
        metric.get_dimension_display.return_value = "Frontend"
        metric.normalised_score = 88.5

        drawing = _build_dimension_bar_chart([metric])

        assert drawing is not None
        assert len(drawing.contents) >= 2

    def test_build_grade_pie_chart_with_values(self):
        m1 = Mock(grade="A")
        m2 = Mock(grade="B")
        drawing = _build_grade_pie_chart([m1, m2])

        assert drawing is not None
        assert len(drawing.contents) >= 2

    def test_build_grade_pie_chart_with_empty_values(self):
        drawing = _build_grade_pie_chart([])

        assert drawing is not None
        assert len(drawing.contents) >= 2
