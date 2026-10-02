# Mentra Langflow Runtime

This branch exists only to host the Langflow runtime for Mentra.

Render build:
- pip install -r langflow-service/requirements.txt

Render start:
- langflow run --host 0.0.0.0 --port $PORT

The application logic remains in the main branch. Langflow is an optional orchestration layer.
