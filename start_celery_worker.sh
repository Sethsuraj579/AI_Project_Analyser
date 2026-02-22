#!/bin/bash
# Start Celery worker for background tasks
# Run this in a separate terminal alongside the Django development server

echo "🚀 Starting Celery Worker..."
echo "Make sure Redis is running and the .env file is configured with REDIS_URL"
echo ""

# Check if using Windows/PowerShell
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # For Windows/PowerShell
    echo "Windows detected. Running Celery worker..."
else
    # For Unix/Linux/Mac
    echo "Unix-based system detected. Activating venv..."
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

cd backend

# Start Celery worker
echo "Starting worker with concurrency=2 (set higher for production)..."
celery -A project_analyser worker -l info -c 2
