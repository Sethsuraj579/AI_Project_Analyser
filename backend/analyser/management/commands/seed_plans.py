"""Management command to seed default subscription plans."""
from django.core.management.base import BaseCommand
from analyser.models import Plan


class Command(BaseCommand):
    help = "Create default subscription plans"

    def handle(self, *args, **options):
        # Free Plan
        free_plan, created = Plan.objects.get_or_create(
            name="free",
            defaults={
                "description": "Get started with basic analysis",
                "max_projects": 5,
                "max_analyses_per_month": -1,  # Unlimited
                "price_per_month": 0,
                "features": [
                    "Up to 5 projects",
                    "Basic analysis",
                    "Email support",
                    "Standard metrics",
                ],
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS("✅ Created Free plan"))
        else:
            self.stdout.write("ℹ️  Free plan already exists")

        # Basic Plan
        basic_plan, created = Plan.objects.get_or_create(
            name="basic",
            defaults={
                "description": "Perfect for growing teams",
                "max_projects": 20,
                "max_analyses_per_month": -1,  # Unlimited
                "price_per_month": 29,
                "features": [
                    "Up to 20 projects",
                    "Unlimited analyses",
                    "30-day project reports",
                    "Priority email support",
                    "Advanced metrics",
                    "Trend analysis",
                    "Custom thresholds",
                ],
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS("✅ Created Basic plan"))
        else:
            self.stdout.write("ℹ️  Basic plan already exists")

        # Premium Plan
        premium_plan, created = Plan.objects.get_or_create(
            name="premium",
            defaults={
                "description": "For power users and enterprises",
                "max_projects": -1,  # Unlimited
                "max_analyses_per_month": -1,  # Unlimited
                "price_per_month": 99,
                "features": [
                    "Unlimited projects",
                    "Unlimited analyses",
                    "Unlimited reports",
                    "24/7 priority support",
                    "All metrics & features",
                    "API access",
                    "Custom integrations",
                    "Dedicated account manager",
                    "Advanced analytics",
                    "Webhooks",
                ],
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS("✅ Created Premium plan"))
        else:
            self.stdout.write("ℹ️  Premium plan already exists")

        self.stdout.write(self.style.SUCCESS("\n✅ All subscription plans are set up!"))
