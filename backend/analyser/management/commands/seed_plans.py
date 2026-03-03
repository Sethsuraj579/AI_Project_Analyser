"""Management command to seed default subscription plans."""
from django.core.management.base import BaseCommand
from analyser.models import Plan


class Command(BaseCommand):
    help = "Create default subscription plans"

    def handle(self, *args, **options):
        plans = {
            "free": {
                "description": "Get started with basic analysis",
                "max_projects": 5,
                "max_analyses_per_month": -1,
                "price_per_month": 0,
                "features": [
                    "Up to 5 projects",
                    "Basic analysis",
                    "Email support",
                    "Standard metrics",
                ],
            },
            "basic": {
                "description": "Perfect for growing teams",
                "max_projects": 20,
                "max_analyses_per_month": -1,
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
            },
            "premium": {
                "description": "For power users and enterprises",
                "max_projects": -1,
                "max_analyses_per_month": -1,
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
            },
        }

        for name, defaults in plans.items():
            _, created = Plan.objects.update_or_create(name=name, defaults=defaults)
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Created {name.title()} plan"))
            else:
                self.stdout.write(self.style.SUCCESS(f"♻️  Updated {name.title()} plan"))

        self.stdout.write(self.style.SUCCESS("\n✅ All subscription plans are synced!"))
