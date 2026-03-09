"""
Celery tasks for the Analyser app.
Long-running analysis is offloaded to the task queue.
"""
import logging
from celery import shared_task
from django.contrib.auth.models import User
from .ml_models import model_manager
from .integrations import dispatch_outbound_webhooks

logger = logging.getLogger("analyser.tasks")


@shared_task(bind=True, max_retries=1, default_retry_delay=10)
def send_outbound_webhooks_async(self, user_id, event_name, payload):
    """Dispatch outbound webhooks in background to avoid blocking request threads."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning("Cannot dispatch webhooks for missing user %s", user_id)
        return {"sent": False, "reason": "user_not_found"}

    dispatch_outbound_webhooks(user, event_name, payload)
    return {"sent": True, "event": event_name}


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
        send_outbound_webhooks_async.delay(
            project.user_id,
            "analysis.completed",
            {
                "project_id": str(project.id),
                "project_name": project.name,
                "analysis_run_id": str(run.id),
                "overall_score": run.overall_score,
                "overall_grade": run.overall_grade,
            },
        )
        return {"run_id": str(run.id), "score": run.overall_score, "grade": run.overall_grade}
    except Exception as exc:
        logger.error("Async analysis failed for project %s: %s", project_id, exc, exc_info=True)
        send_outbound_webhooks_async.delay(
            project.user_id,
            "analysis.failed",
            {
                "project_id": str(project.id),
                "project_name": project.name,
                "error": str(exc),
            },
        )
        # Mark any pending run as failed
        AnalysisRun.objects.filter(project_id=project_id, status="running").update(status="failed")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2)
def generate_project_summary(self, project_id):
    """
    Generate a professional, structured project summary from analysis data.
    """
    from .models import Project, ProjectSummary, AnalysisRun

    try:
        project = Project.objects.get(id=project_id)

        # Get the latest analysis run
        latest_run = project.analysis_runs.filter(status='completed').order_by('-completed_at').first()

        if not latest_run:
            report = (
                f"Executive Summary: {project.name}\n\n"
                "Current Status\n"
                "- Analysis has not been completed yet.\n"
                "- Run a full analysis to generate validated quality insights across all dimensions.\n\n"
                "Recommended Next Step\n"
                "- Start the analysis run and review the first baseline report before planning improvements."
            )
        else:
            metrics = list(latest_run.metrics.all())
            metrics_by_score = sorted(metrics, key=lambda m: m.normalised_score)
            strongest = sorted(metrics, key=lambda m: m.normalised_score, reverse=True)[:2]
            weakest = metrics_by_score[:2]

            summary_lines = [
                f"Executive Summary: {project.name}",
                "",
                "Project Overview",
                f"- Description: {project.description or 'Not provided'}",
                f"- Repository: {project.repo_url or 'Not provided'}",
                f"- Overall Quality Score: {latest_run.overall_score:.1f}/100 ({latest_run.overall_grade} - {_grade_interpretation(latest_run.overall_grade)})",
                "",
                "Dimension Performance",
            ]

            for metric in sorted(metrics, key=lambda m: m.dimension):
                unit = metric.unit or ""
                raw_value = f"{metric.raw_value:.0f}{unit}" if metric.raw_value is not None else "N/A"
                summary_lines.append(
                    f"- {metric.get_dimension_display()}: {metric.normalised_score:.1f}/100 ({metric.grade}); measured value: {raw_value}"
                )

            summary_lines.extend([
                "",
                "Key Strengths",
            ])
            if strongest:
                for metric in strongest:
                    summary_lines.append(
                        f"- {metric.get_dimension_display()} is performing well at {metric.normalised_score:.1f}/100."
                    )
            else:
                summary_lines.append("- No strength insights are available yet.")

            summary_lines.extend([
                "",
                "Primary Risks",
            ])
            if weakest:
                for metric in weakest:
                    summary_lines.append(
                        f"- {metric.get_dimension_display()} requires attention with a score of {metric.normalised_score:.1f}/100."
                    )
            else:
                summary_lines.append("- No risk insights are available yet.")

            summary_lines.extend([
                "",
                "Priority Actions",
            ])
            if weakest:
                for metric in weakest:
                    summary_lines.append(
                        f"- Define and execute an improvement plan for {metric.get_dimension_display()} in the next sprint."
                    )
            summary_lines.append("- Re-run analysis after implementing changes to verify measurable improvement.")

            report = "\n".join(summary_lines)
        
        # Save the report
        ProjectSummary.objects.update_or_create(
            project=project,
            defaults={'summary': report}
        )
        
        logger.info(f"Summary generated for project {project_id}")
        return {"project_id": str(project_id), "summary": report}
    
    except Exception as exc:
        logger.error(f"Error generating summary for project {project_id}: {exc}")
        raise self.retry(exc=exc)


def _grade_interpretation(grade):
    """Interpret grade as human-readable text."""
    interpretations = {
        'A': 'excellent',
        'B': 'good',
        'C': 'fair',
        'D': 'poor',
        'F': 'critical'
    }
    return interpretations.get(grade, 'unknown')


@shared_task(bind=True, max_retries=2)
def generate_project_embeddings(self, project_id):
    """
    Generate embeddings for project data and analysis results for RAG chatbot.
    Stores embeddings in Chroma vector DB for semantic search.
    """
    from .models import Project, AnalysisRun

    try:
        project = Project.objects.get(id=project_id)
        
        # Get latest analysis for richer context
        latest_run = project.analysis_runs.filter(status='completed').order_by('-completed_at').first()
        
        # Build comprehensive text for embeddings
        text_parts = [
            f"Project: {project.name}",
            project.description or "",
        ]
        
        # Add analysis insights if available
        if latest_run:
            text_parts.append(f"Overall Score: {latest_run.overall_score:.1f}/100")
            text_parts.append(f"Grade: {latest_run.overall_grade}")
            
            # Add metric details
            for metric in latest_run.metrics.all():
                text_parts.append(
                    f"{metric.get_dimension_display()}: {metric.normalised_score:.0f}/100 ({metric.grade})"
                )
        
        project_text = " ".join([t for t in text_parts if t])
        
        # Generate embeddings
        embeddings_array = model_manager.get_embeddings(project_text)
        if embeddings_array is None:
            logger.warning(f"Could not generate embeddings for project {project_id}")
            return {"project_id": str(project_id), "status": "failed"}
        
        # Convert numpy array to list for Chroma
        embeddings_list = embeddings_array.tolist() if hasattr(embeddings_array, 'tolist') else list(embeddings_array)
        
        # Store in Chroma vector DB
        chroma_client = model_manager.get_chroma_client()
        collection = chroma_client.get_or_create_collection(name="project_insights")
        
        collection.add(
            ids=[str(project_id)],
            documents=[project_text],
            embeddings=[embeddings_list],
            metadatas=[{
                "project_id": str(project_id),
                "name": project.name,
                "score": latest_run.overall_score if latest_run else 0
            }]
        )
        
        # Mark embeddings as generated on the latest run
        if latest_run:
            latest_run.embeddings_generated = True
            latest_run.save(update_fields=['embeddings_generated'])
        
        logger.info(f"Embeddings generated and stored for project {project_id}")
        return {"project_id": str(project_id), "status": "success"}
    
    except Exception as exc:
        logger.error(f"Error generating embeddings for project {project_id}: {exc}")
        raise self.retry(exc=exc)

