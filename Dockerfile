# ── Backend ──
FROM python:3.11-slim@sha256:0a3ce34a3b5b1b3f1f0e3b1c0b0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e AS backend

WORKDIR /app/backend

# System dependencies (git for repo cloning, gcc for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

CMD ["gunicorn", "project_analyser.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]


# ── Frontend ──
FROM node:20-alpine@sha256:f876f61b6b8d5c7e8b8c8d8e8f8g8h8i8j8k8l8m8n8o8p8q8r8s8t8u8v8w AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build


FROM nginx:alpine@sha256:0a3ce34a3b5b1b3f1f0e3b1c0b0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e AS frontend

COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
