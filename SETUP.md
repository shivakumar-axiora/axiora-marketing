# Setup & Run Guide

How to run **Axiora WhatsApp Marketing** two ways:

- **[Docker](#run-with-docker)** — one command, full stack (Postgres + Redis + Celery worker). Recommended.
- **[Local](#run-locally-no-docker)** — run the backend and frontend directly on your machine (SQLite, no Docker).

Default login for both: **admin@axiora.com / Admin@12345**

> Commands are shown for **PowerShell** (this project's default shell on Windows). macOS/Linux
> equivalents are noted where they differ.

---

## Prerequisites

| Tool | Version | Needed for |
|------|---------|-----------|
| Docker Desktop + Compose | latest | Docker run |
| Python | 3.11+ | Local run |
| Node.js | 18+ (20 recommended) | Local run (frontend) |

---

## Run with Docker

### 1. Create the env files (first time only)

```powershell
Copy-Item backend/.env.example  backend/.env
Copy-Item frontend/.env.example frontend/.env
```

<sub>macOS/Linux: `cp backend/.env.example backend/.env` and `cp frontend/.env.example frontend/.env`</sub>

### 2. (Recommended) Set production secrets

The compose file falls back to insecure defaults. For anything beyond a quick trial, generate real
keys and put them in a `.env` file **next to `docker-compose.yml`** (Compose auto-loads it):

```powershell
# Generate a Fernet key for encrypting WhatsApp credentials at rest
docker compose run --rm backend python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Then create `.env` in the project root:

```
SECRET_KEY=<a long random string>
CREDENTIALS_ENCRYPTION_KEY=<the Fernet key from above>
```

### 3. Build and start everything

```powershell
docker compose up --build
```

Add `-d` to run in the background: `docker compose up --build -d`

This starts **5 services**:

| Service | What it is | Exposed at |
|---------|-----------|-----------|
| `frontend` | React build served by nginx | http://localhost:5173 |
| `backend` | FastAPI API (seeds the DB on first boot) | http://localhost:8000 |
| `worker` | Celery worker (campaign sending) | — internal |
| `db` | PostgreSQL 16 | internal (5432) |
| `redis` | Redis 7 (Celery broker) | internal (6379) |

### 4. Open the app

- **Frontend** → http://localhost:5173
- **API docs (Swagger)** → http://localhost:8000/docs

### Everyday Docker commands

```powershell
docker compose ps                 # status of all services
docker compose logs -f backend    # tail one service's logs
docker compose up -d              # start again (no rebuild)
docker compose up -d --build      # rebuild after changing backend/frontend code
docker compose down               # stop and remove containers
docker compose down -v            # also wipe the DB + media volumes (fresh start)
```

> **Note:** the containers are self-contained — they do **not** use the local Python `.venv`.
> You don't need to activate any virtual environment for the Docker path.

---

## Run locally (no Docker)

Runs on SQLite by default — no Postgres/Redis needed. Campaign sending falls back to FastAPI
BackgroundTasks instead of Celery.

Use **two terminals**: one for the backend, one for the frontend.

### Backend (terminal 1)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # macOS/Linux: source .venv/bin/activate

pip install -r requirements.txt
Copy-Item .env.example .env         # macOS/Linux: cp .env.example .env

# Generate secure keys and paste them into backend/.env:
python -c "import secrets; print(secrets.token_urlsafe(48))"                       # -> SECRET_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"  # -> CREDENTIALS_ENCRYPTION_KEY

python -m app.db.seed               # create tables, roles, admin + sample data
uvicorn app.main:app --reload
```

- API → http://localhost:8000
- API docs → http://localhost:8000/docs

<sub>If PowerShell blocks `Activate.ps1`, run once:
`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`</sub>

### Frontend (terminal 2)

```powershell
cd frontend
npm install
Copy-Item .env.example .env         # macOS/Linux: cp .env.example .env
npm run dev
```

- App → http://localhost:5173 (Vite proxies `/api` → `http://localhost:8000`)

### Run backend tests

```powershell
cd backend
pytest
```

---

## Configure the WhatsApp Cloud API

Credentials are entered in the app, not in config files:

1. Create a Meta app at https://developers.facebook.com and add the **WhatsApp** product.
2. Collect: **WhatsApp Business Account ID**, **Phone Number ID**, a **Permanent Access Token**, and **App Secret**.
3. Sign in to Axiora → **Settings → API** → paste the credentials (stored encrypted) → **Test Connection**.
4. In Meta → WhatsApp → **Configuration**, set the webhook callback URL
   `https://<your-domain>/api/v1/webhooks/whatsapp` with your Verify Token, and subscribe to `messages`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `backend` container exits right after start | Check `docker compose logs backend`. Usually a bad value in `backend/.env` or the root `.env`. |
| Messages stuck "pending" (Docker) | Make sure the `worker` service is running: `docker compose ps`. |
| Messages stuck "pending" (local) | Sending uses BackgroundTasks — keep the uvicorn process running until it completes. |
| `Activate.ps1 cannot be loaded` | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| Port 5173 or 8000 already in use | Stop the other process, or change the host port mapping in `docker-compose.yml`. |
| Templates won't sync | Configure and **Test Connection** in Settings → API first. |

For the full reference (migrations, env var list, sample data), see [docs/INSTALL.md](docs/INSTALL.md).
