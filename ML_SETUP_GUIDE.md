# AI Project Analyser - ML Features Setup & Startup Guide

## 🎯 What's New

You now have AI-powered features:
- **Project Summary**: AI-generated text summaries of your projects using transformer models
- **Chatbot**: Ask questions and get suggestions about your projects
- **Async Processing**: Long-running tasks are handled by Celery workers

---

## 📋 Prerequisites

### 1. Redis (Message Broker)
Celery uses Redis for task queueing. You have two options:

**Option A: Local Redis (Development)**
```powershell
# Install and run Redis locally (Windows)
# Download: https://github.com/microsoftarchive/redis/releases
# Or use Windows Subsystem for Linux (WSL)
```

**Option B: Upstash Redis Cloud (Recommended)**
- Already configured in `.env` as `REDIS_URL`
- Free tier available: https://upstash.com/

### 2. Python Packages
Already installed via `requirements.txt`:
- `transformers` - Hugging Face transformer models
- `torch` - PyTorch for ML inference
- `langchain` - LLM orchestration
- `chromadb` - Vector database for embeddings
- `celery` & `redis` - Task queue

---

## 🚀 Startup Instructions

### Terminal 1: Django Development Server
```powershell
# From workspace root
cd backend

# Activate venv (if not already active)
& .\venv\Scripts\Activate.ps1

# Run migrations if not done
python manage.py migrate

# Start Django
python manage.py runserver
```
✅ Server runs on: `http://localhost:8000`

### Terminal 2: Celery Worker (Required for Async Tasks)
```powershell
# From workspace root
# Run the provided PowerShell script:
.\start_celery_worker.ps1

# OR manually:
cd backend
celery -A project_analyser worker -l info -c 2
```

**What `-c 2` means**: 2 concurrent worker processes. Increase for production:
- Local: `-c 2` to `-c 4`
- Production: `-c 8` to `-c 20` (depends on CPU cores)

### Terminal 3: Frontend Development Server
```powershell
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```
✅ Frontend runs on: `http://localhost:5173`

---

## 🧪 Testing the ML Features

### 1. Generate Project Summary
```bash
# In Django shell
python manage.py shell
```

```python
from analyser.ml_models import model_manager

# Test summarizer
text = "This is a high-performance web project with React frontend and Django backend. It uses PostgreSQL."
summary = model_manager.summarize(text)
print(summary)
```

### 2. Test Chat Module
```python
from analyser.chatbot import chatbot

response = chatbot.chat("What are the key improvements for this project?")
print(response)
```

### 3. Manual Celery Task Test
```python
from analyser.tasks import generate_project_summary
from analyser.models import Project

# Get a project
project = Project.objects.first()

# Queue the task
summary_task = generate_project_summary.delay(str(project.id))

# Check status
print(summary_task.status)
print(summary_task.result)
```

---

## 🔧 Troubleshooting

### Celery Worker Won't Start

**Error: "Can't connect to Redis"**
- ✅ Use Upstash Redis (cloud-based) instead
- Check `.env` has correct `REDIS_URL`
- Test connection:
  ```python
  import redis
  r = redis.from_url("redis://localhost:6379/0")
  r.ping()
  ```

**Error: "No module named transformers"**
- Reinstall requirements:
  ```bash
  pip install -r requirements.txt --upgrade
  ```

**Models taking too long to load**
- First model load downloads ~500MB
- Check available disk space
- Progress indicator shows download status

### Transformer Models Slow

**Performance tuning** in `ml_models.py`:
```python
# Use CPU (slower but no GPU required)
device=-1

# Use GPU (if available)
device=0
```

**Use lighter models**:
- `t5-small` (default) - Fast, 60MB
- `distilbert-base` - Lightweight
- `gpt2` - Smallest

---

## 📊 Monitoring Celery Tasks

### View Active Tasks
```powershell
# In a new terminal
celery -A project_analyser inspect active
```

### View Task History
```python
# In Django shell
from celery.result import AsyncResult

task_id = "xxx-xxx-xxx"
result = AsyncResult(task_id)
print(result.status)      # pending, started, success, failure
print(result.result)      # Task result or error
```

### Clear Task Queue
```bash
celery -A project_analyser purge
```

---

## 📈 Architecture

```
┌─ Frontend (React)
│  └─ Sends GraphQL mutations
│
├─ Django Backend
│  ├─ GraphQL API
│  ├─ Generate Summary (GraphQL)
│  └─ Send Chat Message (GraphQL)
│
├─ Celery Worker
│  ├─ generate_project_summary task
│  └─ generate_project_embeddings task
│
├─ ML Models
│  ├─ Transformers (T5, BERT, etc.)
│  └─ Sentence Embeddings
│
├─ Vector Database
│  └─ Chroma (stores project embeddings)
│
└─ Message Broker
   └─ Redis (Upstash in production)
```

---

## 🚢 Production Deployment

### 1. Use Production Redis
- Upstash Redis (recommended): https://upstash.com/
- Configure `REDIS_URL` in secrets

### 2. Run Multiple Celery Workers
```bash
# In Docker/systemd
celery -A project_analyser worker -l info -c 10 -n worker1@hostname
celery -A project_analyser worker -l info -c 10 -n worker2@hostname
```

### 3. Use Celery Beat (Optional - for scheduled tasks)
```bash
celery -A project_analyser beat -l info
```

### 4. Docker Setup
See `Dockerfile` - already includes Celery worker configuration

---

## 📚 API Reference

### GraphQL Mutations

**Generate Summary**
```graphql
mutation {
  generateProjectSummary(projectId: "uuid") {
    projectSummary {
      id
      summary
      generatedAt
    }
    success
    message
  }
}
```

**Send Chat Message**
```graphql
mutation {
  sendChatMessage(projectId: "uuid", message: "What improvements needed?") {
    chatMessage {
      id
      role
      content
    }
    chatbotResponse
    success
  }
}
```

---

## 🎓 Next Steps

1. ✅ Start all three servers (Django, Celery, Frontend)
2. ✅ Create a project in the frontend
3. ✅ Run analysis on it
4. ✅ Click "Generate AI Summary" button
5. ✅ Chat with the project chatbot

---

## 📞 Support

For issues:
1. Check server logs (look for error messages)
2. Verify Redis connection
3. Check GPU availability (if using CUDA)
4. Review Celery worker logs
5. Run: `python manage.py shell` and test imports manually

---

**Happy analyzing! 🚀**
