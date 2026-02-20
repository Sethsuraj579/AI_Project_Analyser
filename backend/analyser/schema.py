"""
GraphQL schema for the Analyser app.
Provides types, queries, and mutations for projects, analysis runs, metrics, and trends.
Includes JWT authentication for mutations.
"""
import graphene
import graphql_jwt
from graphene_django import DjangoObjectType
from graphene import relay
from .models import Project, AnalysisRun, MetricSnapshot, HistoricalTrend
from .engine import run_full_analysis, DIMENSION_CONFIG


# ──────────────────────────────────────────────────────────────
# Auth helpers
# ──────────────────────────────────────────────────────────────


def _require_auth(info):
    """Raise an error if the user is not authenticated."""
    user = info.context.user
    if not user or not user.is_authenticated:
        raise Exception("Authentication required. Please provide a valid JWT token.")
    return user


# ──────────────────────────────────────────────────────────────
# GraphQL Types
# ──────────────────────────────────────────────────────────────


class MetricSnapshotType(DjangoObjectType):
    class Meta:
        model = MetricSnapshot
        fields = "__all__"

    details_json = graphene.String()

    def resolve_details_json(self, info):
        import json
        return json.dumps(self.details)


class AnalysisRunType(DjangoObjectType):
    class Meta:
        model = AnalysisRun
        fields = "__all__"

    metrics = graphene.List(MetricSnapshotType)

    def resolve_metrics(self, info):
        return self.metrics.all()


class HistoricalTrendType(DjangoObjectType):
    class Meta:
        model = HistoricalTrend
        fields = "__all__"


class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = "__all__"

    analysis_runs = graphene.List(AnalysisRunType)
    trends = graphene.List(
        HistoricalTrendType,
        dimension=graphene.String(),
        limit=graphene.Int(),
    )
    latest_run = graphene.Field(AnalysisRunType)

    def resolve_analysis_runs(self, info):
        return self.analysis_runs.all()[:20]

    def resolve_trends(self, info, dimension=None, limit=50):
        qs = self.trends.all()
        if dimension:
            qs = qs.filter(dimension=dimension)
        return qs[:limit]

    def resolve_latest_run(self, info):
        return self.analysis_runs.filter(status="completed").first()


class DimensionConfigType(graphene.ObjectType):
    """Exposes dimension configuration to the frontend."""
    dimension = graphene.String()
    metric_name = graphene.String()
    unit = graphene.String()
    weight = graphene.Float()
    threshold_good = graphene.Float()
    threshold_warning = graphene.Float()
    threshold_critical = graphene.Float()
    higher_is_better = graphene.Boolean()


# ──────────────────────────────────────────────────────────────
# Queries (public — read-only)
# ──────────────────────────────────────────────────────────────


class Query(graphene.ObjectType):
    all_projects = graphene.List(ProjectType)
    project = graphene.Field(ProjectType, id=graphene.UUID(required=True))
    analysis_run = graphene.Field(AnalysisRunType, id=graphene.UUID(required=True))
    dimension_configs = graphene.List(DimensionConfigType)
    me = graphene.String(description="Return current authenticated user's username")

    # Trends for a project
    trends = graphene.List(
        HistoricalTrendType,
        project_id=graphene.UUID(required=True),
        dimension=graphene.String(),
        limit=graphene.Int(),
    )

    def resolve_all_projects(self, info):
        return Project.objects.all()

    def resolve_project(self, info, id):
        return Project.objects.filter(id=id).first()

    def resolve_analysis_run(self, info, id):
        return AnalysisRun.objects.filter(id=id).first()

    def resolve_dimension_configs(self, info):
        result = []
        for dim, cfg in DIMENSION_CONFIG.items():
            result.append(
                DimensionConfigType(
                    dimension=dim,
                    metric_name=cfg["metric_name"],
                    unit=cfg["unit"],
                    weight=cfg["weight"],
                    threshold_good=cfg["thresholds"]["good"],
                    threshold_warning=cfg["thresholds"]["warning"],
                    threshold_critical=cfg["thresholds"]["critical"],
                    higher_is_better=cfg.get("higher_is_better", False),
                )
            )
        return result

    def resolve_trends(self, info, project_id, dimension=None, limit=50):
        qs = HistoricalTrend.objects.filter(project_id=project_id)
        if dimension:
            qs = qs.filter(dimension=dimension)
        return qs[:limit]

    def resolve_me(self, info):
        user = info.context.user
        if user.is_authenticated:
            return user.username
        return None


# ──────────────────────────────────────────────────────────────
# Mutations (authenticated — require JWT)
# ──────────────────────────────────────────────────────────────


class CreateProject(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String()
        repo_url = graphene.String()
        frontend_url = graphene.String()
        backend_url = graphene.String()

    project = graphene.Field(ProjectType)

    def mutate(self, info, name, description="", repo_url="", frontend_url="", backend_url=""):
        _require_auth(info)
        project = Project.objects.create(
            name=name,
            description=description,
            repo_url=repo_url,
            frontend_url=frontend_url,
            backend_url=backend_url,
        )
        return CreateProject(project=project)


class UpdateProject(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
        name = graphene.String()
        description = graphene.String()
        repo_url = graphene.String()
        frontend_url = graphene.String()
        backend_url = graphene.String()

    project = graphene.Field(ProjectType)

    def mutate(self, info, id, **kwargs):
        _require_auth(info)
        project = Project.objects.get(id=id)
        for key, value in kwargs.items():
            if value is not None:
                setattr(project, key, value)
        project.save()
        return UpdateProject(project=project)


class DeleteProject(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        _require_auth(info)
        Project.objects.filter(id=id).delete()
        return DeleteProject(success=True)


class RunAnalysis(graphene.Mutation):
    """Trigger a full analysis run for a project.
    If Celery is available, dispatches async; otherwise runs synchronously.
    """

    class Arguments:
        project_id = graphene.UUID(required=True)

    analysis_run = graphene.Field(AnalysisRunType)
    async_dispatched = graphene.Boolean(description="True if dispatched to Celery queue")

    def mutate(self, info, project_id):
        _require_auth(info)
        project = Project.objects.get(id=project_id)

        # Try async dispatch via Celery first
        try:
            from .tasks import run_analysis_async
            run_analysis_async.delay(str(project_id))

            # Create a pending run so the frontend can poll
            pending_run = AnalysisRun.objects.create(
                project=project,
                status="pending",
            )
            return RunAnalysis(analysis_run=pending_run, async_dispatched=True)
        except Exception:
            # Celery not available — fall back to synchronous execution
            analysis_run = run_full_analysis(project)
            return RunAnalysis(analysis_run=analysis_run, async_dispatched=False)


class Mutation(graphene.ObjectType):
    # JWT auth mutations
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

    # App mutations (authenticated)
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()
    delete_project = DeleteProject.Field()
    run_analysis = RunAnalysis.Field()
