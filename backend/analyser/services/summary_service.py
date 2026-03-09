"""Service helpers for generating project summaries with async-first behavior."""
import logging

from django.conf import settings

from analyser.models import Project, ProjectSummary
from analyser.tasks import generate_project_summary

logger = logging.getLogger("analyser.services.summary")


def generate_summary_for_user_project(user, project_id):
    """Generate or dispatch project summary for a user-owned project."""
    try:
        project = Project.objects.get(id=project_id, user=user)
    except Project.DoesNotExist:
        return {
            "project_summary": None,
            "async_dispatched": False,
            "success": False,
            "message": "Project not found.",
        }

    try:
        from project_analyser.celery import app as celery_app

        worker_available = bool(celery_app.control.ping(timeout=1.0))
        if worker_available:
            generate_project_summary.delay(str(project_id))
            return {
                "project_summary": None,
                "async_dispatched": True,
                "success": True,
                "message": "Summary generation started. Check back in a moment.",
            }

        if settings.REQUIRE_CELERY_FOR_HEAVY_TASKS:
            logger.warning("No Celery worker available for summary generation on project %s", project_id)
            return {
                "project_summary": None,
                "async_dispatched": False,
                "success": False,
                "message": "Background worker unavailable. Please start Celery worker and retry.",
            }

        logger.warning("No Celery worker available. Falling back to synchronous summary generation for project %s", project_id)
    except Exception as exc:
        if settings.REQUIRE_CELERY_FOR_HEAVY_TASKS:
            logger.warning("Celery dispatch unavailable for summary generation on project %s: %s", project_id, exc)
            return {
                "project_summary": None,
                "async_dispatched": False,
                "success": False,
                "message": "Background worker unavailable. Please start Celery worker and retry.",
            }

        logger.warning("Celery dispatch unavailable for summary generation on project %s: %s", project_id, exc)

    try:
        generate_project_summary.run(str(project_id))
        summary = ProjectSummary.objects.filter(project=project).first()

        if not summary:
            return {
                "project_summary": None,
                "async_dispatched": False,
                "success": False,
                "message": "Summary generation did not produce a result.",
            }

        return {
            "project_summary": summary,
            "async_dispatched": False,
            "success": True,
            "message": "Summary generated successfully.",
        }
    except Exception as exc:
        logger.error("Error generating summary for project %s: %s", project_id, exc, exc_info=True)
        return {
            "project_summary": None,
            "async_dispatched": False,
            "success": False,
            "message": f"Error: {str(exc)}",
        }
