"""Minimal email helper.

In development (no SMTP_HOST configured) emails are logged to the console so that
verification / reset links can be copied during local testing.
"""
import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger("axiora.email")


def send_email(to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        logger.warning("[DEV EMAIL] To: %s | Subject: %s\n%s", to, subject, body)
        return
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = settings.EMAILS_FROM_EMAIL
    msg["To"] = to
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAILS_FROM_EMAIL, [to], msg.as_string())


def send_verification_email(to: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_email(
        to,
        "Verify your Axiora account",
        f"<p>Welcome to Axiora WhatsApp Marketing!</p>"
        f'<p>Verify your email: <a href="{link}">{link}</a></p>',
    )


def send_reset_email(to: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_email(
        to,
        "Reset your Axiora password",
        f'<p>Reset your password: <a href="{link}">{link}</a></p>'
        f"<p>This link expires in 60 minutes.</p>",
    )
