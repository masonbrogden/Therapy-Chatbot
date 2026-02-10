# Contributing

## Local setup

### Backend
```bash
python -m venv venv
# Windows PowerShell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python app.py
```

### Frontend
```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

## Workflow
1. Create a feature branch from the default branch.
2. Keep changes focused and include relevant tests/checks.
3. Update docs when behavior, config, or APIs change.
4. Open a PR with a clear summary and verification steps.

## Pull request guidance
- Reference changed files and user-visible impact.
- Include screenshots/GIFs for frontend UI changes.
- Keep commits atomic and messages descriptive.