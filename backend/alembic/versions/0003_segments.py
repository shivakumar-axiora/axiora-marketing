"""Add Segment (saved, dynamic contact filter) table.

Revision ID: 0003_segments
Revises: 0002_channels_email
Create Date: 2026-07-15

Adds a `segments` table: saved, named filter criteria resolved dynamically
against the live `contacts` table at read time (not a stored membership
list, unlike `groups`). No changes to any existing table.

Guarded with an existence check like 0002_channels_email.py: 0001_initial
builds from live SQLAlchemy metadata, so a brand-new database migrated from
scratch with today's models already has this table via 0001, before this
migration ever runs.
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_segments"
down_revision = "0002_channels_email"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "segments" not in inspector.get_table_names():
        op.create_table(
            "segments",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("name", sa.String(120), nullable=False),
            sa.Column("description", sa.String(255), nullable=True, server_default=""),
            sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("filters", sa.Text(), nullable=False, server_default="{}"),
            sa.UniqueConstraint("name", "owner_id", name="uq_segment_name_owner"),
        )
        op.create_index("ix_segments_name", "segments", ["name"])
        op.create_index("ix_segments_owner_id", "segments", ["owner_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "segments" in inspector.get_table_names():
        op.drop_table("segments")
