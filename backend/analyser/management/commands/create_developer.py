"""Management command to create a developer account for testing."""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from analyser.models import Plan, UserSubscription, Project, UserProfile, UserPreferences


class Command(BaseCommand):
    help = "Create a developer account with full access for testing all features"

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='developer',
            help='Username for the developer account (default: developer)'
        )
        parser.add_argument(
            '--email',
            type=str,
            default='developer@aianalyser.dev',
            help='Email for the developer account (default: developer@aianalyser.dev)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='Dev@12345',
            help='Password for the developer account (default: Dev@12345)'
        )
        parser.add_argument(
            '--plan',
            type=str,
            default='premium',
            choices=['free', 'basic', 'premium'],
            help='Subscription plan for the developer (default: premium)'
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        plan_name = options['plan']

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'User "{username}" already exists. Updating...')
            )
            user = User.objects.get(username=username)
            user.email = email
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.save()
        else:
            # Create developer user with superuser privileges
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(f'✅ Created developer account: {username}')
            )

        # Get or create the plan
        try:
            plan = Plan.objects.get(name=plan_name)
        except Plan.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Plan "{plan_name}" not found. Run: python manage.py seed_plans')
            )
            return

        # Create or update user subscription
        subscription, created = UserSubscription.objects.get_or_create(user=user)
        subscription.plan = plan
        subscription.is_active = True
        subscription.projects_used = 0
        subscription.analyses_used = 0
        subscription.renews_at = None
        subscription.save()

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Created {plan_name.upper()} subscription')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Updated to {plan_name.upper()} subscription')
            )

        # Create user profile
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Developer account for testing all features',
                'company': 'AI Analyser Dev Team',
                'location': 'Development Environment',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Created user profile'))

        # Create user preferences
        preferences, created = UserPreferences.objects.get_or_create(
            user=user,
            defaults={
                'email_notifications': True,
                'project_updates': True,
                'dark_theme': True,
                'notifications_popup': True,
                'public_profile': False,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Created user preferences'))

        # Create sample projects for testing
        sample_projects = [
            {
                'name': 'Sample React App',
                'repo_url': 'https://github.com/facebook/react',
                'description': 'Sample React project for testing analysis features'
            },
            {
                'name': 'Sample Django API',
                'repo_url': 'https://github.com/django/django',
                'description': 'Sample Django project for testing backend analysis'
            },
            {
                'name': 'Sample Node.js Server',
                'repo_url': 'https://github.com/nodejs/node',
                'description': 'Sample Node.js project for testing JavaScript analysis'
            },
        ]

        created_count = 0
        for project_data in sample_projects:
            project, created = Project.objects.get_or_create(
                user=user,
                name=project_data['name'],
                defaults={
                    'repo_url': project_data['repo_url'],
                    'description': project_data['description'],
                }
            )
            if created:
                created_count += 1

        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Created {created_count} sample project(s)')
            )

        # Print summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('🎉 Developer Account Ready!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'')
        self.stdout.write(f'Username:      {username}')
        self.stdout.write(f'Email:         {email}')
        self.stdout.write(f'Password:      {password}')
        self.stdout.write(f'Plan:          {plan_name.upper()}')
        self.stdout.write(f'Superuser:     Yes')
        self.stdout.write(f'Staff:         Yes')
        self.stdout.write(f'')
        self.stdout.write(self.style.SUCCESS('Access Points:'))
        self.stdout.write(f'  • Frontend:  http://localhost:5173')
        self.stdout.write(f'  • GraphQL:   http://localhost:8000/graphql')
        self.stdout.write(f'  • Admin:     http://localhost:8000/admin')
        self.stdout.write(f'')
        self.stdout.write(self.style.SUCCESS('Features Available:'))
        self.stdout.write(f'  ✅ All subscription features unlocked')
        self.stdout.write(f'  ✅ Unlimited projects and analyses')
        self.stdout.write(f'  ✅ Django admin panel access')
        self.stdout.write(f'  ✅ Sample projects created')
        self.stdout.write(f'  ✅ Full testing capabilities')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
