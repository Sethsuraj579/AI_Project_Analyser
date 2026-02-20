"""
Tests for Django models.
"""
import pytest
from analyser.models import Project, AnalysisRun, MetricSnapshot, HistoricalTrend
from .factories import ProjectFactory, AnalysisRunFactory, MetricSnapshotFactory


@pytest.mark.django_db
class TestProjectModel:

    def test_create_project(self):
        project = ProjectFactory(name="My App")
        assert project.name == "My App"
        assert project.id is not None

    def test_str(self):
        project = ProjectFactory(name="Test App")
        assert str(project) == "Test App"

    def test_ordering(self):
        p1 = ProjectFactory(name="First")
        p2 = ProjectFactory(name="Second")
        projects = list(Project.objects.all())
        # Newest first
        assert projects[0].name == "Second"


@pytest.mark.django_db
class TestAnalysisRunModel:

    def test_create_run(self):
        run = AnalysisRunFactory(overall_score=85.5, overall_grade="A")
        assert run.status == "completed"
        assert run.overall_score == 85.5

    def test_relationship(self):
        run = AnalysisRunFactory()
        assert run.project is not None
        assert run in run.project.analysis_runs.all()


@pytest.mark.django_db
class TestMetricSnapshotModel:

    def test_create_metric(self):
        metric = MetricSnapshotFactory()
        assert metric.dimension == "frontend"
        assert metric.raw_value == 500.0
        assert metric.grade == "A"

    def test_str(self):
        metric = MetricSnapshotFactory(dimension="backend", metric_name="Backend_proc_time", raw_value=200, unit="ms")
        assert "backend" in str(metric)
