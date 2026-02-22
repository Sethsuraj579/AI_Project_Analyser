import re
import environ

with open('.env', 'r') as f:
    content = f.read()

# Parse all KEY=VALUE pairs
pattern = r'^([A-Z_]+)=(.*)$'
matches = re.finditer(pattern, content, re.MULTILINE)

print("=== Raw .env file parsing ===")
for match in matches:
    key, value = match.groups()
    if key == 'SENTRY_DSN':
        print(f"{key}: {value}")
        print(f"Length: {len(value)}")
        print(f"Bool (is not empty): {bool(value.strip())}")

print("\n=== Using environ.Env ===")
env = environ.Env()
env.read_env('.env')
sentry_dsn = env('SENTRY_DSN', default='NOT_FOUND')
print(f"SENTRY_DSN from environ: {sentry_dsn}")
print(f"Length: {len(sentry_dsn)}")
print(f"Repr: {repr(sentry_dsn)}")

# Try to get all env vars
print("\n=== All environment variables ===")
for key in ['SENTRY_DSN', 'DATABASE_URL', 'REDIS_URL', 'DJANGO_SECRET_KEY']:
    value = env(key, default='NOT_FOUND')
    if value != 'NOT_FOUND':
        print(f"{key}: {value[:60]}...")
    else:
        print(f"{key}: NOT FOUND")
