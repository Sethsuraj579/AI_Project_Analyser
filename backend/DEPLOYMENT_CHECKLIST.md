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
- [ ] Test a backup and restore procedure.

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
