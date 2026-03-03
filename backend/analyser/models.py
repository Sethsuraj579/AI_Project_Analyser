"""
Models for AI Project Analyser.
Tracks projects, analysis runs, metric snapshots, and computed scores.
"""
import uuid
import random
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import timedelta



class EmailOTP(models.Model):
    """Stores OTP codes for email verification during registration."""
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"OTP for {self.email} ({'verified' if self.is_verified else 'pending'})"

    @staticmethod
    def generate(email):
        """Create a new 6-digit OTP for the given email."""
        # Invalidate any previous OTPs for this email
        EmailOTP.objects.filter(email=email, is_verified=False).delete()
        code = f"{random.randint(100000, 999999)}"
        otp = EmailOTP.objects.create(
            email=email,
            otp_code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        return otp

    @staticmethod
    def verify(email, code):
        """Verify an OTP code. Returns True if valid."""
        try:
            otp = EmailOTP.objects.get(
                email=email,
                otp_code=code,
                is_verified=False,
                expires_at__gte=timezone.now(),
            )
            otp.is_verified = True
            otp.save()
            return True
        except EmailOTP.DoesNotExist:
            return False


class Plan(models.Model):
    """Subscription plans available to users."""
    
    PLAN_CHOICES = [
        ("free", "Free"),
        ("basic", "Basic"),
        ("premium", "Premium"),
    ]
    
    name = models.CharField(max_length=50, unique=True, choices=PLAN_CHOICES)
    description = models.CharField(max_length=255, blank=True)
    max_projects = models.IntegerField(help_text="Maximum number of projects allowed (-1 for unlimited)")
    max_analyses_per_month = models.IntegerField(help_text="Maximum analyses per month (-1 for unlimited)")
    price_per_month = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    features = models.JSONField(default=list, blank=True, help_text="List of features included in this plan")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["price_per_month"]
    
    def __str__(self):
        return f"{self.name.upper()} Plan"


class UserSubscription(models.Model):
    """Track user subscriptions and plan history."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="subscription")
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, related_name="subscribers")
    
    # Dates
    subscribed_at = models.DateTimeField(auto_now_add=True)
    renews_at = models.DateTimeField(null=True, blank=True, help_text="When the subscription renews (for basic plan)")
    
    # Usage metrics
    projects_used = models.IntegerField(default=0, help_text="Number of projects created this period")
    analyses_used = models.IntegerField(default=0, help_text="Number of analyses run this period")
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ["-subscribed_at"]
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.name if self.plan else 'No Plan'}"
    
    def is_plan_expired(self):
        """Check if basic plan has expired."""
        if self.plan and self.plan.name == "basic" and self.renews_at:
            return timezone.now() > self.renews_at
        return False
    
    def can_create_project(self):
        """Check if user can create another project."""
        if not self.plan or not self.is_active:
            return False
        if self.is_plan_expired():
            return False
        if self.plan.max_projects == -1:  # Unlimited
            return True
        return self.projects_used < self.plan.max_projects
    
    def can_run_analysis(self):
        """Check if user can run another analysis."""
        if not self.plan or not self.is_active:
            return False
        if self.is_plan_expired():
            return False
        if self.plan.max_analyses_per_month == -1:  # Unlimited
            return True
        return self.analyses_used < self.plan.max_analyses_per_month


class Project(models.Model):
    """A software project to be analysed."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    repo_url = models.URLField(blank=True, default="")
    frontend_url = models.URLField(
        blank=True, default="", help_text="Live frontend URL for real-time probing"
    )
    backend_url = models.URLField(
        blank=True, default="", help_text="Live backend/API URL for real-time probing"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return self.name


class AnalysisRun(models.Model):
    """A single analysis execution for a project — collects all 7 dimension metrics."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="analysis_runs"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    overall_score = models.FloatField(null=True, blank=True)
    overall_grade = models.CharField(max_length=2, blank=True, default="")
    suggested_improvements = models.JSONField(
        default=list, 
        blank=True, 
        help_text="Auto-generated suggestions for improvement based on weak dimensions"
    )
    embeddings_generated = models.BooleanField(
        default=False,
        help_text="Whether RAG embeddings have been generated for this run"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Run {self.id} – {self.project.name} ({self.status})"


class MetricSnapshot(models.Model):
    """
    Raw metric data for a single dimension within an analysis run.
    Stores the measured value, computed weight, and normalised score.
    """

    DIMENSION_CHOICES = [
        ("frontend", "Frontend"),
        ("backend", "Backend"),
        ("database", "Database"),
        ("structure", "Structure"),
        ("api", "API"),
        ("integration", "Integration"),
        ("security", "Security"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    analysis_run = models.ForeignKey(
        AnalysisRun, on_delete=models.CASCADE, related_name="metrics"
    )
    dimension = models.CharField(max_length=20, choices=DIMENSION_CHOICES)

    # Raw measured value
    metric_name = models.CharField(
        max_length=100,
        help_text="e.g. Frontend_load_time, Backend_proc_time, Database_query_time, etc.",
    )
    raw_value = models.FloatField(help_text="Raw measurement value")
    unit = models.CharField(max_length=30, default="ms", help_text="e.g. ms, %, score")

    # Scoring
    weight = models.FloatField(
        default=1.0, help_text="Weight assigned by the AI engine"
    )
    normalised_score = models.FloatField(
        null=True, blank=True, help_text="Score normalised to 0-100"
    )
    grade = models.CharField(max_length=2, blank=True, default="")

    # Threshold context
    threshold_good = models.FloatField(null=True, blank=True)
    threshold_warning = models.FloatField(null=True, blank=True)
    threshold_critical = models.FloatField(null=True, blank=True)

    details = models.JSONField(default=dict, blank=True)
    measured_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["dimension"]

    def __str__(self):
        return f"{self.dimension}: {self.metric_name} = {self.raw_value}{self.unit}"


class HistoricalTrend(models.Model):
    """Stores time-series data points for trend graphs."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="trends"
    )
    dimension = models.CharField(max_length=20)
    metric_name = models.CharField(max_length=100)
    value = models.FloatField()
    score = models.FloatField(null=True, blank=True)
    recorded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["project", "dimension", "recorded_at"]),
        ]

    def __str__(self):
        return f"{self.dimension}/{self.metric_name}: {self.value} @ {self.recorded_at}"


class ProjectSummary(models.Model):
    """AI-generated summary of a project using transformer models."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, related_name="summary"
    )
    summary = models.TextField(blank=True, default="")
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Summary for {self.project.name}"


class ChatMessage(models.Model):
    """Chat messages between user and project chatbot."""

    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="chat_messages"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["project", "created_at"]),
        ]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}... ({self.project.name})"


# ──────────────────────────────────────────────────────────────
# Payment & Billing Models
# ──────────────────────────────────────────────────────────────


class Payment(models.Model):
    """Track individual payments (one-time or subscription start)."""
    
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("succeeded", "Succeeded"),
        ("failed", "Failed"),
        ("canceled", "Canceled"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    
    # Razorpay integration
    razorpay_order_id = models.CharField(max_length=255, unique=True, db_index=True, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    razorpay_subscription_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    # Metadata
    description = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    succeeded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status"]),
        ]
    
    def __str__(self):
        return f"Payment {self.id} - {self.user.email} - ${self.amount} ({self.status})"


class Invoice(models.Model):
    """Track invoices for paid subscriptions."""
    
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("open", "Open"),
        ("paid", "Paid"),
        ("void", "Void"),
        ("uncollectible", "Uncollectible"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invoices")
    subscription = models.ForeignKey(UserSubscription, on_delete=models.CASCADE, related_name="invoices")
    payment = models.OneToOneField(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoice")
    
    # Invoice details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    
    # Razorpay integration
    razorpay_invoice_id = models.CharField(max_length=255, unique=True, db_index=True, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    
    # Dates
    issued_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # PDF receipt
    pdf_url = models.URLField(blank=True, default="")
    
    class Meta:
        ordering = ["-issued_at"]
        indexes = [
            models.Index(fields=["user", "-issued_at"]),
            models.Index(fields=["status"]),
        ]
    
    def __str__(self):
        return f"Invoice {self.razorpay_invoice_id} - {self.user.email} - {self.amount} {self.currency} ({self.status})"
