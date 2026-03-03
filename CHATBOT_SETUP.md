# Chatbot Troubleshooting & Quick Setup

## ✅ Quick Verification Checklist

Run these to verify everything works:

```bash
# 1. Check database migration applied
cd backend
python manage.py showmigrations analyser
# Should show 0009_analysisrun_embeddings_generated_and_more as [X]

# 2. Verify dependencies installed
python -c "from sentence_transformers import SentenceTransformer; print('✓ sentence-transformers OK')"
python -c "import chromadb; print('✓ chromadb OK')"
python -c "from langchain_huggingface import HuggingFacePipeline; print('✓ langchain OK')"

# 3. Test embeddings model loads
python -c "from analyser.ml_models import model_manager; model_manager.load_embeddings(); print('✓ Embeddings model loaded')"

# 4. Verify Celery is running
celery -A project_analyser inspect active
# Should see active tasks

# 5. Test chatbot import
python manage.py shell -c "from analyser.chatbot import chatbot; print('✓ Chatbot imports successfully')"
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Chatbot returns generic answers"

**Cause:** LLM loading failed, falling back to distilgpt2

**Fix:**
```bash
# Check logs
python manage.py runserver  # Look for warnings

# Force reload model
python manage.py shell
>>> from analyser.ml_models import model_manager
>>> model_manager._models = {}
>>> model_manager._initialized = False
```

### Issue 2: "ModuleNotFoundError: No module named 'sentence_transformers'"

**Cause:** Dependencies not installed

**Fix:**
```bash
pip install -r requirements.txt
# Or manually:
pip install sentence-transformers langchain-huggingface chromadb
```

### Issue 3: "Embeddings not generating after analysis"

**Cause:** Celery not running or embeddings task failing

**Fix:**
```bash
# Ensure Celery is running
.\start_celery_worker.ps1

# Check Celery logs for errors
celery -A project_analyser worker -l debug

# Manually trigger embedding generation
python manage.py shell
>>> from analyser.tasks import generate_project_embeddings
>>> from analyser.models import Project
>>> project = Project.objects.first()
>>> generate_project_embeddings(project.id)  # Sync version
True
```

### Issue 4: "Chroma vector DB errors"

**Cause:** Chroma client initialization failure

**Fix:**
```bash
# Clear Chroma cache
rm -rf ~/.chroma  # On Windows: remove %USERPROFILE%\.chroma

# Test Chroma
python manage.py shell
>>> import chromadb
>>> client = chromadb.Client()
>>> collection = client.get_or_create_collection("test")
>>> print("✓ Chroma works")
```

### Issue 5: "Chat returns same response for different questions"

**Cause:** Temperature too low or repetition penalty too high

**Fix:**
Edit [chatbot.py](analyser/chatbot.py#L42):
```python
text_gen = hf_pipeline(
    ...
    temperature=0.7,  # Increase from 0.7 to 0.9
    repetition_penalty=1.5,  # Decrease to 1.2
)
```

### Issue 6: "GraphQL mutation returns 'Error: ...'"

**Cause:** Missing authentication or project not found

**Fix:**
```graphql
# Make sure you're authenticated
query {
  user {  # This should work if authenticated
    email
  }
}

# Verify project exists
query {
  projects(first: 10) {
    edges {
      node {
        id
        name
      }
    }
  }
}

# Then test chat with real project UUID
mutation {
  sendChatMessage(
    projectId: "actual-uuid-from-above"
    message: "test"
  ) {
    success
    chatbotResponse
  }
}
```

---

## 🚀 Step-by-Step Setup

### Step 1: Update Code
```bash
cd backend

# Already done, but verify your files are updated:
git status  # Should show modified: analyser/chatbot.py, analyser/models.py, etc.
```

### Step 2: Apply Database Migration
```bash
python manage.py migrate analyser
# Output: Applying analyser.0009_analysisrun_embeddings_generated_and_more... OK
```

### Step 3: Install/Update Dependencies
```bash
pip install -r requirements.txt --upgrade

# Or install specific packages:
pip install langchain-core langchain-huggingface sentence-transformers chromadb
```

### Step 4: Start Celery (in new terminal)
```powershell
# Windows PowerShell
.\start_celery_worker.ps1

# Or manually:
celery -A project_analyser worker -l info -c 2
```

### Step 5: Run Django Server (in another terminal)
```bash
python manage.py runserver
```

### Step 6: Test in GraphQL Playground
```bash
# Open: http://localhost:8000/graphql

# 1. First, run an analysis to create a project with metrics
mutation {
  runAnalysis(projectId: "your-project-id") {
    analysisRun {
      id
      status
    }
  }
}

# 2. Wait for Celery to complete (embeddings_generated = true)

# 3. Then test chatbot
mutation {
  sendChatMessage(
    projectId: "your-project-id"
    message: "What should I improve?"
  ) {
    success
    chatbotResponse
    chatMessage {
      content
      role
    }
  }
}
```

---

## 📊 Monitoring Chatbot

### Check if embeddings generated
```bash
python manage.py shell
>>> from analyser.models import AnalysisRun
>>> run = AnalysisRun.objects.filter(status='completed').first()
>>> run.embeddings_generated
True  # Good!
False  # Need to debug
```

### Check Chroma contents
```bash
python manage.py shell
>>> from analyser.ml_models import model_manager
>>> chroma = model_manager.get_chroma_client()
>>> collection = chroma.get_collection("project_insights")
>>> collection.count()
5  # Should be > 0
```

### Monitor Celery tasks
```bash
# In a terminal:
celery -A project_analyser events

# In another terminal:
celery -A project_analyser inspect active
celery -A project_analyser inspect reserved
```

---

## 🧠 Understanding the Improved Chatbot

### Before (Broken)
```
User: "What should I improve?"
  → distilgpt2 (auto-complete model)
  → No project context
  → Response: "What should I improve? The project needs more features..."
```

### After (Fixed)
```
User: "What should I improve?"
  → Retrieves project metrics from DB
  → Identifies weak dimensions (e.g., Security: 45/100)
  → LLM prompt includes all metrics
  → Response: "Focus on Security (45/100) by running Bandit and Safety checks..."
```

---

## 🔄 Data Flow Diagram

```
Analysis Completes
       ↓
Save metrics to DB
       ↓
Trigger: generate_project_embeddings.delay()
       ↓
[Celery Task]
  • Get project + latest analysis
  • Build text from metrics
  • Generate embeddings (all-MiniLM-L6-v2)
  • Store in Chroma with metadata
  • Mark run.embeddings_generated = True
       ↓
Later... User asks chatbot
       ↓
[Chatbot Query]
  • Retrieve project context from DB
  • Load embeddings metadata (optional)
  • Build LLM prompt with metric context
  • Generate response with gpt2-medium
  • Save chat message
  • Return response to user
```

---

## 📞 Support

### Performance Issues?
- Reduce `max_new_tokens` in chatbot.py (currently 120)
- Use GPU: change `device=-1` to `device=0` in chatbot.py
- Cache common responses

### Still Getting Bad Responses?
- Check logs: `python manage.py runserver` (look for errors)
- Verify project has latest analysis with metrics
- Try different `temperature` values (0.5-0.9)

### Need Custom Behavior?
Edit the system prompt in `ImprovedProjectChatbot.chat()`:
```python
system_prompt = """You are an expert..."""
```

---

## 🎯 Next Steps

1. ✅ Deploy changes and migration
2. ✅ Run a full analysis on a project
3. ✅ Wait for Celery to generate embeddings (~1-2 min)
4. ✅ Test chat in GraphQL
5. ✅ Monitor logs for any errors

If everything works, you're done! The chatbot should now provide accurate, context-aware recommendations.

---

**Last Updated:** March 3, 2026
**Version:** 2.0 (Improved with RAG)
