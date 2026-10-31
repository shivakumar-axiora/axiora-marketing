"""Add Template.header_type — the WhatsApp header format (TEXT/IMAGE/VIDEO/DOCUMENT)
pulled from Meta on sync, so the app can warn when a template needs a media
header but the campaign has none attached.

Revision ID: 0004_template_header_type
Revises: 0003_segments
Create Date: 2026-07-22

Guarded with an existence check like 0002_channels_email.py: 0001_initial
builds from live SQLAlchemy metadata, so a brand-new database migrated from
scratch with today's models already has this column via 0001, before this
migration ever runs.
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_template_header_type"
down_revision = "0003_segments"
branch_labels = None
depends_on = None


def _columns(inspector, table_name: str) -> set[str]:
    return {c["name"] for c in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    template_cols = _columns(inspector, "templates")
    with op.batch_alter_table("templates") as batch_op:
        if "header_type" not in template_cols:
            batch_op.add_column(sa.Column("header_type", sa.String(20), nullable=True, server_default=""))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    template_cols = _columns(inspector, "templates")
    with op.batch_alter_table("templates") as batch_op:
        if "header_type" in template_cols:
            batch_op.drop_column("header_type")
