"""Vercel Python entrypoint. Vercel's Python builder discovers the ASGI `app`
object in this module and serves it; the actual application lives in app.main."""
from app.main import app  # noqa: F401
