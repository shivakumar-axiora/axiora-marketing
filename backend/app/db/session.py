"""Database engine and session factory."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

# On serverless (Vercel), each invocation is a fresh process, so a pooled engine
# just accumulates stale connections the DB server eventually kills. NullPool
# opens/closes a connection per request instead; pair with a poolable
# DATABASE_URL (e.g. Neon's/Supabase's pgbouncer connection string).
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    poolclass=NullPool if settings.DATABASE_SERVERLESS else None,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
