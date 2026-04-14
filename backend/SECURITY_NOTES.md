# Security Notes

- Do not commit `.env` or any secrets file.
- Rotate any credentials that have been exposed in chat or local copies.
- Keep production behind HTTPS.
- Use Redis for shared cache and Celery broker in production.
- Prefer least-privilege database credentials.
- Review OAuth redirect URIs and webhook URLs after each deploy.
