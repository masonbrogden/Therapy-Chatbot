# Run Backend (Flask)

This repo does not include `manage.py` (it is not a Django project). The backend is a Flask app in `app.py`.

## Windows PowerShell

```powershell
cd C:\Therapy-Chatbot

# Optional: activate venv if you use one
# .\venv\Scripts\Activate.ps1

# Install deps if needed
pip install -r requirements.txt

# Start the backend on port 8000
python app.py
```

## Health check

Visit:
```
http://127.0.0.1:8000/api/health
```

Expected response:
```
{ "status": "ok", "db": "connected", "rag_available": false }
```
