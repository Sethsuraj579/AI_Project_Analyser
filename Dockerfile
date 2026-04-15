# ── Backend ──
FROM python:3.11-slim AS backend

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
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build


FROM nginx:alpine AS frontend

COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
