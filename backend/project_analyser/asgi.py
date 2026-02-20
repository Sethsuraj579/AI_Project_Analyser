"""
ASGI config for project_analyser project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_analyser.settings")
application = get_asgi_application()
