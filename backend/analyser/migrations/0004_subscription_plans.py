# Generated migration for subscription plans

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('analyser', '0003_projectsummary_chatmessage'),
    ]

    operations = [
        migrations.CreateModel(
            name='Plan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(choices=[('free', 'Free'), ('basic', 'Basic'), ('premium', 'Premium')], max_length=50, unique=True)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('max_projects', models.IntegerField(help_text='Maximum number of projects allowed (-1 for unlimited)')),
                ('max_analyses_per_month', models.IntegerField(help_text='Maximum analyses per month (-1 for unlimited)')),
                ('price_per_month', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('features', models.JSONField(blank=True, default=list, help_text='List of features included in this plan')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['price_per_month'],
            },
        ),
        migrations.CreateModel(
            name='UserSubscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subscribed_at', models.DateTimeField(auto_now_add=True)),
                ('renews_at', models.DateTimeField(blank=True, help_text='When the subscription renews (for basic plan)', null=True)),
                ('projects_used', models.IntegerField(default=0, help_text='Number of projects created this period')),
                ('analyses_used', models.IntegerField(default=0, help_text='Number of analyses run this period')),
                ('is_active', models.BooleanField(default=True)),
                ('plan', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='subscribers', to='analyser.plan')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='subscription', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-subscribed_at'],
            },
        ),
        migrations.AddField(
            model_name='project',
            name='user',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, related_name='projects', to=settings.AUTH_USER_MODEL, null=True),
            preserve_default=False,
        ),
        migrations.AddIndex(
            model_name='project',
            index=models.Index(fields=['user', '-created_at'], name='analyser_pr_user_id_created_idx'),
        ),
    ]
