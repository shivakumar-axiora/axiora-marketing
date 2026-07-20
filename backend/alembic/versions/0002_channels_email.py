"""Add Channel concept + Email (Resend) support.

Revision ID: 0002_channels_email
Revises: 0001_initial
Create Date: 2026-07-15

Adds:
- enums.Channel (whatsapp/email) on campaigns and templates
- new MessageStatus values (bounced/unsubscribed/spam_complaint)
- campaign_recipients: nullable phone, new email/rendered_subject columns,
  wa_message_id renamed to provider_message_id (shared across providers)
- templates: subject/html_body columns (email only)
- new email_settings table (per-user Resend credentials, mirrors `settings`)

Uses batch_alter_table for every altered table so this applies cleanly to
both SQLite (dev) and Postgres (prod) with the same operations.

Note: 0001_initial builds its schema from the *current* SQLAlchemy metadata
(Base.metadata.create_all), not a frozen historical snapshot. That means a
brand-new database migrated from scratch with today's models already gets
these columns/table via 0001, before this migration ever runs. Every
operation below is guarded with an existence check so this migration is a
no-op in that case, while still applying correctly to a real database that
was already migrated to 0001 before these model changes existed.
"""
from alembic import op
import sqlalchemy as sa

from app.models.enums import Channel

revision = "0002_channels_email"
down_revision = "0001_initial"
branch_labels = None
depends_on = None

_NEW_MESSAGE_STATUS_VALUES = ["BOUNCED", "UNSUBSCRIBED", "SPAM_COMPLAINT"]


def _columns(inspector, table_name: str) -> set[str]:
    return {c["name"] for c in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    campaigns_cols = _columns(inspector, "campaigns")
    with op.batch_alter_table("campaigns") as batch_op:
        if "channel" not in campaigns_cols:
            batch_op.add_column(
                sa.Column("channel", sa.Enum(Channel, name="channel"), nullable=False, server_default="WHATSAPP")
            )
        if "subject" not in campaigns_cols:
            batch_op.add_column(sa.Column("subject", sa.String(255), nullable=True, server_default=""))

    recipient_cols = _columns(inspector, "campaign_recipients")
    with op.batch_alter_table("campaign_recipients") as batch_op:
        if "email" not in recipient_cols:
            batch_op.add_column(sa.Column("email", sa.String(255), nullable=True, server_default=""))
        if "rendered_subject" not in recipient_cols:
            batch_op.add_column(sa.Column("rendered_subject", sa.String(255), nullable=True, server_default=""))
        if "phone" in recipient_cols:
            batch_op.alter_column("phone", existing_type=sa.String(30), nullable=True)
        if "wa_message_id" in recipient_cols and "provider_message_id" not in recipient_cols:
            batch_op.alter_column("wa_message_id", new_column_name="provider_message_id", existing_type=sa.String(128))

    template_cols = _columns(inspector, "templates")
    with op.batch_alter_table("templates") as batch_op:
        if "channel" not in template_cols:
            batch_op.add_column(
                sa.Column("channel", sa.Enum(Channel, name="channel"), nullable=False, server_default="WHATSAPP")
            )
        if "subject" not in template_cols:
            batch_op.add_column(sa.Column("subject", sa.String(255), nullable=True, server_default=""))
        if "html_body" not in template_cols:
            batch_op.add_column(sa.Column("html_body", sa.Text(), nullable=True, server_default=""))

    if "email_settings" not in inspector.get_table_names():
        op.create_table(
            "email_settings",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
            sa.Column("resend_api_key_enc", sa.Text(), nullable=True, server_default=""),
            sa.Column("from_email", sa.String(255), nullable=True, server_default=""),
            sa.Column("from_name", sa.String(255), nullable=True, server_default=""),
            sa.Column("is_connected", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("send_rate_per_second", sa.Integer(), nullable=False, server_default="2"),
            sa.Column("batch_size", sa.Integer(), nullable=False, server_default="25"),
        )

    if bind.dialect.name == "postgresql":
        # New native enum values must be added outside the migration's transaction
        # on Postgres < 12 (ALTER TYPE ... ADD VALUE cannot run inside a transaction block).
        with op.get_context().autocommit_block():
            for value in _NEW_MESSAGE_STATUS_VALUES:
                op.execute(f"ALTER TYPE messagestatus ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "email_settings" in inspector.get_table_names():
        op.drop_table("email_settings")

    template_cols = _columns(inspector, "templates")
    with op.batch_alter_table("templates") as batch_op:
        if "html_body" in template_cols:
            batch_op.drop_column("html_body")
        if "subject" in template_cols:
            batch_op.drop_column("subject")
        if "channel" in template_cols:
            batch_op.drop_column("channel")

    recipient_cols = _columns(inspector, "campaign_recipients")
    with op.batch_alter_table("campaign_recipients") as batch_op:
        if "provider_message_id" in recipient_cols:
            batch_op.alter_column("provider_message_id", new_column_name="wa_message_id", existing_type=sa.String(128))
        # Note: not reverting `phone` to NOT NULL — email-channel rows would violate it.
        if "rendered_subject" in recipient_cols:
            batch_op.drop_column("rendered_subject")
        if "email" in recipient_cols:
            batch_op.drop_column("email")

    campaigns_cols = _columns(inspector, "campaigns")
    with op.batch_alter_table("campaigns") as batch_op:
        if "subject" in campaigns_cols:
            batch_op.drop_column("subject")
        if "channel" in campaigns_cols:
            batch_op.drop_column("channel")

    # Native enum VALUEs added to `messagestatus` on Postgres cannot be dropped
    # without recreating the type; left in place on downgrade (harmless, unused).
