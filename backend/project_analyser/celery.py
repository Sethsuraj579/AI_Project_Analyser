"""
Celery configuration for project_analyser.
Autodiscovers tasks from all installed apps.
"""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_analyser.settings")

app = Celery("project_analyser")

# Read config from Django settings, prefixed with CELERY_
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks.py in all installed apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Verify Celery is working."""
    print(f"Request: {self.request!r}")
