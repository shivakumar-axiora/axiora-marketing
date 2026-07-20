# Installation & Setup Guide

This guide covers both **local development** (no Docker) and **Docker** deployment.

---

## 1. Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 18+ (20 recommended) |
| Docker & Docker Compose | latest (for containerized runs) |
| PostgreSQL | 14+ (production; SQLite used for local dev) |

---

## 2. Local development (SQLite, no Docker)

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # edit if needed

# Generate secure keys and paste them into .env:
python -c "import secrets;print('SECRET_KEY=',secrets.token_urlsafe(48))"
python -c "from cryptography.fernet import Fernet;print('CREDENTIALS_ENCRYPTION_KEY=',Fernet.generate_key().decode())"

python -m app.db.seed         # creates tables, roles, admin + sample data
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Default admin: **admin@axiora.com / Admin@12345**

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

- App: http://localhost:5173 (Vite proxies `/api` → `http://localhost:8000`)

### Run tests

```bash
cd backend
pytest
```

---

## 3. Docker (Postgres + Redis + Celery worker)

```bash
# from the project root
export SECRET_KEY=$(python -c "import secrets;print(secrets.token_urlsafe(48))")
export CREDENTIALS_ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())")

docker compose up --build
```

Services:

| Service | URL |
|---------|-----|
| Frontend (nginx) | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

The backend container seeds the database on first boot. The **worker** container runs
Celery to process campaign sending queues.

---

## 4. Database migrations (Postgres / production)

Local/SQLite auto-creates tables on startup. For Postgres use Alembic:

```bash
cd backend
alembic upgrade head
# after changing models:
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

---

## 5. Connect the WhatsApp Cloud API

1. Create a Meta app at https://developers.facebook.com and add the **WhatsApp** product.
2. From the WhatsApp dashboard collect:
   - **WhatsApp Business Account ID**
   - **Phone Number ID**
   - A **Permanent Access Token** (System User token recommended)
   - **App Secret** (App Settings → Basic)
3. Sign in to Axiora → **Settings** → paste the credentials → **Test Connection**.
4. Under Meta → WhatsApp → **Configuration**, set the webhook:
   - Callback URL: `https://<your-domain>/api/v1/webhooks/whatsapp`
   - Verify Token: the value you entered in Settings
   - Subscribe to the `messages` field for delivery/read receipts.
5. Import contacts (Contacts → Import), create a campaign, and send.

---

## 6. Sample data

- `backend/sample_data/contacts_sample.csv` — import-ready contact file.
- Seed data includes 6 groups, 8 contacts, 3 templates, and 1 completed sample campaign.

---

## 7. Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list with inline docs.

Key security variables to set in production:

- `SECRET_KEY` — JWT signing key
- `CREDENTIALS_ENCRYPTION_KEY` — Fernet key encrypting WhatsApp credentials at rest
- `DATABASE_URL` — Postgres connection string
- `BACKEND_CORS_ORIGINS` — allowed frontend origins

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| `email is not valid … special-use` | Use a real TLD (e.g. `.com`), not `.local`. |
| Templates won't sync | Configure & Test the API connection in Settings first. |
| Messages stuck "pending" | Ensure the Celery worker is running (Docker) or that BackgroundTasks completed (local). |
| Webhook not verifying | The Verify Token in Settings must match the one entered in Meta. |
