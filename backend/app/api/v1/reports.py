"""Reports: aggregate metrics + CSV/Excel/PDF export."""
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.campaign import Campaign, CampaignRecipient
from app.models.enums import MessageStatus
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])


def _campaign_metrics(db: Session, campaign: Campaign) -> dict:
    rows = db.execute(
        select(CampaignRecipient.status, func.count())
        .where(CampaignRecipient.campaign_id == campaign.id)
        .group_by(CampaignRecipient.status)
    ).all()
    counts = {status.value if hasattr(status, "value") else status: n for status, n in rows}
    sent = counts.get("sent", 0) + counts.get("delivered", 0) + counts.get("read", 0)
    delivered = counts.get("delivered", 0) + counts.get("read", 0)
    failed = counts.get("failed", 0)
    pending = counts.get("pending", 0) + counts.get("queued", 0)
    total = campaign.total_recipients or (sent + failed + pending)
    return {
        "campaign_id": campaign.id,
        "campaign": campaign.name,
        "status": campaign.status.value,
        "total": total,
        "sent": sent,
        "delivered": delivered,
        "read": counts.get("read", 0),
        "failed": failed,
        "pending": pending,
        "delivery_pct": round((delivered / sent) * 100, 1) if sent else 0.0,
        "success_pct": round((sent / (sent + failed)) * 100, 1) if (sent + failed) else 0.0,
    }


@router.get("/summary")
def reports_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaigns = db.execute(select(Campaign).where(Campaign.owner_id == user.id)).scalars().all()
    metrics = [_campaign_metrics(db, c) for c in campaigns]
    totals = {
        "total": sum(m["total"] for m in metrics),
        "sent": sum(m["sent"] for m in metrics),
        "delivered": sum(m["delivered"] for m in metrics),
        "read": sum(m["read"] for m in metrics),
        "failed": sum(m["failed"] for m in metrics),
        "pending": sum(m["pending"] for m in metrics),
    }
    totals["delivery_pct"] = round((totals["delivered"] / totals["sent"]) * 100, 1) if totals["sent"] else 0.0
    totals["success_pct"] = round(
        (totals["sent"] / (totals["sent"] + totals["failed"])) * 100, 1
    ) if (totals["sent"] + totals["failed"]) else 0.0
    return {"totals": totals, "campaigns": metrics}


@router.get("/failure-reasons")
def failure_reasons(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(
        select(CampaignRecipient.error_message, func.count())
        .join(Campaign)
        .where(Campaign.owner_id == user.id, CampaignRecipient.status == MessageStatus.FAILED)
        .group_by(CampaignRecipient.error_message)
    ).all()
    return [{"reason": (msg or "Unknown"), "count": n} for msg, n in rows]


@router.get("/export")
def export_report(
    format: str = Query("csv", pattern="^(csv|excel|pdf)$"),
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    data = reports_summary(db, user)
    rows = data["campaigns"]

    if format == "pdf":
        content = _pdf(rows, data["totals"])
        return StreamingResponse(io.BytesIO(content), media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=report.pdf"})

    import pandas as pd
    df = pd.DataFrame(rows)
    if format == "excel":
        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Report")
        return StreamingResponse(
            io.BytesIO(buf.getvalue()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=report.xlsx"})
    csv_bytes = df.to_csv(index=False).encode()
    return StreamingResponse(io.BytesIO(csv_bytes), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=report.csv"})


def _pdf(rows: list[dict], totals: dict) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import (Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [Paragraph("Axiora WhatsApp Marketing — Campaign Report", styles["Title"]), Spacer(1, 12)]
    elements.append(Paragraph(
        f"Total: {totals['total']} · Sent: {totals['sent']} · Delivered: {totals['delivered']} · "
        f"Failed: {totals['failed']} · Delivery: {totals['delivery_pct']}%", styles["Normal"]))
    elements.append(Spacer(1, 12))
    header = ["Campaign", "Status", "Total", "Sent", "Delivered", "Failed", "Delivery %"]
    table_data = [header] + [
        [r["campaign"], r["status"], r["total"], r["sent"], r["delivered"], r["failed"], r["delivery_pct"]]
        for r in rows
    ]
    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#25D366")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F4F6")]),
    ]))
    elements.append(table)
    doc.build(elements)
    return buf.getvalue()
