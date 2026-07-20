"""Initial schema — created from SQLAlchemy metadata.

Revision ID: 0001_initial
Revises:
Create Date: 2026-01-01

Note: For local/SQLite development tables are auto-created on startup. This migration
is provided for Postgres/production. Regenerate with:
    alembic revision --autogenerate -m "message"
"""
from alembic import op

import app.models  # noqa: F401
from app.db.base import Base

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
