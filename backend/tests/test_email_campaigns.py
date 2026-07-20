"""API-level tests for the Email channel (campaign creation, recipient building, settings)."""


def _make_group_with_contacts(client, auth_headers):
    g = client.post("/api/v1/groups", headers=auth_headers, json={"name": "Email List"})
    assert g.status_code == 201
    gid = g.json()["id"]

    valid = client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "Has Email", "phone": "+919812340001", "email": "valid@example.com", "group_ids": [gid]})
    assert valid.status_code == 201

    invalid = client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "No Email", "phone": "+919812340002", "email": "", "group_ids": [gid]})
    assert invalid.status_code == 201

    return gid


def test_create_email_campaign_skips_contacts_without_email(client, auth_headers):
    gid = _make_group_with_contacts(client, auth_headers)

    r = client.post("/api/v1/campaigns", headers=auth_headers, json={
        "name": "Email Blast", "channel": "email", "subject": "Hi {{name}}",
        "message_body": "<p>Hello {{name}}</p>", "group_ids": [gid],
    })
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["channel"] == "email"
    assert data["total_recipients"] == 1  # the contact without an email is skipped

    recipients = client.get(f"/api/v1/campaigns/{data['id']}/recipients", headers=auth_headers).json()
    assert recipients["total"] == 1
    row = recipients["items"][0]
    assert row["email"] == "valid@example.com"
    assert row["phone"] is None
    assert row["rendered_subject"] == "Hi Has Email"


def test_whatsapp_campaign_still_uses_phone(client, auth_headers):
    gid = _make_group_with_contacts(client, auth_headers)

    r = client.post("/api/v1/campaigns", headers=auth_headers, json={
        "name": "WA Blast", "channel": "whatsapp", "message_body": "Hi {{name}}", "group_ids": [gid],
    })
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["channel"] == "whatsapp"
    assert data["total_recipients"] == 2  # both contacts have phones, regardless of email

    recipients = client.get(f"/api/v1/campaigns/{data['id']}/recipients", headers=auth_headers).json()
    phones = {row["phone"] for row in recipients["items"]}
    assert phones == {"919812340001", "919812340002"}


def test_cannot_change_campaign_channel_after_creation(client, auth_headers):
    gid = _make_group_with_contacts(client, auth_headers)
    r = client.post("/api/v1/campaigns", headers=auth_headers, json={
        "name": "Locked Channel", "channel": "whatsapp", "message_body": "Hi", "group_ids": [gid],
    })
    campaign_id = r.json()["id"]

    r2 = client.put(f"/api/v1/campaigns/{campaign_id}", headers=auth_headers, json={"channel": "email"})
    assert r2.status_code == 400


def test_email_settings_masked_round_trip(client, auth_headers):
    r = client.get("/api/v1/settings/email", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["is_connected"] is False

    r2 = client.put("/api/v1/settings/email", headers=auth_headers, json={
        "resend_api_key": "re_super_secret_key", "from_email": "campaigns@axiora.dev", "from_name": "Axiora",
    })
    assert r2.status_code == 200
    body = r2.json()
    assert body["from_email"] == "campaigns@axiora.dev"
    assert body["resend_api_key_masked"].endswith("_key")
    assert "re_super_secret_key" not in body["resend_api_key_masked"]
