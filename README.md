# Axiora WhatsApp Marketing

A production-ready WhatsApp marketing platform for sending template & marketing messages to
thousands of customers through the **official WhatsApp Business Platform (Cloud API)**.

> No browser automation, no WhatsApp Web scraping, no unofficial APIs. Only the official
> Meta Cloud API is used for message delivery.

<p align="center">
  <b>FastAPI · SQLAlchemy · PostgreSQL · Celery/BackgroundTasks · React · Tailwind · Framer Motion · Docker</b>
</p>

---

## ✨ Features

| Area | Highlights |
|------|-----------|
| **Auth** | Register, Login, JWT + refresh tokens, email verification, forgot/reset password, logout |
| **RBAC** | `Admin`, `Marketing Manager`, `Executive` roles with permission enforcement |
| **Dashboard** | Live stats, delivery/success rates, charts, recent campaigns & activity |
| **Contacts** | CRUD, search, filter, CSV/Excel import & export, duplicate detection, bulk ops, phone validation |
| **Groups** | Many-to-many groups (Customers, VIP, Leads, Dealers…) |
| **Campaigns** | Draft → Scheduled → Running → Completed lifecycle, clone, pause/resume, cancel, archive |
| **Composer** | Variables (`{{name}}`, `{{company}}`…), formatting, live preview |
| **Templates** | Sync from Meta, create/edit, categories & languages, favorites |
| **Media** | Upload images/video/docs/audio, folders, rename, preview |
| **Sending Engine** | Queue-based batch sending, retries, rate-limit aware, live progress |
| **Webhooks** | Delivery/read status tracking via Meta webhooks |
| **Reports** | Delivery/success metrics, CSV/Excel/PDF export, charts |
| **Settings** | Encrypted WhatsApp API credentials, test connection |
| **Security** | Bcrypt hashing, encrypted credentials (Fernet), rate limiting, audit/activity logs |

## 🏗 Architecture

```
axiora-marketing/
├── backend/          FastAPI + SQLAlchemy + Celery
│   ├── app/
│   │   ├── api/          route controllers (v1)
│   │   ├── core/         config, security, celery
│   │   ├── db/           session, base, seed
│   │   ├── models/       SQLAlchemy models
│   │   ├── schemas/      Pydantic schemas
│   │   ├── services/     WhatsApp API, sending engine, crypto, importers
│   │   └── main.py
│   ├── alembic/          migrations
│   ├── tests/            pytest
│   └── Dockerfile
├── frontend/         React + Vite + Tailwind + Framer Motion
│   ├── src/
│   │   ├── components/   reusable UI
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/     axios API clients
│   │   └── context/
│   └── Dockerfile
├── docker-compose.yml
└── docs/
```

## 🚀 Quick Start (Docker — recommended)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend API docs → http://localhost:8000/docs

Default seeded admin: **admin@axiora.com / Admin@12345**

## 🧑‍💻 Local development

See [docs/INSTALL.md](docs/INSTALL.md) for step-by-step local setup (SQLite by default, no Docker required).

```bash
# Backend
cd backend
python -m venv .venv && . .venv/Scripts/activate   # Windows
pip install -r requirements.txt
python -m app.db.seed          # seed roles + admin + sample data
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## 🔐 Configuring WhatsApp Cloud API

1. Create a Meta App → add **WhatsApp** product.
2. Grab: WhatsApp Business Account ID, Phone Number ID, a Permanent Access Token, App Secret.
3. In the app → **Settings → API**, paste the credentials (stored encrypted) and **Test Connection**.
4. Configure the webhook callback URL `https://<your-domain>/api/v1/webhooks/whatsapp` with your Verify Token.

## 🧪 Tests

```bash
cd backend
pytest
```

## 📦 Extensibility

The codebase is modular and ready for CRM integration, AI campaign optimization, multi-tenancy,
analytics, and additional channels (SMS/Email). Services are decoupled behind interfaces and the
storage layer can be swapped from local disk to S3 by implementing `services/storage.py`.

## License

Proprietary © Axiora Global Solutions.
