# Backend Deployment Checklist

Use this checklist before deploying the Django backend to production.

## Environment
- [ ] Copy `.env.example` to `.env` and fill in production values.
- [ ] Use a strong `DJANGO_SECRET_KEY`.
- [ ] Set `DJANGO_DEBUG=False`.
- [ ] Set `ALLOWED_HOSTS` to the production domain(s).
- [ ] Set `CORS_ALLOWED_ORIGINS` to the production frontend domain.
- [ ] Configure `DATABASE_URL` to a production PostgreSQL database.
- [ ] Configure `REDIS_URL` for Celery and cache-backed rate limiting.
- [ ] Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Set `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and redirect URI.
- [ ] Set SMTP email credentials and `DEFAULT_FROM_EMAIL`.
- [ ] Configure `SENTRY_DSN` if error monitoring is required.

## Security
- [ ] Confirm HTTPS is enabled on the public domain.
- [ ] Verify `SECURE_SSL_REDIRECT` is active in production.
- [ ] Verify HSTS settings are enabled.
- [ ] Confirm session and CSRF cookies are secure.
- [ ] Rotate any secrets that were ever exposed in local files or chat.
- [ ] Keep `.env` out of version control.
- [ ] Confirm Razorpay webhook secret matches the dashboard setting.
- [ ] Confirm Google OAuth redirect URI matches the deployed backend URL.

## Database
- [ ] Run migrations: `python manage.py migrate`.
- [ ] Seed subscription plans if needed: `python manage.py seed_plans`.
- [ ] Verify the database user has only the permissions it needs.
- [ ] Configure automated backups (minimum 24-hour retention).
- [ ] Test a backup and restore procedure on staging database.
- [ ] Document RTO (Recovery Time Objective) and RPO (Recovery Point Objective).

## Backups & Disaster Recovery
- [ ] Enable automated daily backups via Neon dashboard (minimum 24h retention).
- [ ] Store backups in at least 2 geographic regions.
- [ ] Document restore procedure and test monthly on staging.
- [ ] Set RTO target: 1 hour (restore from backup to production).
- [ ] Set RPO target: 24 hours (maximum data loss acceptable).
- [ ] Keep backups encrypted at rest and in transit.
- [ ] Monitor backup job completion and receive alerts on failures.

## App Setup
- [ ] Run Django system checks: `python manage.py check`.
- [ ] Run backend tests: `pytest`.
- [ ] Run the app with Gunicorn in production.
- [ ] Serve static files with Whitenoise or a reverse proxy/CDN.
- [ ] Configure a reverse proxy such as Nginx.
- [ ] Ensure Celery workers are running.
- [ ] Ensure Redis is reachable by both Django and Celery.
- [ ] Confirm file uploads and report downloads work in production.

## Payments
- [ ] Test Razorpay order creation in test mode.
- [ ] Test Razorpay webhook delivery against the deployed URL.
- [ ] Verify payment success and failure flows.
- [ ] Confirm PDF report download works for paid plans.

## Authentication
- [ ] Test login, registration, OTP verification, and Google sign-in.
- [ ] Confirm rate limiting is working for auth endpoints.
- [ ] Verify JWT token expiry and logout behavior.
- [ ] Confirm password reset or account recovery flow if enabled.

## Scaling & Performance
- [ ] Calculate expected concurrent users and scale Gunicorn workers accordingly.
- [ ] Gunicorn formula: `workers = (2 x CPU_cores) + 1`.
- [ ] Example: 4 CPU cores = 9 workers.
- [ ] Configure Celery autoscaling for task processing.
- [ ] Set up database connection pooling (Neon pooler recommended).
- [ ] Enable Redis connection persistence with keepalive.
- [ ] Configure CDN for static assets (optional but recommended).
- [ ] Set up horizontal scaling on application platform.

## Monitoring & Alerting
- [ ] Health check endpoint returns `{"status": "ok", "checks": {...}}`.
- [ ] Configure Sentry alerts for error-rate spikes (>10 errors/minute).
- [ ] Configure Sentry alerts for payment failures.
- [ ] Configure Sentry alerts for database connection errors.
- [ ] Configure Sentry alerts for webhook failures.
- [ ] Set up log aggregation and search (Sentry, Datadog, or similar).
- [ ] Create alert for high API response time (>500ms p95).
- [ ] Create alert for high database query time.
- [ ] Create alert for Redis connection failures.
- [ ] Create alert for Celery worker disconnections.
- [ ] Create alert for backup job failures.

## Incident Response
- [ ] Document on-call rotation and escalation procedures.
- [ ] Create runbook for database connection failures.
- [ ] Create runbook for Redis unavailability.
- [ ] Create runbook for Celery worker crashes.
- [ ] Create runbook for payment webhook failures.
- [ ] Create runbook for high error rates.
- [ ] Set up status page (StatusPage.io or similar).
- [ ] Document rollback procedure for failed deployments.
- [ ] Keep incident log with root cause analysis for learning.

## Monitoring
- [ ] Check Sentry event capture.
- [ ] Review logs for startup errors.
- [ ] Confirm health check endpoint responds correctly.
- [ ] Confirm worker and broker status after deploy.

## Final Smoke Test
- [ ] Create a user account.
- [ ] Log in successfully.
- [ ] Create a project.
- [ ] Run an analysis.
- [ ] Download the PDF report.
- [ ] Upgrade a plan.
- [ ] Verify webhook-driven payment updates.
