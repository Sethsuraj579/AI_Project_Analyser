# Generated migration for Payment and Invoice models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('analyser', '0004_subscription_plans'),
    ]

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='INR', max_length=3)),
                ('razorpay_order_id', models.CharField(blank=True, db_index=True, max_length=255, null=True, unique=True)),
                ('razorpay_payment_id', models.CharField(blank=True, db_index=True, max_length=255)),
                ('razorpay_signature', models.CharField(blank=True, max_length=255)),
                ('razorpay_subscription_id', models.CharField(blank=True, db_index=True, max_length=255)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('succeeded', 'Succeeded'), ('failed', 'Failed'), ('canceled', 'Canceled')], default='pending', max_length=20)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('succeeded_at', models.DateTimeField(blank=True, null=True)),
                ('plan', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='analyser.plan')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Invoice',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='INR', max_length=3)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('open', 'Open'), ('paid', 'Paid'), ('void', 'Void'), ('uncollectible', 'Uncollectible')], default='draft', max_length=20)),
                ('razorpay_invoice_id', models.CharField(blank=True, db_index=True, max_length=255, null=True, unique=True)),
                ('razorpay_payment_id', models.CharField(blank=True, db_index=True, max_length=255)),
                ('issued_at', models.DateTimeField(auto_now_add=True)),
                ('due_date', models.DateField()),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('pdf_url', models.URLField(blank=True, default='')),
                ('payment', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoice', to='analyser.payment')),
                ('subscription', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to='analyser.usersubscription')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-issued_at'],
            },
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['user', '-created_at'], name='analyser_pa_user_id_created_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['status'], name='analyser_pa_status_idx'),
        ),
        migrations.AddIndex(
            model_name='invoice',
            index=models.Index(fields=['user', '-issued_at'], name='analyser_in_user_id_issued_idx'),
        ),
        migrations.AddIndex(
            model_name='invoice',
            index=models.Index(fields=['status'], name='analyser_in_status_idx'),
        ),
    ]
