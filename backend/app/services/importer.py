"""CSV / Excel contact import & export utilities."""
from __future__ import annotations

import csv
import io
from typing import Iterable

import pandas as pd

from app.services.phone import normalize_phone

COLUMNS = ["name", "phone", "email", "company", "city", "state", "tags", "notes"]


def parse_contacts_file(content: bytes, filename: str) -> list[dict]:
    """Parse an uploaded CSV/XLSX into a list of raw row dicts."""
    name = filename.lower()
    # dtype=str prevents pandas from inferring phone-like columns (e.g. "+919812345680")
    # as numeric, which silently strips the leading "+" and corrupts the number.
    if name.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(content), dtype=str)
    else:
        df = pd.read_csv(io.BytesIO(content), dtype=str)
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    records = df.fillna("").to_dict(orient="records")
    return [{k: str(v).strip() for k, v in row.items()} for row in records]


def normalize_rows(rows: Iterable[dict], default_region: str = "US") -> tuple[list[dict], int]:
    """Validate & normalize phone numbers. Returns (valid_rows, invalid_count)."""
    valid: list[dict] = []
    invalid = 0
    for row in rows:
        raw_phone = row.get("phone") or row.get("phone_number") or row.get("mobile") or ""
        e164, cc = normalize_phone(raw_phone, default_region)
        if not e164:
            invalid += 1
            continue
        valid.append(
            {
                "name": row.get("name") or row.get("full_name") or "Unknown",
                "phone": e164,
                "country_code": cc or "",
                "email": row.get("email", ""),
                "company": row.get("company", ""),
                "city": row.get("city", ""),
                "state": row.get("state", ""),
                "tags": row.get("tags", ""),
                "notes": row.get("notes", ""),
            }
        )
    return valid, invalid


def contacts_to_csv(contacts) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["name", "phone", "country_code", "email", "company", "city", "state", "tags", "status"])
    for c in contacts:
        writer.writerow([c.name, c.phone, c.country_code, c.email, c.company, c.city, c.state, c.tags,
                          c.status.value if hasattr(c.status, "value") else c.status])
    return buf.getvalue().encode()


def contacts_to_excel(contacts) -> bytes:
    df = pd.DataFrame(
        [
            {
                "name": c.name,
                "phone": c.phone,
                "country_code": c.country_code,
                "email": c.email,
                "company": c.company,
                "city": c.city,
                "state": c.state,
                "tags": c.tags,
                "status": c.status.value if hasattr(c.status, "value") else c.status,
            }
            for c in contacts
        ]
    )
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Contacts")
    return buf.getvalue()
