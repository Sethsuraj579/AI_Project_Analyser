# Production Credentials Rotation Checklist

## Status: 🔴 CRITICAL - EXPOSED CREDENTIALS DETECTED

**Exposure Date**: April 25, 2026 (credentials visible in chat history)  
**Action**: Rotate all credentials immediately before production launch

---

## Services Requiring Credential Rotation

### 1. Django Secret Key
- **Current Status**: EXPOSED in .env attachment
- **Action**: Generate new key
- **Command**: 
  ```bash
  python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
  ```
- **Where to Update**: 
  - Backend `.env`: `DJANGO_SECRET_KEY`
  - Redeploy: `docker compose up -d --force-recreate`
- **Verification**: Check Django logs don't have validation errors

### 2. Neon PostgreSQL Database
- **Current Password**: EXPOSED (`npg_miS9zuCf0AVB`)
- **Action**: Change password in Neon console
- **Steps**:
  1. Log into Neon console (https://console.neon.tech)
  2. Go to Project → Branches → main → SQL Editor
  3. Run: `ALTER ROLE neondb_owner WITH PASSWORD 'NEW_SECURE_PASSWORD';`
  4. Update `DATABASE_URL` in `.env`
  5. Test: `docker compose exec backend python manage.py dbshell`
     - If that fails, list services/containers first:
       - `docker compose ps`
       - `docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"`
- **Verification**: Confirm migrations still work

### 3. Upstash Redis
- **Current Password**: EXPOSED (`gQAAAAAAARL9AAIncDExYTY0Njk5YzE3MzU0MjZkOGI2NjhhYjdiM2EyNGFlNHAxNzAzOTc`)
- **Action**: Rotate authentication token in Upstash console
- **Steps**:
  1. Log into Upstash console (https://console.upstash.com)
  2. Go to Database → Select your Redis instance
  3. Click "Rotate Auth Token"
  4. Update `REDIS_URL` in `.env`
  5. Restart Celery: `docker compose up -d celery`
- **Verification**: Test Celery tasks in Django admin

### 4. Razorpay API Keys
- **Current Keys EXPOSED**:
  - `RAZORPAY_KEY_ID`: `rzp_test_SOexEwbgLwcRx8`
  - `RAZORPAY_KEY_SECRET`: `JW10GO9qSrfFUULrJ3QV6d6V`
- **Action**: Generate new test keys (switch from test to live mode after verification)
- **Steps**:
  1. Log into Razorpay dashboard (https://dashboard.razorpay.com)
  2. Go to Settings → API Keys
  3. Generate new key pair
  4. Update `.env`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
  5. Regenerate webhook secret: Settings → Webhooks → Rotate Secret
  6. Update `.env`: `RAZORPAY_WEBHOOK_SECRET`
- **Verification**: Test payment flow in dashboard

### 5. Google OAuth Secret
- **Current Secret EXPOSED**: `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k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0`
- **Action**: Regenerate in Google Cloud Console
- **Steps**:
  1. Log into Google Cloud Console (https://console.cloud.google.com)
  2. Go to APIs & Services → Credentials
  3. Find OAuth 2.0 Client ID
  4. Click regenerate (or delete and recreate)
  5. Update `.env`: `GOOGLE_OAUTH_CLIENT_SECRET`
  6. Verify redirect URI: `https://api.analyser8.tech/accounts/google/callback/`
- **Verification**: Test Google login on production

### 6. Gmail App Password (Email)
- **Current Password EXPOSED**: `joyxodscdekjtilw`
- **Action**: Revoke old password and create new one
- **Steps**:
  1. Log into Google Account (https://myaccount.google.com)
  2. Go to Security → App passwords
  3. Find "Django App" and delete it
  4. Create new App password (Gmail service, custom device name)
  5. Update `.env`: `EMAIL_HOST_PASSWORD`
- **Verification**: Send test email from Django admin

### 7. Sentry DSN
- **Current DSN EXPOSED**: `https://d5e406bea3125cf483ee420bab8e9b75@o4510918447136768.ingest.de.sentry.io/4510918450217040`
- **Action**: Rotate project key in Sentry
- **Steps**:
  1. Log into Sentry (https://sentry.io)
  2. Go to Project → Settings → Client Keys
  3. Create new key (or rotate existing)
  4. Update `.env`: `SENTRY_DSN`
- **Verification**: Trigger test error in Django

---

## Deployment Process

### Phase 1: Prepare New Credentials ⏳ NOT STARTED
1. Generate Django secret key (local)
2. Gather all new credentials from services

### Phase 2: Update Environment ⏳ NOT STARTED
1. Update `.env` with new credentials
2. Do NOT commit `.env` to git
3. Ensure `.gitignore` includes `.env`

### Phase 3: Redeploy ⏳ NOT STARTED
1. SSH to EC2 instance
2. Pull latest code: `git pull origin main`
3. Rebuild and restart containers: `docker compose up -d --build`
4. Check logs: `docker compose logs -f backend`

### Phase 4: Verification ⏳ NOT STARTED
1. Test health endpoint: `curl https://api.analyser8.tech/health/`
2. Test login flow
3. Test Razorpay webhook (send test payment)
4. Monitor Sentry for any errors

---

## Security Notes

- ✗ DO NOT commit `.env` to git repository
- ✗ DO NOT share credentials in chat/messages again
- ✓ Store new credentials in secure password manager
- ✓ Consider using AWS Secrets Manager for production
- ✓ Audit git history for any exposed credentials:
  ```bash
  git log --all --full-history -- ".env"
  git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all
  git push origin --force --all
  ```

---

## Timeline
- **Start**: NOW (credentials compromised)
- **Target Completion**: Before first production user
- **Testing Duration**: 30 minutes
- **Total Time**: ~1-2 hours (depends on service response times)
