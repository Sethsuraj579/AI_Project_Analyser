"""
WSGI config for project_analyser project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_analyser.settings")
application = get_wsgi_application()
