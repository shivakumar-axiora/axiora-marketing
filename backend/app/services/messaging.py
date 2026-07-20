"""Message templating: render {{variables}} for a contact."""
import re

from email_validator import EmailNotValidError, validate_email

from app.models.contact import Contact

VARIABLE_RE = re.compile(r"{{\s*(\w+)\s*}}")


def is_valid_email(raw: str) -> bool:
    if not raw:
        return False
    try:
        validate_email(raw, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False


def contact_context(contact: Contact) -> dict[str, str]:
    return {
        "name": contact.name or "",
        "phone": contact.phone or "",
        "email": contact.email or "",
        "company": contact.company or "",
        "city": contact.city or "",
        "state": contact.state or "",
        "country_code": contact.country_code or "",
    }


def render_message(template: str, context: dict[str, str]) -> str:
    """Replace {{var}} tokens; unknown tokens are left blank."""
    if not template:
        return ""

    def repl(match: re.Match) -> str:
        key = match.group(1).lower()
        return str(context.get(key, ""))

    return VARIABLE_RE.sub(repl, template)


def extract_variables(template: str) -> list[str]:
    return sorted({m.group(1) for m in VARIABLE_RE.finditer(template or "")})
