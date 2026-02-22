# PowerShell script to start Celery worker for Windows
# Run this in a separate PowerShell terminal alongside the Django development server

Write-Host "🚀 Starting Celery Worker..." -ForegroundColor Green
Write-Host "Make sure Redis is running and the .env file is configured with REDIS_URL" -ForegroundColor Yellow
Write-Host ""

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Cyan
    & ".\venv\Scripts\Activate.ps1"
} elseif (Test-Path "..\venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment from parent directory..." -ForegroundColor Cyan
    & ".\..\venv\Scripts\Activate.ps1"
}

# Navigate to backend only if not already there
if (-not (Test-Path ".\manage.py")) {
    Write-Host "Navigating to backend directory..." -ForegroundColor Cyan
    if (Test-Path ".\backend") {
        Set-Location .\backend
    }
}

# Start Celery worker
Write-Host "Starting Celery worker with concurrency=2 (increase for production)..." -ForegroundColor Cyan
celery -A project_analyser worker -l info -c 2

# If Celery fails, show helpful message
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Celery worker failed to start. Common issues:" -ForegroundColor Red
    Write-Host "   1. Redis not running (install Redis or use Upstash)"
    Write-Host "   2. REDIS_URL not configured in .env"
    Write-Host "   3. Python packages not installed (run: pip install -r requirements.txt)"
    Write-Host ""
    Write-Host "For debugging, run:"
    Write-Host "   python -c 'from django.conf import settings; print(settings.CELERY_BROKER_URL)'"
}
