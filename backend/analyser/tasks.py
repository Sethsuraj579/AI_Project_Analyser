"""
Celery tasks for the Analyser app.
Long-running analysis is offloaded to the task queue.
"""
import logging
from celery import shared_task

logger = logging.getLogger("analyser.tasks")


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def run_analysis_async(self, project_id):
    """
    Run a full analysis for a project asynchronously via Celery.
    Called by the RunAnalysis GraphQL mutation.
    Returns the AnalysisRun UUID as a string.
    """
    from .models import Project, AnalysisRun
    from .engine import run_full_analysis

    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        logger.error("Project %s not found", project_id)
        return {"error": f"Project {project_id} not found"}

    try:
        run = run_full_analysis(project)
        logger.info("Async analysis completed: run=%s score=%.1f", run.id, run.overall_score)
        return {"run_id": str(run.id), "score": run.overall_score, "grade": run.overall_grade}
    except Exception as exc:
        logger.error("Async analysis failed for project %s: %s", project_id, exc, exc_info=True)
        # Mark any pending run as failed
        AnalysisRun.objects.filter(project_id=project_id, status="running").update(status="failed")
        raise self.retry(exc=exc)
