"""
Factory definitions for test data using factory-boy.
"""
import factory
from analyser.models import Project, AnalysisRun, MetricSnapshot, HistoricalTrend


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project

    user = factory.SubFactory('analyser.tests.factories.UserFactory')
    name = factory.Sequence(lambda n: f"Test Project {n}")
    description = factory.Faker("paragraph")
    repo_url = factory.LazyAttribute(lambda o: f"https://github.com/test/{o.name.lower().replace(' ', '-')}")
    frontend_url = ""
    backend_url = ""


from django.contrib.auth import get_user_model


from analyser.models import Plan, UserSubscription

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()
        skip_postgeneration_save = True
    username = factory.Sequence(lambda n: f"user{n}")
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')

    @factory.post_generation
    def subscription(self, create, extracted, **kwargs):
        if not create:
            return
        plan, _ = Plan.objects.get_or_create(
            name="basic",
            defaults={
                "max_projects": 10,
                "max_analyses_per_month": 100,
                "price_per_month": 0,
            },
        )
        UserSubscription.objects.update_or_create(
            user=self,
            defaults={"plan": plan, "is_active": True},
        )


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
