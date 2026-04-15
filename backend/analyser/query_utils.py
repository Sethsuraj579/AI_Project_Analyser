"""Shared queryset helpers for project and analysis lookups."""

from django.db.models import Prefetch

from .models import AnalysisRun


def completed_runs_prefetch():
    """Prefetch completed runs together with their metric snapshots."""
    return Prefetch(
        "analysis_runs",
        queryset=AnalysisRun.objects.filter(status="completed")
        .order_by("-completed_at")
        .prefetch_related("metrics"),
        to_attr="_completed_runs",
    )


def projects_with_latest_run(queryset):
    """Return projects with the summary relation and latest completed run prefetched."""
    return queryset.select_related("summary").prefetch_related(completed_runs_prefetch())


def latest_completed_run(project):
    """Return the latest completed run for a project, using prefetched data when available."""
    completed_runs = getattr(project, "_completed_runs", None)
    if completed_runs is not None:
        return completed_runs[0] if completed_runs else None

    return (
        project.analysis_runs.filter(status="completed")
        .order_by("-completed_at")
        .prefetch_related("metrics")
        .first()
    )