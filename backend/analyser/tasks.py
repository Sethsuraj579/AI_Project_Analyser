"""
Celery tasks for the Analyser app.
Long-running analysis is offloaded to the task queue.
"""
import logging
from celery import shared_task
from .ml_models import model_manager

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


@shared_task(bind=True, max_retries=2)
def generate_project_summary(self, project_id):
    """
    Generate a concise point-wise project summary from analysis data.
    """
    from .models import Project, ProjectSummary, AnalysisRun

    try:
        project = Project.objects.get(id=project_id)
        
        # Get the latest analysis run
        latest_run = project.analysis_runs.filter(status='completed').order_by('-completed_at').first()
        
        if not latest_run:
            report = f"""{project.name}

Status: Not Analyzed
- Run an analysis first to generate a detailed quality report
- Analysis evaluates 7 dimensions: Frontend, Backend, Database, Structure, API, Integration, Security"""
        else:
            # Build point-wise summary
            report = f"""{project.name}

Project Details
- Description: {project.description or 'N/A'}
- Repository: {project.repo_url or 'Not provided'}

Overall Score: {latest_run.overall_score:.1f}/100 (Grade: {latest_run.overall_grade})

Quality Dimensions
"""
            
            # Add each dimension as a bullet point
            for metric in latest_run.metrics.all():
                report += f"\n✓ {metric.dimension.upper()}: {metric.normalised_score:.1f}/100 ({metric.grade})"
                report += f" - {metric.raw_value:.0f}{metric.unit}"
        
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
    Generate embeddings for project data for semantic search & chatbot context.
    """
    from .models import Project

    try:
        project = Project.objects.get(id=project_id)
        
        # Create embedding for project
        project_text = f"{project.name} {project.description}"
        embeddings = model_manager.get_embeddings(project_text)
        
        # Store in Chroma (vector DB)
        chroma_client = model_manager.get_chroma_client()
        collection = chroma_client.get_or_create_collection(name="projects")
        
        collection.add(
            ids=[str(project_id)],
            documents=[project_text],
            embeddings=[embeddings],
            metadatas=[{"project_id": str(project_id), "name": project.name}]
        )
        
        logger.info(f"Embeddings generated for project {project_id}")
        return {"project_id": str(project_id), "status": "embeddings_created"}
    
    except Exception as exc:
        logger.error(f"Error generating embeddings for project {project_id}: {exc}")
        raise self.retry(exc=exc)

