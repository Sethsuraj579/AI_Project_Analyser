# ── Backend ──
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

# System dependencies (gcc and libpq-dev for psycopg2, git for package installs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY backend/ ./

RUN DJANGO_SECRET_KEY=build-only-secret-key python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

CMD ["gunicorn", "project_analyser.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]


# ── Frontend ──
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
ENV npm_config_legacy_peer_deps=true \
    npm_config_fund=false \
    npm_config_audit=false
COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


FROM nginx:alpine AS frontend

COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
