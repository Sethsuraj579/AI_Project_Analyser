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


class Project(models.Model):
    """A software project to be analysed."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
