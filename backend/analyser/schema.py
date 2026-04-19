"""
GraphQL schema for the Analyser app.
Provides types, queries, and mutations for projects, analysis runs, metrics, and trends.
Includes JWT authentication for mutations.
Includes user registration with OTP and Google OAuth.
Includes subscription/pricing plans and payment processing.
"""
import graphene
import graphql_jwt
import logging
from graphene_django import DjangoObjectType
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings as django_settings
from django.utils import timezone
from datetime import timedelta
from .query_utils import latest_completed_run, projects_with_latest_run
from .models import Project, AnalysisRun, MetricSnapshot, HistoricalTrend, EmailOTP, ProjectSummary, ChatMessage, Plan, UserSubscription, Payment, Invoice, UserProfile, UserPreferences, ContactMessage, FAQ, OutboundWebhook
from .engine import DIMENSION_CONFIG
from .razorpay_utils import create_order, create_subscription, verify_payment_signature
from .services.analysis_service import run_analysis_for_user_project
from .services.summary_service import generate_summary_for_user_project
from .services.comparison_service import compare_user_projects
from .services.webhook_service import (
    create_webhook_for_user,
    update_webhook_for_user,
    delete_webhook_for_user,
    test_webhook_for_user,
)

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


def _client_ip(info):
    request = info.context
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _check_auth_rate_limit(info, action, limit=5, window_seconds=600):
    ip_address = _client_ip(info)
    cache_key = f"auth-rate:{action}:{ip_address}"
    attempts = cache.get(cache_key, 0)

    if attempts >= limit:
        raise Exception("Too many attempts. Please wait and try again later.")

    if attempts == 0:
        cache.set(cache_key, 1, timeout=window_seconds)
        return

    try:
        cache.incr(cache_key)
    except ValueError:
        cache.set(cache_key, attempts + 1, timeout=window_seconds)


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


class ProjectSummaryType(DjangoObjectType):
    class Meta:
        model = ProjectSummary
        fields = "__all__"


class ChatMessageType(DjangoObjectType):
    class Meta:
        model = ChatMessage
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
    summary = graphene.Field(ProjectSummaryType)
    chat_messages = graphene.List(ChatMessageType)

    def resolve_analysis_runs(self, info):
        return self.analysis_runs.all()[:20]

    def resolve_trends(self, info, dimension=None, limit=50):
        qs = self.trends.all()
        if dimension:
            qs = qs.filter(dimension=dimension)
        return qs[:limit]

    def resolve_latest_run(self, info):
        return latest_completed_run(self)

    def resolve_summary(self, info):
        return getattr(self, 'summary', None)

    def resolve_chat_messages(self, info):
        return self.chat_messages.all()[:50]


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


class PlanType(DjangoObjectType):
    """Subscription plan details."""
    class Meta:
        model = Plan
        fields = "__all__"


class UserSubscriptionType(DjangoObjectType):
    """User's subscription details."""
    class Meta:
        model = UserSubscription
        fields = "__all__"
    
    can_create_project = graphene.Boolean()
    can_run_analysis = graphene.Boolean()
    is_plan_expired = graphene.Boolean()
    
    def resolve_can_create_project(self, info):
        return self.can_create_project()
    
    def resolve_can_run_analysis(self, info):
        return self.can_run_analysis()
    
    def resolve_is_plan_expired(self, info):
        return self.is_plan_expired()


class PaymentType(DjangoObjectType):
    """Payment transaction details."""
    class Meta:
        model = Payment
        fields = "__all__"


class InvoiceType(DjangoObjectType):
    """Invoice for payment transactions."""
    class Meta:
        model = Invoice
        fields = "__all__"


class UserProfileType(DjangoObjectType):
    """Extended user profile information."""
    class Meta:
        model = UserProfile
        fields = "__all__"


class UserPreferencesType(DjangoObjectType):
    """User notification and app preferences."""
    class Meta:
        model = UserPreferences
        fields = "__all__"


class ContactMessageType(DjangoObjectType):
    """Contact form submissions."""
    class Meta:
        model = ContactMessage
        fields = "__all__"


class FAQType(DjangoObjectType):
    """FAQ items for help section."""
    class Meta:
        model = FAQ
        fields = "__all__"


class OutboundWebhookType(DjangoObjectType):
    """Outbound webhook integration details."""
    class Meta:
        model = OutboundWebhook
        fields = "__all__"


class UserInfoType(graphene.ObjectType):
    """Complete user information combining User, Profile, and Preferences."""
    id = graphene.Int()
    username = graphene.String()
    email = graphene.String()
    first_name = graphene.String()
    last_name = graphene.String()
    profile = graphene.Field(UserProfileType)
    preferences = graphene.Field(UserPreferencesType)
    subscription = graphene.Field(UserSubscriptionType)
    created_at = graphene.String()


class DimensionComparisonType(graphene.ObjectType):
    """Comparison details for one dimension between two projects."""
    dimension = graphene.String()
    metric_name = graphene.String()
    current_score = graphene.Float()
    other_score = graphene.Float()
    delta = graphene.Float()
    winner = graphene.String(description="current, other, or tie")


class ProjectComparisonType(graphene.ObjectType):
    """Overall and per-dimension comparison between two projects."""
    current_project = graphene.Field(ProjectType)
    other_project = graphene.Field(ProjectType)
    current_overall_score = graphene.Float()
    other_overall_score = graphene.Float()
    current_grade = graphene.String()
    other_grade = graphene.String()
    overall_delta = graphene.Float()
    better_project_name = graphene.String()
    compared_dimensions = graphene.List(DimensionComparisonType)
    message = graphene.String()


# ──────────────────────────────────────────────────────────────
# Queries (public — read-only)
# ──────────────────────────────────────────────────────────────


class Query(graphene.ObjectType):
    all_projects = graphene.List(ProjectType)
    project = graphene.Field(ProjectType, id=graphene.UUID(required=True))
    analysis_run = graphene.Field(AnalysisRunType, id=graphene.UUID(required=True))
    dimension_configs = graphene.List(DimensionConfigType)
    me = graphene.String(description="Return current authenticated user's username")
    
    # Subscription/Plan queries
    all_plans = graphene.List(PlanType)
    my_subscription = graphene.Field(UserSubscriptionType)
    
    # User settings queries
    user_info = graphene.Field(UserInfoType, description="Get complete user information")
    faqs = graphene.List(FAQType, category=graphene.String(), description="Get FAQ items")
    contact_messages = graphene.List(ContactMessageType, description="Get user's contact messages")
    my_outbound_webhooks = graphene.List(OutboundWebhookType, description="Get current user's outbound webhooks")
    project_comparison = graphene.Field(
        ProjectComparisonType,
        project_id=graphene.UUID(required=True),
        compare_with_id=graphene.UUID(required=True),
        description="Compare one project with another project owned by the same user",
    )

    # Trends for a project
    trends = graphene.List(
        HistoricalTrendType,
        project_id=graphene.UUID(required=True),
        dimension=graphene.String(),
        limit=graphene.Int(),
    )

    def resolve_all_projects(self, info):
        user = info.context.user
        if user.is_authenticated:
            return projects_with_latest_run(Project.objects.filter(user=user))
        return Project.objects.none()

    def resolve_project(self, info, id):
        user = info.context.user
        if user.is_authenticated:
            return projects_with_latest_run(Project.objects.filter(id=id, user=user)).first()
        return None

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
    
    def resolve_all_plans(self, info):
        return Plan.objects.all().order_by('price_per_month')
    
    def resolve_my_subscription(self, info):
        user = info.context.user
        if user.is_authenticated:
            try:
                return user.subscription
            except UserSubscription.DoesNotExist:
                return None
        return None
    
    def resolve_user_info(self, info):
        user = info.context.user
        if not user or not user.is_authenticated:
            raise Exception("Authentication required. Please provide a valid JWT token.")
        
        # Ensure profile and preferences exist
        profile, _ = UserProfile.objects.get_or_create(user=user)
        preferences, _ = UserPreferences.objects.get_or_create(user=user)
        
        return UserInfoType(
            id=user.id,
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            profile=profile,
            preferences=preferences,
            subscription=user.subscription if hasattr(user, 'subscription') else None,
            created_at=user.date_joined.isoformat()
        )
    
    def resolve_faqs(self, info, category=None):
        qs = FAQ.objects.filter(is_active=True)
        if category:
            qs = qs.filter(category=category)
        return qs.order_by('category', 'order')
    
    def resolve_contact_messages(self, info):
        user = info.context.user
        if not user or not user.is_authenticated:
            raise Exception("Authentication required.")
        return user.contact_messages.all()

    def resolve_my_outbound_webhooks(self, info):
        user = _require_auth(info)
        return OutboundWebhook.objects.filter(user=user).order_by("-created_at")

    def resolve_project_comparison(self, info, project_id, compare_with_id):
        user = _require_auth(info)
        result = compare_user_projects(user, project_id, compare_with_id)
        return ProjectComparisonType(
            current_project=result["current_project"],
            other_project=result["other_project"],
            current_overall_score=result["current_overall_score"],
            other_overall_score=result["other_overall_score"],
            current_grade=result["current_grade"],
            other_grade=result["other_grade"],
            overall_delta=result["overall_delta"],
            better_project_name=result["better_project_name"],
            compared_dimensions=[
                DimensionComparisonType(**item) for item in result["compared_dimensions"]
            ],
            message=result["message"],
        )


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
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, name, description="", repo_url="", frontend_url="", backend_url=""):
        user = _require_auth(info)
        
        # Check subscription
        try:
            subscription = user.subscription
        except UserSubscription.DoesNotExist:
            return CreateProject(project=None, success=False, message="No active subscription. Please choose a plan.")
        
        # Check plan limits
        if not subscription.can_create_project():
            if subscription.is_plan_expired():
                return CreateProject(project=None, success=False, message="Your subscription has expired. Please renew.")
            else:
                max_projects = subscription.plan.max_projects
                return CreateProject(
                    project=None, 
                    success=False, 
                    message=f"You've reached the limit of {max_projects} projects on your {subscription.plan.name} plan. Upgrade to create more."
                )
        
        # Create project
        project = Project.objects.create(
            user=user,
            name=name,
            description=description,
            repo_url=repo_url,
            frontend_url=frontend_url,
            backend_url=backend_url,
        )
        
        # Update subscription usage
        subscription.projects_used += 1
        subscription.save()
        
        return CreateProject(project=project, success=True, message="Project created successfully!")


class UpdateProject(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)
        name = graphene.String()
        description = graphene.String()
        repo_url = graphene.String()
        frontend_url = graphene.String()
        backend_url = graphene.String()

    project = graphene.Field(ProjectType)
    success = graphene.Boolean()

    def mutate(self, info, id, **kwargs):
        user = _require_auth(info)
        try:
            project = Project.objects.get(id=id, user=user)
            for key, value in kwargs.items():
                if value is not None:
                    setattr(project, key, value)
            project.save()
            return UpdateProject(project=project, success=True)
        except Project.DoesNotExist:
            return UpdateProject(project=None, success=False)


class DeleteProject(graphene.Mutation):
    class Arguments:
        id = graphene.UUID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        user = _require_auth(info)
        Project.objects.filter(id=id, user=user).delete()
        return DeleteProject(success=True)


class RunAnalysis(graphene.Mutation):
    """Trigger a full analysis run for a project.
    If Celery is available, dispatches async; otherwise runs synchronously.
    """

    class Arguments:
        project_id = graphene.UUID(required=True)

    analysis_run = graphene.Field(AnalysisRunType)
    async_dispatched = graphene.Boolean(description="True if dispatched to Celery queue")
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, project_id):
        user = _require_auth(info)
        result = run_analysis_for_user_project(user, project_id)
        return RunAnalysis(
            analysis_run=result["analysis_run"],
            async_dispatched=result["async_dispatched"],
            success=result["success"],
            message=result["message"],
        )


class CreateOutboundWebhook(graphene.Mutation):
    """Create outbound webhook integration for current user."""

    class Arguments:
        name = graphene.String(required=True)
        url = graphene.String(required=True)
        secret = graphene.String(required=False)
        event_types = graphene.List(graphene.String, required=False)
        is_active = graphene.Boolean(required=False)

    webhook = graphene.Field(OutboundWebhookType)
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, name, url, secret="", event_types=None, is_active=True):
        user = _require_auth(info)
        result = create_webhook_for_user(user, name, url, secret, event_types, is_active)
        return CreateOutboundWebhook(webhook=result["webhook"], success=result["success"], message=result["message"])


class UpdateOutboundWebhook(graphene.Mutation):
    """Update outbound webhook integration for current user."""

    class Arguments:
        webhook_id = graphene.ID(required=True)
        name = graphene.String(required=False)
        url = graphene.String(required=False)
        secret = graphene.String(required=False)
        event_types = graphene.List(graphene.String, required=False)
        is_active = graphene.Boolean(required=False)

    webhook = graphene.Field(OutboundWebhookType)
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, webhook_id, name=None, url=None, secret=None, event_types=None, is_active=None):
        user = _require_auth(info)
        result = update_webhook_for_user(user, webhook_id, name, url, secret, event_types, is_active)
        return UpdateOutboundWebhook(webhook=result["webhook"], success=result["success"], message=result["message"])


class DeleteOutboundWebhook(graphene.Mutation):
    """Delete outbound webhook integration for current user."""

    class Arguments:
        webhook_id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, webhook_id):
        user = _require_auth(info)
        result = delete_webhook_for_user(user, webhook_id)
        return DeleteOutboundWebhook(success=result["success"], message=result["message"])


class TestOutboundWebhook(graphene.Mutation):
    """Send a test payload to a configured outbound webhook."""

    class Arguments:
        webhook_id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, webhook_id):
        user = _require_auth(info)
        result = test_webhook_for_user(user, webhook_id)
        return TestOutboundWebhook(success=result["success"], message=result["message"])


class GenerateProjectSummary(graphene.Mutation):
    """Generate AI summary for a project using transformer models."""

    class Arguments:
        project_id = graphene.UUID(required=True)

    project_summary = graphene.Field(ProjectSummaryType)
    async_dispatched = graphene.Boolean(description="True if dispatched to Celery queue")
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, project_id):
        user = _require_auth(info)
        result = generate_summary_for_user_project(user, project_id)
        return GenerateProjectSummary(
            project_summary=result["project_summary"],
            async_dispatched=result["async_dispatched"],
            success=result["success"],
            message=result["message"],
        )


class SendChatMessage(graphene.Mutation):
    """Send a message to the project chatbot."""

    class Arguments:
        project_id = graphene.UUID(required=True)
        message = graphene.String(required=True)

    chat_message = graphene.Field(ChatMessageType)
    chatbot_response = graphene.String()
    success = graphene.Boolean()

    def mutate(self, info, project_id, message):
        _require_auth(info)
        try:
            from .chatbot import chatbot

            project = Project.objects.get(id=project_id)
            
            # Save user message
            user_msg = ChatMessage.objects.create(
                project=project,
                role="user",
                content=message
            )
            
            # Get chatbot response
            response = chatbot.chat(message, project_id=str(project_id))
            
            # Save assistant message
            assistant_msg = ChatMessage.objects.create(
                project=project,
                role="assistant",
                content=response
            )
            
            return SendChatMessage(
                chat_message=user_msg,
                chatbot_response=response,
                success=True
            )
        except Project.DoesNotExist:
            return SendChatMessage(
                chat_message=None,
                chatbot_response="Project not found.",
                success=False
            )
        except Exception as exc:
            logger.error(f"Error in chat: {exc}")
            return SendChatMessage(
                chat_message=None,
                chatbot_response=f"Error: {str(exc)}",
                success=False
            )


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
        _check_auth_rate_limit(info, "send-otp", limit=3, window_seconds=600)
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
        _check_auth_rate_limit(info, "verify-otp", limit=10, window_seconds=600)
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
        _check_auth_rate_limit(info, "register-user", limit=5, window_seconds=900)
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

        # Assign Free plan to new user
        free_plan = Plan.objects.get(name="free")
        UserSubscription.objects.create(user=user, plan=free_plan)

        # Send welcome email
        try:
            send_mail(
                subject="Welcome to AI Project Analyser! 🎉",
                message=f"""Hello {username},

Welcome to AI Project Analyser! Your account has been created successfully.

Account Details:
- Username: {username}
- Email: {email}
- Plan: Free (Unlimited projects, 10 analyses per month)

You can now log in at: http://localhost:5173

If you didn't create this account, please contact our support team.

Best regards,
AI Project Analyser Team
""",
                from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", "noreply@analyser.local"),
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info("Welcome email sent to new user: %s (%s)", username, email)
        except Exception as exc:
            logger.warning("Failed to send welcome email to %s: %s", email, exc)

        # Generate JWT token for immediate login
        from graphql_jwt.shortcuts import get_token
        token = get_token(user)

        logger.info("New user registered: %s (%s) with FREE plan", username, email)
        return RegisterUser(success=True, message="Account created successfully! Welcome email sent.", token=token)


class UpgradePlan(graphene.Mutation):
    """Upgrade user's subscription plan."""
    
    class Arguments:
        plan_name = graphene.String(required=True)
    
    subscription = graphene.Field(UserSubscriptionType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, plan_name):
        user = _require_auth(info)
        
        try:
            new_plan = Plan.objects.get(name=plan_name)
        except Plan.DoesNotExist:
            return UpgradePlan(subscription=None, success=False, message="Plan not found.")
        
        # Get or create subscription
        subscription, created = UserSubscription.objects.get_or_create(user=user)
        
        # Update plan
        old_plan = subscription.plan.name if subscription.plan else "none"
        subscription.plan = new_plan
        
        # Reset usage and set renewal date for basic plan
        if new_plan.name == "basic":
            subscription.renews_at = timezone.now() + timedelta(days=30)
            subscription.projects_used = 0
            subscription.analyses_used = 0
        elif new_plan.name == "premium":
            subscription.renews_at = None  # No renewal date for premium
            subscription.projects_used = 0
            subscription.analyses_used = 0
        
        subscription.is_active = True
        subscription.save()
        
        logger.info(f"User {user.username} upgraded from {old_plan} to {new_plan.name}")
        
        return UpgradePlan(
            subscription=subscription,
            success=True,
            message=f"Successfully upgraded to {new_plan.name.upper()} plan!"
        )


class ResetPlanUsage(graphene.Mutation):
    """Manually reset plan usage (called when Basic plan renews)."""
    
    subscription = graphene.Field(UserSubscriptionType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info):
        user = _require_auth(info)
        
        try:
            subscription = user.subscription
        except UserSubscription.DoesNotExist:
            return ResetPlanUsage(subscription=None, success=False, message="No subscription found.")
        
        # Only reset for Basic plan
        if subscription.plan and subscription.plan.name == "basic":
            subscription.projects_used = 0
            subscription.analyses_used = 0
            subscription.renews_at = timezone.now() + timedelta(days=30)
            subscription.save()
            
            logger.info(f"Plan usage reset for {user.username}")
            return ResetPlanUsage(
                subscription=subscription,
                success=True,
                message="Plan usage has been reset for the new period."
            )
        
        return ResetPlanUsage(
            subscription=subscription,
            success=False,
            message="Plan usage reset only applies to Basic plans."
        )


# ──────────────────────────────────────────────────────────────
# Payment Mutations
# ──────────────────────────────────────────────────────────────


class CreateRazorpayOrder(graphene.Mutation):
    """Create a Razorpay order or subscription for plan upgrade."""

    class Arguments:
        plan_name = graphene.String(required=True)

    payment = graphene.Field(PaymentType)
    order_id = graphene.String()
    subscription_id = graphene.String()
    amount = graphene.Int()
    currency = graphene.String()
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, plan_name):
        user = _require_auth(info)

        try:
            plan = Plan.objects.get(name=plan_name)
        except Plan.DoesNotExist:
            return CreateRazorpayOrder(
                payment=None,
                order_id=None,
                subscription_id=None,
                amount=None,
                currency=None,
                success=False,
                message="Plan not found.",
            )

        # Free plan doesn't require payment
        if plan.name == "free":
            try:
                subscription, _ = UserSubscription.objects.get_or_create(user=user)
                subscription.plan = plan
                subscription.is_active = True
                subscription.projects_used = 0
                subscription.analyses_used = 0
                subscription.renews_at = None
                subscription.save()

                return CreateRazorpayOrder(
                    payment=None,
                    order_id=None,
                    subscription_id=None,
                    amount=None,
                    currency=None,
                    success=True,
                    message="Successfully switched to Free plan!",
                )
            except Exception as e:
                logger.error("Error setting free plan: %s", e)
                return CreateRazorpayOrder(
                    payment=None,
                    order_id=None,
                    subscription_id=None,
                    amount=None,
                    currency=None,
                    success=False,
                    message="Error setting plan.",
                )

        # For paid plans, create Razorpay order or subscription
        try:
            subscription_obj = create_subscription(user, plan)
            subscription_id = subscription_obj.get("id")
            # Note: Subscriptions don't have order_id in the create response
            order_id = subscription_obj.get("order_id")  # Will be None for subscriptions
            amount = subscription_obj.get("amount")
            currency = subscription_obj.get("currency")

            if not subscription_id:
                # Fallback to creating a one-time order
                logger.warning("Subscription creation returned no ID, falling back to one-time order")
                order = create_order(user, plan)
                order_id = order.get("id")
                amount = order.get("amount")
                currency = order.get("currency")
                
                if not order_id:
                    logger.error("Both subscription and order creation failed to return IDs")
                    return CreateRazorpayOrder(
                        payment=None,
                        order_id=None,
                        subscription_id=None,
                        amount=None,
                        currency=None,
                        success=False,
                        message="Failed to create payment order. Please try again.",
                    )

            payment = Payment.objects.create(
                user=user,
                plan=plan,
                amount=plan.price_per_month,
                currency="INR",
                # Keep nullable Razorpay IDs as NULL to avoid unique collisions on blank strings.
                razorpay_order_id=order_id or None,
                razorpay_subscription_id=subscription_id or None,
                description=f"Upgrade to {plan.name} plan",
                status="pending",
            )

            logger.info(
                "Created payment record for user %s: subscription_id=%s, order_id=%s",
                user.email,
                subscription_id,
                order_id or 'None'
            )

            return CreateRazorpayOrder(
                payment=payment,
                order_id=order_id,
                subscription_id=subscription_id,
                amount=amount,
                currency=currency,
                success=True,
                message=f"Razorpay order created for {plan.name} plan",
            )

        except Exception as e:
            logger.error("Error creating Razorpay order: %s", e, exc_info=True)
            return CreateRazorpayOrder(
                payment=None,
                order_id=None,
                subscription_id=None,
                amount=None,
                currency=None,
                success=False,
                message="Unable to initiate payment at the moment. Please try again.",
            )


class VerifyRazorpayPayment(graphene.Mutation):
    """Verify Razorpay payment signature and confirm upgrade."""

    class Arguments:
        razorpay_payment_id = graphene.String(required=True)
        razorpay_order_id = graphene.String(required=False)
        razorpay_subscription_id = graphene.String(required=False)
        razorpay_signature = graphene.String(required=True)

    payment = graphene.Field(PaymentType)
    subscription = graphene.Field(UserSubscriptionType)
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, razorpay_payment_id, razorpay_signature, razorpay_order_id=None, razorpay_subscription_id=None):
        user = _require_auth(info)

        try:
            # Log the verification attempt
            logger.info(
                "Verifying payment for user %s: payment_id=%s, order_id=%s, subscription_id=%s",
                user.email,
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_subscription_id
            )

            # Razorpay requires either order_id OR subscription_id for verification
            if not razorpay_order_id and not razorpay_subscription_id:
                logger.error(
                    "Payment verification failed: Neither order_id nor subscription_id provided. "
                    "payment_id=%s", razorpay_payment_id
                )
                return VerifyRazorpayPayment(
                    payment=None,
                    subscription=None,
                    success=False,
                    message="Invalid payment verification: missing order_id or subscription_id"
                )

            params = {
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
            if razorpay_order_id:
                params["razorpay_order_id"] = razorpay_order_id
            if razorpay_subscription_id:
                params["razorpay_subscription_id"] = razorpay_subscription_id

            # Verify signature
            logger.info("Verifying signature with params: %s", {k: v for k, v in params.items() if k != 'razorpay_signature'})
            verify_payment_signature(params)
            logger.info("✅ Signature verified successfully")

            # Find payment record - prioritize subscription lookup since most payments use subscriptions
            payment = None
            if razorpay_subscription_id:
                payment = Payment.objects.filter(
                    razorpay_subscription_id=razorpay_subscription_id,
                    user=user,
                ).first()
                logger.info("Looking for payment by subscription_id=%s: %s", razorpay_subscription_id, "found" if payment else "not found")
            
            if not payment and razorpay_order_id:
                payment = Payment.objects.filter(
                    razorpay_order_id=razorpay_order_id,
                    user=user,
                ).first()
                logger.info("Looking for payment by order_id=%s: %s", razorpay_order_id, "found" if payment else "not found")

            if not payment:
                # Debug: Show all pending payments for this user
                all_payments = Payment.objects.filter(user=user, status='pending').values_list(
                    'id', 'razorpay_order_id', 'razorpay_subscription_id', 'plan__name'
                )
                logger.error(
                    "Payment not found for user %s with order_id=%s or subscription_id=%s. Pending payments: %s",
                    user.email,
                    razorpay_order_id,
                    razorpay_subscription_id,
                    list(all_payments)
                )
                return VerifyRazorpayPayment(
                    payment=None,
                    subscription=None,
                    success=False,
                    message="Payment record not found in database. Please contact support.",
                )

            logger.info("Found payment record: id=%s, plan=%s, status=%s", payment.id, payment.plan.name, payment.status)

            # Idempotency: if webhook/callback retries, don't fail already-processed payments.
            if payment.status == "succeeded":
                subscription, _ = UserSubscription.objects.get_or_create(user=user)
                if payment.plan and subscription.plan_id != payment.plan_id:
                    subscription.plan = payment.plan
                    subscription.is_active = True
                    if payment.plan.name == "basic":
                        subscription.renews_at = timezone.now() + timedelta(days=30)
                    elif payment.plan.name == "premium":
                        subscription.renews_at = None
                    subscription.save()

                return VerifyRazorpayPayment(
                    payment=payment,
                    subscription=subscription,
                    success=True,
                    message=f"Payment already verified for {payment.plan.name} plan.",
                )

            payment.status = "succeeded"
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.succeeded_at = timezone.now()
            payment.save()

            subscription, _ = UserSubscription.objects.get_or_create(user=user)
            subscription.plan = payment.plan
            subscription.is_active = True
            if payment.plan and payment.plan.name == "basic":
                subscription.renews_at = timezone.now() + timedelta(days=30)
                subscription.projects_used = 0
                subscription.analyses_used = 0
            elif payment.plan and payment.plan.name == "premium":
                subscription.renews_at = None
            subscription.save()

            logger.info("✅ Payment verified and subscription updated for user %s to %s plan", user.email, payment.plan.name)

            return VerifyRazorpayPayment(
                payment=payment,
                subscription=subscription,
                success=True,
                message=f"Successfully upgraded to {payment.plan.name} plan!",
            )

        except Exception as e:
            logger.error("Error verifying Razorpay payment: %s", e, exc_info=True)
            return VerifyRazorpayPayment(
                payment=None,
                subscription=None,
                success=False,
                message="Payment verification failed. Please retry or contact support.",
            )


class GoogleAuth(graphene.Mutation):
    """Authenticate or register via Google OAuth. Sends OTP to the verified email for security."""

    class Arguments:
        google_token = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()
    email = graphene.String()
    is_new_user = graphene.Boolean()

    def mutate(self, info, google_token):
        _check_auth_rate_limit(info, "google-auth", limit=5, window_seconds=600)
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            google_client_id = getattr(django_settings, "GOOGLE_OAUTH_CLIENT_ID", "")
            if not google_client_id:
                return GoogleAuth(
                    success=False,
                    message="Google OAuth is not configured on the server.",
                    email=None,
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
                return GoogleAuth(success=False, message="Could not retrieve email from Google.", email=None, is_new_user=False)

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
                
                # Assign Free plan to new Google user
                free_plan = Plan.objects.get(name="free")
                UserSubscription.objects.create(user=user, plan=free_plan)
                
                is_new = True
                logger.info("New Google user registered: %s (%s) with FREE plan", username, email)
            
            # Generate and send OTP to user's Google email
            otp = EmailOTP.generate(email)
            
            try:
                send_mail(
                    subject="AI Project Analyser — Email Verification Code",
                    message=f"Hello {given_name or 'User'},\n\nYour email verification code is: {otp.otp_code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.",
                    from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", "noreply@analyser.local"),
                    recipient_list=[email],
                    fail_silently=False,
                )
                logger.info("Google OTP email sent to %s", email)
            except Exception as exc:
                logger.warning("Email send failed (%s). OTP for %s: %s", exc, email, otp.otp_code)

            return GoogleAuth(
                success=True,
                message="Verification code sent to your email. Please check your inbox.",
                email=email,
                is_new_user=is_new,
            )

        except ValueError as exc:
            logger.warning("Google token verification failed: %s", exc)
            return GoogleAuth(success=False, message="Invalid Google token.", email=None, is_new_user=False)
        except ImportError:
            return GoogleAuth(
                success=False,
                message="Google auth library not installed. Run: pip install google-auth",
                email=None,
                is_new_user=False,
            )
        except Exception as exc:
            logger.error("Google auth error: %s", exc)
            return GoogleAuth(success=False, message="Google authentication failed.", email=None, is_new_user=False)


class LoginUser(graphene.Mutation):
    """Authenticate user with username/password and send login notification email."""

    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()
    token = graphene.String()

    def mutate(self, info, username, password):
        _check_auth_rate_limit(info, "login-user", limit=10, window_seconds=600)
        from django.contrib.auth import authenticate
        
        username = username.strip()
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        
        if user is None:
            return LoginUser(success=False, message="Invalid username or password.", token=None)
        
        # Generate JWT token
        from graphql_jwt.shortcuts import get_token
        token = get_token(user)

        # Auto-assign free plan if user has no subscription
        try:
            user.subscription
        except UserSubscription.DoesNotExist:
            free_plan, _ = Plan.objects.get_or_create(
                name="free",
                defaults={
                    "max_projects": 3,
                    "max_analyses_per_month": 10,
                    "price_per_month": 0,
                },
            )
            UserSubscription.objects.create(
                user=user,
                plan=free_plan,
                is_active=True,
            )
            logger.info("Auto-assigned free plan to user: %s", user.username)

        # Send login notification email asynchronously (non-blocking)
        try:
            send_mail(
                subject="Login Notification - AI Project Analyser",
                message=f"""Hello {user.username},

You have successfully logged in to your AI Project Analyser account.

Login Details:
- Username: {user.username}
- Email: {user.email}
- Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}

If this wasn't you, please change your password immediately at:
http://localhost:5173

Best regards,
AI Project Analyser Team
""",
                from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", "noreply@analyser.local"),
                recipient_list=[user.email],
                fail_silently=True,  # Don't fail login if email fails
            )
            logger.info("Login notification email sent to: %s (%s)", user.username, user.email)
        except Exception as exc:
            logger.warning("Failed to send login email to %s: %s", user.email, exc)
        
        logger.info("User logged in: %s", user.username)
        return LoginUser(success=True, message="Login successful!", token=token)


class VerifyGoogleOTP(graphene.Mutation):
    """Verify OTP sent to Google user's email and complete login/registration."""

    class Arguments:
        email = graphene.String(required=True)
        otp_code = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()
    token = graphene.String()

    def mutate(self, info, email, otp_code):
        _check_auth_rate_limit(info, "verify-google-otp", limit=10, window_seconds=600)
        email = email.strip().lower()
        otp_code = otp_code.strip()

        # Verify the OTP
        if not EmailOTP.verify(email, otp_code):
            return VerifyGoogleOTP(
                success=False,
                message="Invalid or expired verification code.",
                token=None,
            )

        # Get user and generate JWT token
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return VerifyGoogleOTP(
                success=False,
                message="User not found. Please complete Google authentication first.",
                token=None,
            )

        # Generate JWT token for login
        from graphql_jwt.shortcuts import get_token
        token = get_token(user)

        logger.info("Google user verified via OTP: %s", email)
        return VerifyGoogleOTP(
            success=True,
            message="Email verified successfully! You are now logged in.",
            token=token,
        )


# ──────────────────────────────────────────────────────────────
# User Settings & Profile Mutations
# ──────────────────────────────────────────────────────────────


class UpdateProfile(graphene.Mutation):
    """Update user profile information."""
    
    class Arguments:
        first_name = graphene.String()
        last_name = graphene.String()
        email = graphene.String()
        bio = graphene.String()
        phone_number = graphene.String()
        company = graphene.String()
        location = graphene.String()
        website = graphene.String()
    
    success = graphene.Boolean()
    message = graphene.String()
    user = graphene.Field(UserInfoType)
    
    def mutate(self, info, **kwargs):
        user = _require_auth(info)
        
        try:
            # Update User model fields
            if 'first_name' in kwargs:
                user.first_name = kwargs['first_name']
            if 'last_name' in kwargs:
                user.last_name = kwargs['last_name']
            if 'email' in kwargs:
                # Check if email is already taken by another user
                if User.objects.filter(email=kwargs['email']).exclude(id=user.id).exists():
                    return UpdateProfile(
                        success=False,
                        message="Email already in use by another account.",
                        user=None
                    )
                user.email = kwargs['email']
            user.save()
            
            # Update or create UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if 'bio' in kwargs:
                profile.bio = kwargs['bio']
            if 'phone_number' in kwargs:
                profile.phone_number = kwargs['phone_number']
            if 'company' in kwargs:
                profile.company = kwargs['company']
            if 'location' in kwargs:
                profile.location = kwargs['location']
            if 'website' in kwargs:
                profile.website = kwargs['website']
            profile.save()
            
            # Get preferences
            preferences, _ = UserPreferences.objects.get_or_create(user=user)
            
            return UpdateProfile(
                success=True,
                message="Profile updated successfully!",
                user=UserInfoType(
                    id=user.id,
                    username=user.username,
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    profile=profile,
                    preferences=preferences,
                    subscription=user.subscription if hasattr(user, 'subscription') else None,
                    created_at=user.date_joined.isoformat()
                )
            )
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return UpdateProfile(
                success=False,
                message=f"Error updating profile: {str(e)}",
                user=None
            )


class ChangePassword(graphene.Mutation):
    """Change user password."""
    
    class Arguments:
        old_password = graphene.String(required=True)
        new_password = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, old_password, new_password):
        user = _require_auth(info)
        
        # Verify old password
        if not user.check_password(old_password):
            return ChangePassword(
                success=False,
                message="Current password is incorrect."
            )
        
        # Validate new password
        if len(new_password) < 8:
            return ChangePassword(
                success=False,
                message="New password must be at least 8 characters long."
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        logger.info(f"Password changed for user: {user.username}")
        return ChangePassword(
            success=True,
            message="Password changed successfully!"
        )


class DeleteAccount(graphene.Mutation):
    """Delete user account and all associated data."""
    
    class Arguments:
        password = graphene.String(required=True)
        confirmation = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, password, confirmation):
        user = _require_auth(info)
        
        # Verify password
        if not user.check_password(password):
            return DeleteAccount(
                success=False,
                message="Password is incorrect."
            )
        
        # Verify confirmation
        if confirmation.lower() != "delete":
            return DeleteAccount(
                success=False,
                message="Please type 'DELETE' to confirm account deletion."
            )
        
        username = user.username
        
        try:
            # Delete all user's projects (cascade will handle related data)
            Project.objects.filter(user=user).delete()
            
            # Delete user account
            user.delete()
            
            logger.info(f"Account deleted for user: {username}")
            return DeleteAccount(
                success=True,
                message="Account deleted successfully."
            )
        except Exception as e:
            logger.error(f"Error deleting account: {e}")
            return DeleteAccount(
                success=False,
                message=f"Error deleting account: {str(e)}"
            )


class UpdatePreferences(graphene.Mutation):
    """Update user notification and app preferences."""
    
    class Arguments:
        email_notifications = graphene.Boolean()
        project_updates = graphene.Boolean()
        marketing_emails = graphene.Boolean()
        weekly_digest = graphene.Boolean()
        dark_theme = graphene.Boolean()
        notifications_popup = graphene.Boolean()
        public_profile = graphene.Boolean()
        show_projects_publicly = graphene.Boolean()
    
    success = graphene.Boolean()
    message = graphene.String()
    preferences = graphene.Field(UserPreferencesType)
    
    def mutate(self, info, **kwargs):
        user = _require_auth(info)
        
        try:
            preferences, _ = UserPreferences.objects.get_or_create(user=user)
            
            # Update preferences
            for key, value in kwargs.items():
                if hasattr(preferences, key):
                    setattr(preferences, key, value)
            
            preferences.save()
            
            return UpdatePreferences(
                success=True,
                message="Preferences updated successfully!",
                preferences=preferences
            )
        except Exception as e:
            logger.error(f"Error updating preferences: {e}")
            return UpdatePreferences(
                success=False,
                message=f"Error updating preferences: {str(e)}",
                preferences=None
            )


class CreateContactMessage(graphene.Mutation):
    """Create a contact message and notify support email."""

    class Arguments:
        name = graphene.String(required=True)
        email = graphene.String(required=True)
        subject = graphene.String(required=True)
        message = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()
    contact_message = graphene.Field(ContactMessageType)

    def mutate(self, info, name, email, subject, message):
        user = _require_auth(info)

        try:
            cleaned_name = name.strip()
            cleaned_email = email.strip().lower()
            cleaned_message = message.strip()

            contact_message = ContactMessage.objects.create(
                user=user,
                name=cleaned_name,
                email=cleaned_email,
                subject=subject,
                message=cleaned_message,
            )

            subject_label = dict(ContactMessage.SUBJECT_CHOICES).get(subject, subject)
            recipient_email = getattr(django_settings, "CONTACT_RECEIVER_EMAIL", "sethsuraj202@outlook.com")

            send_mail(
                subject=f"[Contact Form] {subject_label} - {cleaned_name}",
                message=(
                    "A new contact message was submitted from Settings.\n\n"
                    f"Sender Name: {cleaned_name}\n"
                    f"Sender Email: {cleaned_email}\n"
                    f"User: {user.username} (ID: {user.id})\n"
                    f"Subject: {subject_label}\n\n"
                    "Message:\n"
                    f"{cleaned_message}"
                ),
                from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", "noreply@analyser.local"),
                recipient_list=[recipient_email],
                fail_silently=False,
            )

            return CreateContactMessage(
                success=True,
                message="Message sent successfully. We'll get back to you within 24-48 hours.",
                contact_message=contact_message,
            )
        except Exception as e:
            logger.error(f"Error creating contact message: {e}")
            return CreateContactMessage(
                success=False,
                message="Could not send your message right now. Please try again.",
                contact_message=None,
            )


class Enable2FA(graphene.Mutation):
    """Enable two-factor authentication for the user."""
    
    class Arguments:
        password = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    secret = graphene.String()
    qr_code_url = graphene.String()
    
    def mutate(self, info, password):
        user = _require_auth(info)
        
        # Verify password
        if not user.check_password(password):
            return Enable2FA(
                success=False,
                message="Password is incorrect.",
                secret=None,
                qr_code_url=None
            )
        
        try:
            import pyotp
            import qrcode
            import io
            import base64
            
            # Generate secret
            secret = pyotp.random_base32()
            
            # Create TOTP URI
            totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                name=user.email,
                issuer_name="AI Project Analyser"
            )
            
            # Generate QR code
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(totp_uri)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            qr_code_url = f"data:image/png;base64,{img_str}"
            
            # Save to user profile (but don't enable yet - user must verify)
            profile, _ = UserProfile.objects.get_or_create(user=user)
            # Store secret temporarily (in production, use encrypted field)
            # For now, we'll just return it and let frontend handle verification
            
            return Enable2FA(
                success=True,
                message="Scan this QR code with your authenticator app.",
                secret=secret,
                qr_code_url=qr_code_url
            )
        except ImportError:
            return Enable2FA(
                success=False,
                message="2FA functionality not available. Please install required packages (pyotp, qrcode).",
                secret=None,
                qr_code_url=None
            )
        except Exception as e:
            logger.error(f"Error enabling 2FA: {e}")
            return Enable2FA(
                success=False,
                message=f"Error enabling 2FA: {str(e)}",
                secret=None,
                qr_code_url=None
            )


class Verify2FA(graphene.Mutation):
    """Verify and complete 2FA setup."""
    
    class Arguments:
        secret = graphene.String(required=True)
        code = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, secret, code):
        user = _require_auth(info)
        
        try:
            import pyotp
            
            # Verify the code
            totp = pyotp.TOTP(secret)
            if totp.verify(code):
                # Enable 2FA for user
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.two_factor_enabled = True
                profile.save()
                
                logger.info(f"2FA enabled for user: {user.username}")
                return Verify2FA(
                    success=True,
                    message="2FA enabled successfully!"
                )
            else:
                return Verify2FA(
                    success=False,
                    message="Invalid verification code. Please try again."
                )
        except ImportError:
            return Verify2FA(
                success=False,
                message="2FA functionality not available."
            )
        except Exception as e:
            logger.error(f"Error verifying 2FA: {e}")
            return Verify2FA(
                success=False,
                message=f"Error verifying 2FA: {str(e)}"
            )


class Disable2FA(graphene.Mutation):
    """Disable two-factor authentication."""
    
    class Arguments:
        password = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, password):
        user = _require_auth(info)
        
        # Verify password
        if not user.check_password(password):
            return Disable2FA(
                success=False,
                message="Password is incorrect."
            )
        
        try:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.two_factor_enabled = False
            profile.save()
            
            logger.info(f"2FA disabled for user: {user.username}")
            return Disable2FA(
                success=True,
                message="2FA disabled successfully!"
            )
        except Exception as e:
            logger.error(f"Error disabling 2FA: {e}")
            return Disable2FA(
                success=False,
                message=f"Error disabling 2FA: {str(e)}"
            )


class Mutation(graphene.ObjectType):
    # JWT auth mutations
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

    # Registration & OTP
    send_otp = SendOTP.Field()
    verify_otp_mutation = VerifyOTP.Field()
    register_user = RegisterUser.Field()
    login_user = LoginUser.Field()
    google_auth = GoogleAuth.Field()
    verify_google_otp = VerifyGoogleOTP.Field()

    # Subscription & Plans
    upgrade_plan = UpgradePlan.Field()
    reset_plan_usage = ResetPlanUsage.Field()

    # Payment processing
    create_razorpay_order = CreateRazorpayOrder.Field()
    verify_razorpay_payment = VerifyRazorpayPayment.Field()

    # App mutations (authenticated)
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()
    delete_project = DeleteProject.Field()
    run_analysis = RunAnalysis.Field()
    
    # AI/ML mutations
    generate_project_summary = GenerateProjectSummary.Field()
    send_chat_message = SendChatMessage.Field()

    # Integrations
    create_outbound_webhook = CreateOutboundWebhook.Field()
    update_outbound_webhook = UpdateOutboundWebhook.Field()
    delete_outbound_webhook = DeleteOutboundWebhook.Field()
    test_outbound_webhook = TestOutboundWebhook.Field()
    
    # User Settings & Profile
    update_profile = UpdateProfile.Field()
    change_password = ChangePassword.Field()
    delete_account = DeleteAccount.Field()
    update_preferences = UpdatePreferences.Field()
    create_contact_message = CreateContactMessage.Field()
    enable_2fa = Enable2FA.Field()
    verify_2fa = Verify2FA.Field()
    disable_2fa = Disable2FA.Field()
