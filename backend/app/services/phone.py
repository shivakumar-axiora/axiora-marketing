"""Phone number validation & normalization using the phonenumbers library."""
from typing import Optional, Tuple

import phonenumbers


def normalize_phone(raw: str, default_region: str = "US") -> Tuple[Optional[str], Optional[str]]:
    """Return (e164_without_plus, country_code) or (None, None) if invalid."""
    if not raw:
        return None, None
    raw = raw.strip()
    try:
        parsed = phonenumbers.parse(raw, None if raw.startswith("+") else default_region)
    except phonenumbers.NumberParseException:
        return None, None
    if not phonenumbers.is_valid_number(parsed):
        return None, None
    e164 = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    return e164.lstrip("+"), f"+{parsed.country_code}"


def is_valid_phone(raw: str, default_region: str = "US") -> bool:
    e164, _ = normalize_phone(raw, default_region)
    return e164 is not None
