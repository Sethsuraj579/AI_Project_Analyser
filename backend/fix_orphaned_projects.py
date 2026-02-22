#!/usr/bin/env python
"""
Fix orphaned projects with NULL user_id before running migrations.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_analyser.settings")
django.setup()

from analyser.models import Project

# Delete projects with NULL user_id
orphaned = Project.objects.filter(user__isnull=True)
count = orphaned.count()

if count > 0:
    print(f"Found {count} orphaned projects. Deleting...")
    orphaned.delete()
    print(f"✅ Deleted {count} orphaned projects")
else:
    print("✅ No orphaned projects found")
