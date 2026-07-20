"""Tests for dynamic Segments and the shared audience-resolution service."""


def _make_contacts(client, auth_headers):
    """3 contacts: 2 active in Mumbai (one tagged vip), 1 unsubscribed in Mumbai."""
    a = client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "Active Mumbai VIP", "phone": "+919812350001", "city": "Mumbai", "tags": "vip"})
    b = client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "Active Mumbai", "phone": "+919812350002", "city": "Mumbai"})
    c = client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "Unsubscribed Mumbai VIP", "phone": "+919812350003", "city": "Mumbai", "tags": "vip",
        "status": "unsubscribed"})
    assert a.status_code == c.status_code == b.status_code == 201
    return a.json(), b.json(), c.json()


def test_segment_matching_count_excludes_unsubscribed(client, auth_headers):
    _make_contacts(client, auth_headers)

    r = client.post("/api/v1/segments", headers=auth_headers, json={
        "name": "Mumbai VIPs", "filters": {"city": "Mumbai", "tag": "vip"},
    })
    assert r.status_code == 201, r.text
    body = r.json()
    # Only the active VIP in Mumbai counts — the unsubscribed VIP is excluded.
    assert body["matching_count"] == 1


def test_segment_preview_returns_sample(client, auth_headers):
    _make_contacts(client, auth_headers)
    r = client.post("/api/v1/segments", headers=auth_headers, json={
        "name": "All Mumbai", "filters": {"city": "Mumbai"},
    })
    seg_id = r.json()["id"]

    preview = client.get(f"/api/v1/segments/{seg_id}/preview", headers=auth_headers)
    assert preview.status_code == 200
    data = preview.json()
    assert data["count"] == 2  # active ones only
    assert len(data["sample"]) == 2


def test_duplicate_segment_name_rejected(client, auth_headers):
    payload = {"name": "Repeat", "filters": {"city": "Mumbai"}}
    assert client.post("/api/v1/segments", headers=auth_headers, json=payload).status_code == 201
    assert client.post("/api/v1/segments", headers=auth_headers, json=payload).status_code == 400


def test_audience_count_endpoint_all_contacts_excludes_unsubscribed(client, auth_headers):
    _make_contacts(client, auth_headers)
    r = client.post("/api/v1/contacts/audience-count", headers=auth_headers, json={"all_contacts": True})
    assert r.status_code == 200
    assert r.json()["count"] == 2


def test_audience_count_endpoint_union_of_segment_and_contact(client, auth_headers):
    a, b, _ = _make_contacts(client, auth_headers)
    r = client.post("/api/v1/segments", headers=auth_headers, json={
        "name": "VIPs only", "filters": {"tag": "vip"},
    })
    seg_id = r.json()["id"]
    # Segment matches only contact `a` (the active VIP); union with contact `b` should give 2.
    count = client.post("/api/v1/contacts/audience-count", headers=auth_headers, json={
        "segment_ids": [seg_id], "contact_ids": [b["id"]],
    })
    assert count.json()["count"] == 2


def test_campaign_creation_with_segment_ids(client, auth_headers):
    _make_contacts(client, auth_headers)
    seg = client.post("/api/v1/segments", headers=auth_headers, json={
        "name": "Mumbai segment", "filters": {"city": "Mumbai"},
    }).json()

    r = client.post("/api/v1/campaigns", headers=auth_headers, json={
        "name": "Segment campaign", "channel": "whatsapp", "message_body": "Hi {{name}}",
        "segment_ids": [seg["id"]],
    })
    assert r.status_code == 201, r.text
    assert r.json()["total_recipients"] == 2  # unsubscribed contact excluded


def test_campaign_creation_with_all_contacts(client, auth_headers):
    _make_contacts(client, auth_headers)
    r = client.post("/api/v1/campaigns", headers=auth_headers, json={
        "name": "Broadcast", "channel": "whatsapp", "message_body": "Hi {{name}}", "all_contacts": True,
    })
    assert r.status_code == 201, r.text
    assert r.json()["total_recipients"] == 2


def test_contacts_list_supports_company_and_group_ids_filters(client, auth_headers):
    g = client.post("/api/v1/groups", headers=auth_headers, json={"name": "Acme Group"})
    gid = g.json()["id"]
    client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "Acme Person", "phone": "+919812350010", "company": "Acme Corp", "group_ids": [gid]})
    client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "Other Person", "phone": "+919812350011", "company": "Other Inc"})

    by_company = client.get("/api/v1/contacts", headers=auth_headers, params={"company": "Acme"})
    assert by_company.json()["total"] == 1

    by_group_ids = client.get("/api/v1/contacts", headers=auth_headers, params={"group_ids": [gid]})
    assert by_group_ids.json()["total"] == 1
