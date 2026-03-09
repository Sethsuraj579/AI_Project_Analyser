"""Service helpers for project-to-project comparison logic."""

from analyser.models import Project


def compare_user_projects(user, project_id, compare_with_id):
    """Compare latest completed analysis between two user-owned projects.

    Returns a dict suitable for GraphQL mapping.
    Raises Exception for invalid high-level request conditions.
    """
    if str(project_id) == str(compare_with_id):
        raise Exception("Select a different project to compare.")

    current_project = Project.objects.filter(id=project_id, user=user).first()
    other_project = Project.objects.filter(id=compare_with_id, user=user).first()
    if not current_project or not other_project:
        raise Exception("One or both projects were not found.")

    current_run = current_project.analysis_runs.filter(status="completed").first()
    other_run = other_project.analysis_runs.filter(status="completed").first()

    if not current_run or not other_run:
        missing = []
        if not current_run:
            missing.append(current_project.name)
        if not other_run:
            missing.append(other_project.name)
        return {
            "current_project": current_project,
            "other_project": other_project,
            "current_overall_score": current_run.overall_score if current_run else None,
            "other_overall_score": other_run.overall_score if other_run else None,
            "current_grade": current_run.overall_grade if current_run else None,
            "other_grade": other_run.overall_grade if other_run else None,
            "overall_delta": None,
            "better_project_name": None,
            "compared_dimensions": [],
            "message": f"Run analysis first for: {', '.join(missing)}",
        }

    current_metrics = {m.dimension: m for m in current_run.metrics.all()}
    other_metrics = {m.dimension: m for m in other_run.metrics.all()}

    dimensions = sorted(set(current_metrics.keys()) | set(other_metrics.keys()))
    compared_dimensions = []

    for dim in dimensions:
        current_metric = current_metrics.get(dim)
        other_metric = other_metrics.get(dim)
        current_score = current_metric.normalised_score if current_metric else None
        other_score = other_metric.normalised_score if other_metric else None

        if current_score is None or other_score is None:
            delta = None
            winner = "tie"
        else:
            delta = round(current_score - other_score, 2)
            winner = "current" if delta > 0 else ("other" if delta < 0 else "tie")

        metric_name = current_metric.metric_name if current_metric else (other_metric.metric_name if other_metric else dim)

        compared_dimensions.append(
            {
                "dimension": dim,
                "metric_name": metric_name,
                "current_score": round(current_score, 2) if current_score is not None else None,
                "other_score": round(other_score, 2) if other_score is not None else None,
                "delta": delta,
                "winner": winner,
            }
        )

    overall_delta = round((current_run.overall_score or 0) - (other_run.overall_score or 0), 2)
    better_project_name = current_project.name if overall_delta > 0 else (other_project.name if overall_delta < 0 else "Tie")

    return {
        "current_project": current_project,
        "other_project": other_project,
        "current_overall_score": round(current_run.overall_score, 2) if current_run.overall_score is not None else None,
        "other_overall_score": round(other_run.overall_score, 2) if other_run.overall_score is not None else None,
        "current_grade": current_run.overall_grade,
        "other_grade": other_run.overall_grade,
        "overall_delta": overall_delta,
        "better_project_name": better_project_name,
        "compared_dimensions": compared_dimensions,
        "message": "Comparison generated successfully.",
    }
