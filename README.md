# AI Project Analyser

AI Project Analyser is a full-stack web application for analyzing software projects and presenting the results in a visual dashboard. It combines a Django backend with a React frontend to score projects, show charts and reports, manage pricing plans, and handle authentication and payments.

## Project Details

The application is designed to help users evaluate a project across several dimensions such as frontend, backend, database, structure, API, integration, and security. It includes:

- Visual score reports with gauges, charts, heatmaps, and trends
- Project comparison and summary views
- Authentication flows for login, registration, Google sign-in, and OTP
- Pricing and subscription pages with Razorpay payment support
- Responsive UI behavior for mobile, tablet, laptop, and desktop screens

## Dimensions Used

| Dimension | What It Measures |
| --- | --- |
| Frontend | UI performance, responsiveness, and user-facing load behavior |
| Backend | Server-side processing speed, stability, and request handling |
| Database | Query latency, efficiency, and data access performance |
| Structure | Code organization, modularity, and maintainability |
| API | Endpoint latency, reliability, and response quality |
| Integration | Success and health of external service connections |
| Security | Vulnerability checks, hardening, and overall security posture |

## Stack

- Backend: Django 4.2, GraphQL, Celery, Redis, PostgreSQL
- Frontend: React, Vite, Apollo Client, Recharts
- Styling: Custom responsive CSS

## Repository Structure

```text
AI_project_analyser/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── analyser/
│   │   ├── models.py
│   │   ├── engine.py
│   │   ├── schema.py
│   │   ├── payment_views.py
│   │   ├── report_views.py
│   │   ├── tasks.py
│   │   ├── webhook_handlers.py
│   │   ├── query_utils.py
│   │   ├── razorpay_utils.py
│   │   ├── chatbot.py
│   │   ├── integrations.py
│   │   ├── ml_models.py
│   │   ├── management/
│   │   ├── migrations/
│   │   ├── services/
│   │   └── tests/
│   └── project_analyser/
│       ├── settings.py
│       ├── urls.py
│       ├── schema.py
│       ├── celery.py
│       ├── asgi.py
│       └── wsgi.py
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       ├── graphql/
│       └── pages/
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
└── README.md
```

## Main Frontend Areas

- `src/pages/` contains the page-level screens such as landing, pricing, login, register, project list, project detail, settings, and comparison.
- `src/components/` contains shared UI pieces such as charts, pricing cards, payment forms, report widgets, and reusable layout components.
- `src/graphql/` contains the Apollo client setup and GraphQL queries.

## Main Backend Areas

- `backend/analyser/` contains the app logic for analysis, reporting, payments, integrations, tasks, and API/schema code.
- `backend/project_analyser/` contains the Django project settings, routing, Celery bootstrap, ASGI/WSGI entry points, and test settings.

## Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker compose up --build
```

To build the images separately:

```bash
docker build -t ai-project-analyser .
```

The compose setup starts the backend, Celery worker, Redis, and frontend services.

| Service | Purpose | Port |
| --- | --- | --- |
| backend | Django API, GraphQL, and business logic | 8000 |
| frontend | React app served through Nginx | 3000 |
| celery | Background job worker for tasks | N/A |
| redis | Cache and queue broker for Celery | 6379 |

## Production Checks

- Frontend build: `npm run build`
- Backend tests: `pytest`
- Django deploy checks: `python manage.py check --deploy`

## Notes

- Keep secrets out of version control.
- Use environment files only for local development.
- The UI is intended to remain responsive across mobile, tablet, laptop, and desktop devices.
