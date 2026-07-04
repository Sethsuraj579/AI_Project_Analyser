from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analyser", "0015_rename_analyser_us_user_id_65f27c_idx_analyser_us_user_id_2d7832_idx"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="password_changed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]