"""Optional Celery app. Used only when USE_CELERY=true; otherwise the sending
engine runs through FastAPI BackgroundTasks."""
from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "axiora",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)
celery_app.conf.task_default_queue = "campaigns"


@celery_app.task(name="run_campaign")
def run_campaign_task(campaign_id: int) -> None:
    from app.services.sending import run_campaign

    run_campaign(campaign_id)


def dispatch_campaign(campaign_id: int) -> None:
    """Send a campaign either via Celery or inline background execution."""
    if settings.USE_CELERY:
        run_campaign_task.delay(campaign_id)
    else:  # pragma: no cover
        from app.services.sending import run_campaign

        run_campaign(campaign_id)
