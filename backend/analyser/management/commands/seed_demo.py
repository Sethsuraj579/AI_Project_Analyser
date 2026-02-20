"""
Management command to seed a demo project and run an initial analysis.
Usage: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from analyser.models import Project
from analyser.engine import run_full_analysis


class Command(BaseCommand):
    help = "Create a demo project and run an initial analysis with sample data."

    def handle(self, *args, **options):
        project, created = Project.objects.get_or_create(
            name="Demo E-Commerce Platform",
            defaults={
                "description": "A full-stack e-commerce platform with React frontend, Django REST backend, PostgreSQL database, and third-party payment integration.",
                "repo_url": "https://github.com/demo/ecommerce",
                "frontend_url": "",
                "backend_url": "",
            },
        )
        action = "Created" if created else "Using existing"
        self.stdout.write(self.style.SUCCESS(f"{action} project: {project.name}"))

        # Run 3 analysis cycles to populate trend data
        for i in range(3):
            run = run_full_analysis(project)
            self.stdout.write(
                self.style.SUCCESS(
                    f"  Analysis #{i+1}: Score={run.overall_score:.1f} Grade={run.overall_grade}"
                )
            )

        self.stdout.write(self.style.SUCCESS("\nDemo data seeded successfully!"))
        self.stdout.write(f"  Project ID: {project.id}")
        self.stdout.write("  Open http://localhost:3000 to view the dashboard.")
