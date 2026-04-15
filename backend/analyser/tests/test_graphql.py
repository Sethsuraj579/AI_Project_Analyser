"""
Tests for GraphQL queries and mutations.
"""
import json
import pytest
from django.test import RequestFactory
from graphene_django.utils.testing import GraphQLTestCase
from django.contrib.auth.models import User
from analyser.models import Project, Plan, UserSubscription
from .factories import ProjectFactory, AnalysisRunFactory, MetricSnapshotFactory


@pytest.mark.django_db
class TestGraphQLQueries(GraphQLTestCase):
    GRAPHQL_URL = "/graphql/"

    def setUp(self):
        self.user = User.objects.create_user(username="queryuser", password="testpass123")
        plan, _ = Plan.objects.get_or_create(
            name="basic",
            defaults={"max_projects": 10, "max_analyses_per_month": 100, "price_per_month": 0},
        )
        UserSubscription.objects.update_or_create(
            user=self.user, defaults={"plan": plan, "is_active": True}
        )
        self.client.force_login(self.user)

    def test_all_projects_query(self):
        ProjectFactory.create_batch(3, user=self.user)
        response = self.query(
            """
            query {
                allProjects {
                    id
                    name
                }
            }
            """
        )
        content = json.loads(response.content)
        self.assertResponseNoErrors(response)
        assert len(content["data"]["allProjects"]) == 3

    def test_single_project_query(self):
        project = ProjectFactory(name="Test Project", user=self.user)
        response = self.query(
            """
            query($id: UUID!) {
                project(id: $id) {
                    name
                    description
                }
            }
            """,
            variables={"id": str(project.id)},
        )
        content = json.loads(response.content)
        self.assertResponseNoErrors(response)
        assert content["data"]["project"]["name"] == "Test Project"

    def test_dimension_configs_query(self):
        response = self.query(
            """
            query {
                dimensionConfigs {
                    dimension
                    metricName
                    weight
                }
            }
            """
        )
        content = json.loads(response.content)
        self.assertResponseNoErrors(response)
        assert len(content["data"]["dimensionConfigs"]) == 7

    def test_project_with_latest_run(self):
        project = ProjectFactory(user=self.user)
        run = AnalysisRunFactory(project=project, overall_score=90.0, overall_grade="A+")
        MetricSnapshotFactory(analysis_run=run, dimension="frontend")
        response = self.query(
            """
            query($id: UUID!) {
                project(id: $id) {
                    name
                    latestRun {
                        overallScore
                        overallGrade
                        metrics {
                            dimension
                            rawValue
                        }
                    }
                }
            }
            """,
            variables={"id": str(run.project.id)},
        )
        content = json.loads(response.content)
        self.assertResponseNoErrors(response)
        latest = content["data"]["project"]["latestRun"]
        assert latest["overallScore"] == 90.0

    def test_all_projects_latest_run_query_count(self):
        projects = ProjectFactory.create_batch(4, user=self.user)
        for project in projects:
            run = AnalysisRunFactory(project=project, overall_score=91.0, overall_grade="A")
            MetricSnapshotFactory(analysis_run=run, dimension="frontend")

        query = """
        query {
            allProjects {
                id
                name
                latestRun {
                    overallScore
                    metrics {
                        dimension
                        normalisedScore
                    }
                }
            }
        }
        """

        with self.assertNumQueries(5):
            response = self.query(query)

        content = json.loads(response.content)
        self.assertResponseNoErrors(response)
        assert len(content["data"]["allProjects"]) == 4


@pytest.mark.django_db
class TestGraphQLMutations(GraphQLTestCase):
    GRAPHQL_URL = "/graphql/"

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass123")
        plan, _ = Plan.objects.get_or_create(
            name="basic",
            defaults={"max_projects": 10, "max_analyses_per_month": 100, "price_per_month": 0},
        )
        UserSubscription.objects.update_or_create(
            user=self.user, defaults={"plan": plan, "is_active": True}
        )

    def _get_token(self):
        response = self.query(
            """
            mutation {
                tokenAuth(username: "testuser", password: "testpass123") {
                    token
                }
            }
            """
        )
        content = json.loads(response.content)
        token = content["data"]["tokenAuth"]["token"]
        return token

    def test_create_project_unauthenticated_fails(self):
        response = self.query(
            """
            mutation {
                createProject(name: "Unauthorized Project") {
                    project { id name }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert content.get("errors") is not None

    def test_create_project_authenticated(self):
        token = self._get_token()
        response = self.query(
            """
            mutation {
                createProject(name: "Auth Project", description: "Test") {
                    project { id name description }
                }
            }
            """,
            headers={"HTTP_AUTHORIZATION": f"Bearer {token}"},
        )
        content = json.loads(response.content)
        # If auth worked, no errors and project exists; if header passthrough
        # isn't supported by GraphQLTestCase, check via direct client
        if content.get("errors"):
            # Fall back to Django test client with auth header
            from django.test import Client
            client = Client()
            resp = client.post(
                "/graphql/",
                json.dumps({
                    "query": 'mutation { createProject(name: "Auth Project", description: "Test") { project { id name } } }'
                }),
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {token}",
            )
            data = json.loads(resp.content)
            assert data["data"]["createProject"]["project"]["name"] == "Auth Project"
        else:
            assert content["data"]["createProject"]["project"]["name"] == "Auth Project"

    def test_token_auth(self):
        response = self.query(
            """
            mutation {
                tokenAuth(username: "testuser", password: "testpass123") {
                    token
                }
            }
            """
        )
        content = json.loads(response.content)
        assert content["data"]["tokenAuth"]["token"] is not None