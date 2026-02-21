"""
GraphQL schema for the Analyser app.
Provides types, queries, and mutations for projects, analysis runs, metrics, and trends.
Includes JWT authentication for mutations.
Includes user registration with OTP and Google OAuth.
"""
import graphene
import graphql_jwt
import logging
from graphene_django import DjangoObjectType
from graphene import relay
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings as django_settings
from .models import Project, AnalysisRun, MetricSnapshot, HistoricalTrend, EmailOTP
from .engine import run_full_analysis, DIMENSION_CONFIG

logger = logging.getLogger("analyser.auth")


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


# ──────────────────────────────────────────────────────────────
# Registration, OTP & Google OAuth mutations
# ──────────────────────────────────────────────────────────────


class SendOTP(graphene.Mutation):
    """Send a 6-digit OTP to the given email for verification."""

    class Arguments:
        email = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, email):
        email = email.strip().lower()
        if not email or "@" not in email:
            return SendOTP(success=False, message="Invalid email address.")

        otp = EmailOTP.generate(email)

        # Try to send email; fall back to console/log if not configured
        try:
            send_mail(
                subject="AI Project Analyser — Your Verification Code",
                message=f"Your OTP verification code is: {otp.otp_code}\n\nThis code expires in 10 minutes.",
                from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", "noreply@analyser.local"),
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info("OTP email sent to %s", email)
        except Exception as exc:
            # In development, log the OTP to console so it can still be used
            logger.warning("Email send failed (%s). OTP for %s: %s", exc, email, otp.otp_code)

        return SendOTP(success=True, message="OTP sent to your email. Check your inbox (or server logs in dev mode).")


class VerifyOTP(graphene.Mutation):
    """Verify an OTP code for an email address."""

    class Arguments:
        email = graphene.String(required=True)
        otp_code = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, email, otp_code):
        email = email.strip().lower()
        if EmailOTP.verify(email, otp_code.strip()):
            return VerifyOTP(success=True, message="Email verified successfully.")
        return VerifyOTP(success=False, message="Invalid or expired OTP code.")


class RegisterUser(graphene.Mutation):
    """Register a new user. Requires a verified OTP for the given email."""

    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        otp_code = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()
    token = graphene.String()

    def mutate(self, info, username, email, password, otp_code):
        email = email.strip().lower()
        username = username.strip()

        # Validate OTP
        if not EmailOTP.verify(email, otp_code.strip()):
            return RegisterUser(success=False, message="Invalid or expired OTP. Please request a new one.", token=None)

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return RegisterUser(success=False, message="Username already taken.", token=None)

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return RegisterUser(success=False, message="An account with this email already exists.", token=None)

        # Password validation
        if len(password) < 8:
            return RegisterUser(success=False, message="Password must be at least 8 characters.", token=None)

        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)

        # Generate JWT token for immediate login
        from graphql_jwt.shortcuts import get_token
        token = get_token(user)

        logger.info("New user registered: %s (%s)", username, email)
        return RegisterUser(success=True, message="Account created successfully!", token=token)


class GoogleAuth(graphene.Mutation):
    """Authenticate or register via Google OAuth. Verifies the Google ID token server-side."""

    class Arguments:
        google_token = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()
    token = graphene.String()
    is_new_user = graphene.Boolean()

    def mutate(self, info, google_token):
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            google_client_id = getattr(django_settings, "GOOGLE_OAUTH_CLIENT_ID", "")
            if not google_client_id:
                return GoogleAuth(
                    success=False,
                    message="Google OAuth is not configured on the server.",
                    token=None,
                    is_new_user=False,
                )

            # Verify the Google ID token
            idinfo = id_token.verify_oauth2_token(
                google_token,
                google_requests.Request(),
                google_client_id,
            )

            email = idinfo.get("email", "").lower()
            name = idinfo.get("name", "")
            given_name = idinfo.get("given_name", "")

            if not email:
                return GoogleAuth(success=False, message="Could not retrieve email from Google.", token=None, is_new_user=False)

            # Check if user exists with this email
            is_new = False
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Auto-register with Google profile
                base_username = given_name.lower() or email.split("@")[0]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=None,  # No password for Google-only accounts
                )
                user.first_name = given_name
                user.last_name = idinfo.get("family_name", "")
                user.save()
                is_new = True
                logger.info("New Google user registered: %s (%s)", username, email)

            # Generate JWT
            from graphql_jwt.shortcuts import get_token
            token = get_token(user)

            return GoogleAuth(
                success=True,
                message="Welcome!" if not is_new else "Account created with Google!",
                token=token,
                is_new_user=is_new,
            )

        except ValueError as exc:
            logger.warning("Google token verification failed: %s", exc)
            return GoogleAuth(success=False, message="Invalid Google token.", token=None, is_new_user=False)
        except ImportError:
            return GoogleAuth(
                success=False,
                message="Google auth library not installed. Run: pip install google-auth",
                token=None,
                is_new_user=False,
            )
        except Exception as exc:
            logger.error("Google auth error: %s", exc)
            return GoogleAuth(success=False, message="Google authentication failed.", token=None, is_new_user=False)


class Mutation(graphene.ObjectType):
    # JWT auth mutations
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

    # Registration & OTP
    send_otp = SendOTP.Field()
    verify_otp_mutation = VerifyOTP.Field()
    register_user = RegisterUser.Field()
    google_auth = GoogleAuth.Field()

    # App mutations (authenticated)
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()
    delete_project = DeleteProject.Field()
    run_analysis = RunAnalysis.Field()
