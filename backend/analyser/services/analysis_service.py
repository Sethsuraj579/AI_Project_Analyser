"""Service helpers for running project analysis with quota enforcement and async dispatch."""
import logging

from django.conf import settings
from django.db.models import F

from analyser.engine import run_full_analysis
from analyser.models import AnalysisRun, Project, UserSubscription
from analyser.tasks import run_analysis_async, send_outbound_webhooks_async

logger = logging.getLogger("analyser.services.analysis")


def _increment_analysis_usage(subscription):
    if subscription.plan and subscription.plan.max_analyses_per_month != -1:
        UserSubscription.objects.filter(id=subscription.id).update(analyses_used=F("analyses_used") + 1)


def run_analysis_for_user_project(user, project_id):
    """Run or dispatch project analysis with subscription checks.

    Returns dict with keys:
    - analysis_run
    - async_dispatched
    - success
    - message
    """
    try:
        subscription = user.subscription
    except UserSubscription.DoesNotExist:
        return {
            "analysis_run": None,
            "async_dispatched": False,
            "success": False,
            "message": "No active subscription. Please choose a plan.",
        }

    if not subscription.can_run_analysis():
        if subscription.is_plan_expired():
            return {
                "analysis_run": None,
                "async_dispatched": False,
                "success": False,
                "message": "Your subscription has expired. Please renew to run analysis.",
            }

        max_analyses = subscription.plan.max_analyses_per_month if subscription.plan else 0
        return {
            "analysis_run": None,
            "async_dispatched": False,
            "success": False,
            "message": (
                f"You've reached the limit of {max_analyses} analyses on your "
                f"{subscription.plan.name if subscription.plan else 'current'} plan. Upgrade to continue."
            ),
        }

    try:
        project = Project.objects.get(id=project_id, user=user)
    except Project.DoesNotExist:
        return {
            "analysis_run": None,
            "async_dispatched": False,
            "success": False,
            "message": "Project not found.",
        }

    try:
        from project_analyser.celery import app as celery_app

        worker_available = bool(celery_app.control.ping(timeout=1.0))
        if worker_available:
            run_analysis_async.delay(str(project_id))
            pending_run = AnalysisRun.objects.create(project=project, status="pending")
            _increment_analysis_usage(subscription)
            return {
                "analysis_run": pending_run,
                "async_dispatched": True,
                "success": True,
                "message": "Analysis dispatched to background queue.",
            }

        if settings.REQUIRE_CELERY_FOR_HEAVY_TASKS:
            logger.warning("No Celery worker available for project %s with strict async mode enabled", project_id)
            return {
                "analysis_run": None,
                "async_dispatched": False,
                "success": False,
                "message": "Background worker unavailable. Please start Celery worker and retry.",
            }

        logger.warning("No Celery worker available. Falling back to synchronous analysis for project %s", project_id)
    except Exception as exc:
        if settings.REQUIRE_CELERY_FOR_HEAVY_TASKS:
            logger.warning("Celery dispatch unavailable for project %s: %s", project_id, exc)
            return {
                "analysis_run": None,
                "async_dispatched": False,
                "success": False,
                "message": "Background worker unavailable. Please start Celery worker and retry.",
            }

        logger.warning("Celery dispatch unavailable for project %s: %s", project_id, exc)

    try:
        analysis_run = run_full_analysis(project)
        _increment_analysis_usage(subscription)

        send_outbound_webhooks_async.delay(
            user.id,
            "analysis.completed",
            {
                "project_id": str(project.id),
                "project_name": project.name,
                "analysis_run_id": str(analysis_run.id),
                "overall_score": analysis_run.overall_score,
                "overall_grade": analysis_run.overall_grade,
            },
        )
        return {
            "analysis_run": analysis_run,
            "async_dispatched": False,
            "success": True,
            "message": "Analysis completed successfully.",
        }
    except Exception as exc:
        logger.error("RunAnalysis sync fallback failed for project %s: %s", project_id, exc, exc_info=True)
        send_outbound_webhooks_async.delay(
            user.id,
            "analysis.failed",
            {
                "project_id": str(project_id),
                "error": str(exc),
            },
        )
        return {
            "analysis_run": None,
            "async_dispatched": False,
            "success": False,
            "message": f"Analysis failed: {str(exc)}",
        }
