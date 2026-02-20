"""
Factory definitions for test data using factory-boy.
"""
import factory
from analyser.models import Project, AnalysisRun, MetricSnapshot, HistoricalTrend


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project

    name = factory.Sequence(lambda n: f"Test Project {n}")
    description = factory.Faker("paragraph")
    repo_url = factory.LazyAttribute(lambda o: f"https://github.com/test/{o.name.lower().replace(' ', '-')}")
    frontend_url = ""
    backend_url = ""


class AnalysisRunFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AnalysisRun

    project = factory.SubFactory(ProjectFactory)
    status = "completed"
    overall_score = factory.Faker("pyfloat", min_value=30, max_value=100)
    overall_grade = "B"


class MetricSnapshotFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MetricSnapshot

    analysis_run = factory.SubFactory(AnalysisRunFactory)
    dimension = "frontend"
    metric_name = "Frontend_load_time"
    raw_value = 500.0
    unit = "ms"
    weight = 0.15
    normalised_score = 85.0
    grade = "A"
    threshold_good = 1000
    threshold_warning = 3000
    threshold_critical = 6000
    details = {"source": "test"}
