# AI Project Analyser

A full-stack **AI-powered project analysis** tool that generates **pictorial reports with interactive graphs** across 7 key dimensions. Built with **Django + GraphQL** backend and **React + Recharts** frontend.

---

## Features

### 7 Analysis Dimensions (with real-time data collection)

| # | Dimension | Metric | Unit | What it measures |
|---|-----------|--------|------|-----------------|
| 1 | **Frontend** | `Frontend_load_time` | ms | Page load performance |
| 2 | **Backend** | `Backend_proc_time` | ms | Server processing speed |
| 3 | **Database** | `Database_query_time` | ms | Database query latency |
| 4 | **Structure** | `Structure_modularity` | score | Code modularity & architecture |
| 5 | **API** | `API_latency` | ms | API endpoint response time |
| 6 | **Integration** | `Integration_success` | % | Third-party integration health |
| 7 | **Security** | `Security_audit` | score | Security vulnerability assessment |

### Interactive Charts & Graphs
- **Radar Chart** — 7-dimension overall health overview
- **Bar Chart** — Score comparison with threshold reference lines
- **Pie Chart** — Weight distribution showing each dimension's impact
- **Gauge Meters** — Individual circular gauges per dimension
- **Heatmap** — Color-coded score visualization
- **Trend Lines** — Historical score trends over time (toggleable per dimension)
- **Detailed Report Cards** — Per-dimension breakdown with raw values, thresholds & grades

### Scoring System
- Each metric is scored **0–100** based on configurable thresholds
- Weighted scoring (**15–18%** per dimension) produces an **overall project score**
- Letter grades: **A+ / A / B / C / D / E / F**
- Real-time URL probing (if frontend/backend URLs are provided)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 4.2, Python 3.10+ (venv) |
| **API** | GraphQL (graphene-django) |
| **Frontend** | React 18, Vite 5, React Router 6 |
| **Build Tool** | Vite (replaces CRA) |
| **Charts** | Recharts |
| **GraphQL Client** | Apollo Client 3 |
| **Styling** | Custom CSS (dark theme) |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip & npm

### 1. Backend Setup (Virtual Environment)

```bash
cd backend
python -m venv venv

# Activate venv:
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo    # Creates demo project with sample data
python manage.py runserver    # Starts at http://localhost:8000
```

The GraphQL playground is available at **http://localhost:8000/graphql/**

### 2. Frontend Setup (Vite)

```bash
cd frontend
npm install
npm run dev    # Starts Vite dev server at http://localhost:3000
```

### 3. Use the App

1. Open **http://localhost:3000**
2. You'll see the demo project on the dashboard
3. Click **"Run Analysis"** to collect real-time metrics
4. Click **"View Report"** for the full pictorial report with all graphs
5. Create new projects with actual frontend/backend URLs for real probing

---

## GraphQL API

### Example Queries

```graphql
# Get all projects with latest analysis
query {
  allProjects {
    id
    name
    latestRun {
      overallScore
      overallGrade
      metrics {
        dimension
        metricName
        rawValue
        normalisedScore
        grade
        weight
      }
    }
  }
}

# Run a new analysis
mutation {
  runAnalysis(projectId: "your-project-uuid") {
    analysisRun {
      overallScore
      overallGrade
      metrics {
        dimension
        normalisedScore
        grade
      }
    }
  }
}
```

---

## Project Structure

```
AI_project_analyser/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── project_analyser/        # Django project config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── schema.py            # Root GraphQL schema
│   └── analyser/                # Main app
│       ├── models.py            # Project, AnalysisRun, MetricSnapshot, HistoricalTrend
│       ├── engine.py            # AI analysis engine (collectors, scoring, weights)
│       ├── schema.py            # GraphQL types, queries, mutations
│       ├── admin.py             # Django admin registration
│       └── management/commands/
│           └── seed_demo.py     # Demo data seeder
│
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js               # Routes & navigation
        ├── index.js             # Apollo + Router setup
        ├── index.css            # Global dark theme styles
        ├── graphql/
        │   ├── client.js        # Apollo Client config
        │   └── queries.js       # All GraphQL queries & mutations
        ├── pages/
        │   ├── ProjectList.js   # Dashboard with project cards
        │   ├── ProjectDetail.js # Full report page with all charts
        │   └── NewProject.js    # Create project form
        └── components/
            ├── OverallScoreGauge.js   # Circular score gauge
            ├── MiniRadarChart.js      # Small radar for cards
            ├── DimensionRadarChart.js # Full radar chart
            ├── DimensionBarChart.js   # Horizontal bar chart
            ├── WeightPieChart.js      # Weight distribution pie
            ├── MetricGaugeGrid.js     # Individual gauge meters
            ├── TrendLineChart.js      # Historical trend lines
            ├── MetricDetailCard.js    # Dimension detail card
            └── ScoreHeatmap.js        # Score heatmap grid
```
