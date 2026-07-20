from app.services.messaging import extract_variables, render_message
from app.services.phone import is_valid_phone, normalize_phone


def test_render_message_variables():
    out = render_message("Hi {{name}} from {{city}}", {"name": "Aarav", "city": "Mumbai"})
    assert out == "Hi Aarav from Mumbai"


def test_render_unknown_variable_blank():
    assert render_message("Hi {{name}} {{unknown}}", {"name": "A"}) == "Hi A "


def test_extract_variables():
    assert extract_variables("{{name}} {{company}} {{name}}") == ["company", "name"]


def test_phone_normalization():
    e164, cc = normalize_phone("+91 98123 45670")
    assert e164 == "919812345670"
    assert cc == "+91"


def test_invalid_phone():
    assert not is_valid_phone("abc")
    assert normalize_phone("123")[0] is None
