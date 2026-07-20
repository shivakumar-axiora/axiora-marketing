"""Service-level tests for the email branch of the shared sending engine.

Uses app.db.session.SessionLocal directly (the same session factory
services/sending.py uses internally) rather than the API's overridden
in-memory test session, since run_campaign/_send_one bypass the FastAPI
dependency-injected DB session entirely.
"""
import pytest

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.campaign import Campaign, CampaignRecipient
from app.models.enums import CampaignStatus, Channel, MessageStatus
from app.services import sending
from app.services.resend_client import ResendError


@pytest.fixture(scope="module", autouse=True)
def _ensure_schema():
    Base.metadata.create_all(bind=engine)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _make_email_campaign(db, name):
    campaign = Campaign(
        name=name, channel=Channel.EMAIL, subject="Hi {{name}}",
        message_body="<p>Hello</p>", status=CampaignStatus.RUNNING, owner_id=900001,
    )
    db.add(campaign)
    db.flush()
    recipient = CampaignRecipient(
        campaign_id=campaign.id, contact_id=1, email="you@example.com",
        rendered_subject="Hi there", rendered_message="<p>Hello</p>",
        status=MessageStatus.PENDING,
    )
    db.add(recipient)
    db.commit()
    db.refresh(campaign)
    db.refresh(recipient)
    return campaign, recipient


def _cleanup(db, campaign, recipient):
    db.delete(recipient)
    db.delete(campaign)
    db.commit()


def test_send_one_email_success_marks_sent(db_session):
    campaign, recipient = _make_email_campaign(db_session, "Email success test")

    class FakeResendClient:
        def send_email(self, to, subject, html):
            assert to == "you@example.com"
            assert subject == "Hi there"
            return {"id": "email_xyz"}

    sending._send_one(db_session, campaign, recipient, FakeResendClient())
    db_session.refresh(recipient)
    assert recipient.status == MessageStatus.SENT
    assert recipient.provider_message_id == "email_xyz"
    assert recipient.error_code == ""

    _cleanup(db_session, campaign, recipient)


def test_send_one_email_retryable_error_requeues(db_session):
    campaign, recipient = _make_email_campaign(db_session, "Email retry test")

    class FlakyResendClient:
        def send_email(self, to, subject, html):
            raise ResendError("Too many requests", code="rate_limit_exceeded", status_code=429)

    sending._send_one(db_session, campaign, recipient, FlakyResendClient())
    db_session.refresh(recipient)
    assert recipient.status == MessageStatus.QUEUED
    assert recipient.retries == 1
    assert recipient.error_code == "rate_limit_exceeded"

    _cleanup(db_session, campaign, recipient)


def test_send_one_email_nonretryable_error_fails(db_session):
    campaign, recipient = _make_email_campaign(db_session, "Email fail test")

    class BadResendClient:
        def send_email(self, to, subject, html):
            raise ResendError("Invalid recipient", code="validation_error", status_code=422)

    sending._send_one(db_session, campaign, recipient, BadResendClient())
    db_session.refresh(recipient)
    assert recipient.status == MessageStatus.FAILED
    assert recipient.error_code == "validation_error"

    _cleanup(db_session, campaign, recipient)
