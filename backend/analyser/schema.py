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
from graphene import relay
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings as django_settings
from django.utils import timezone
from datetime import timedelta
from .models import Project, AnalysisRun, MetricSnapshot, HistoricalTrend, EmailOTP, ProjectSummary, ChatMessage, Plan, UserSubscription, Payment, Invoice, UserProfile, UserPreferences, ContactMessage, FAQ
from .engine import run_full_analysis, DIMENSION_CONFIG
from .razorpay_utils import create_order, create_subscription, verify_payment_signature

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
        return self.analysis_runs.filter(status="completed").first()

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
            return Project.objects.filter(user=user)
        return Project.objects.none()

    def resolve_project(self, info, id):
        user = info.context.user
        if user.is_authenticated:
            return Project.objects.filter(id=id, user=user).first()
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
        try:
            project = Project.objects.get(id=project_id, user=user)
        except Project.DoesNotExist:
            return RunAnalysis(
                analysis_run=None, async_dispatched=False,
                success=False, message="Project not found."
            )

        # Try async dispatch only when at least one worker is reachable
        try:
            from project_analyser.celery import app as celery_app
            from .tasks import run_analysis_async

            worker_available = bool(celery_app.control.ping(timeout=1.0))
            if worker_available:
                run_analysis_async.delay(str(project_id))

                # Create a pending run so the frontend can poll
                pending_run = AnalysisRun.objects.create(
                    project=project,
                    status="pending",
                )
                return RunAnalysis(
                    analysis_run=pending_run, async_dispatched=True,
                    success=True, message="Analysis dispatched to background queue."
                )
            logger.warning("No Celery worker available. Falling back to synchronous analysis for project %s", project_id)
        except Exception as exc:
            logger.warning("Celery dispatch unavailable for project %s: %s", project_id, exc)

        try:
            analysis_run = run_full_analysis(project)
            return RunAnalysis(
                analysis_run=analysis_run, async_dispatched=False,
                success=True, message="Analysis completed successfully."
            )
        except Exception as exc:
            logger.error("RunAnalysis sync fallback failed for project %s: %s", project_id, exc, exc_info=True)
            return RunAnalysis(
                analysis_run=None, async_dispatched=False,
                success=False, message=f"Analysis failed: {str(exc)}"
            )


class GenerateProjectSummary(graphene.Mutation):
    """Generate AI summary for a project using transformer models."""

    class Arguments:
        project_id = graphene.UUID(required=True)

    project_summary = graphene.Field(ProjectSummaryType)
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, project_id):
        _require_auth(info)
        try:
            from .tasks import generate_project_summary as summary_task

            project = Project.objects.get(id=project_id)
            
            # Dispatch async task
            summary_task.delay(str(project_id))
            
            return GenerateProjectSummary(
                project_summary=None,
                success=True,
                message="Summary generation started. Check back in a moment."
            )
        except Project.DoesNotExist:
            return GenerateProjectSummary(
                project_summary=None,
                success=False,
                message="Project not found."
            )
        except Exception as exc:
            logger.error(f"Error generating summary: {exc}")
            return GenerateProjectSummary(
                project_summary=None,
                success=False,
                message=f"Error: {str(exc)}"
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
            order_id = subscription_obj.get("order_id")
            amount = subscription_obj.get("amount")
            currency = subscription_obj.get("currency")

            if not subscription_id:
                order = create_order(user, plan)
                order_id = order.get("id")
                amount = order.get("amount")
                currency = order.get("currency")

            payment = Payment.objects.create(
                user=user,
                plan=plan,
                amount=plan.price_per_month,
                currency="INR",
                razorpay_order_id=order_id,
                razorpay_subscription_id=subscription_id or "",
                description=f"Upgrade to {plan.name} plan",
                status="pending",
            )

            logger.info("Created Razorpay order %s for user %s", order_id, user.email)

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
            logger.error("Error creating Razorpay order: %s", e)
            return CreateRazorpayOrder(
                payment=None,
                order_id=None,
                subscription_id=None,
                amount=None,
                currency=None,
                success=False,
                message=f"Error creating payment: {str(e)}",
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
            params = {
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
            if razorpay_order_id:
                params["razorpay_order_id"] = razorpay_order_id
            if razorpay_subscription_id:
                params["razorpay_subscription_id"] = razorpay_subscription_id

            verify_payment_signature(params)

            payment = Payment.objects.filter(
                razorpay_order_id=razorpay_order_id,
                user=user,
            ).first() or Payment.objects.filter(
                razorpay_subscription_id=razorpay_subscription_id,
                user=user,
            ).first()

            if not payment:
                return VerifyRazorpayPayment(
                    payment=None,
                    subscription=None,
                    success=False,
                    message="Payment not found.",
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

            return VerifyRazorpayPayment(
                payment=payment,
                subscription=subscription,
                success=True,
                message=f"Successfully upgraded to {payment.plan.name} plan!",
            )

        except Exception as e:
            logger.error("Error verifying Razorpay payment: %s", e)
            return VerifyRazorpayPayment(
                payment=None,
                subscription=None,
                success=False,
                message="Error confirming payment.",
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
