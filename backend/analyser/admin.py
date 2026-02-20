from django.contrib import admin
from .models import Project, AnalysisRun, MetricSnapshot, HistoricalTrend


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "repo_url", "created_at")
    search_fields = ("name",)


@admin.register(AnalysisRun)
class AnalysisRunAdmin(admin.ModelAdmin):
    list_display = ("project", "status", "overall_score", "overall_grade", "created_at")
    list_filter = ("status",)


@admin.register(MetricSnapshot)
class MetricSnapshotAdmin(admin.ModelAdmin):
    list_display = (
        "dimension",
        "metric_name",
        "raw_value",
        "unit",
        "normalised_score",
        "grade",
    )
    list_filter = ("dimension",)


@admin.register(HistoricalTrend)
class HistoricalTrendAdmin(admin.ModelAdmin):
    list_display = ("project", "dimension", "metric_name", "value", "recorded_at")
    list_filter = ("dimension",)
