def _setup(client, auth_headers):
    g = client.post("/api/v1/groups", headers=auth_headers, json={"name": "VIP"}).json()
    client.post("/api/v1/contacts", headers=auth_headers, json={"name": "A", "phone": "+919812345670", "group_ids": [g["id"]]})
    client.post("/api/v1/campaigns", headers=auth_headers, json={"name": "C", "message_body": "Hi {{name}}", "group_ids": [g["id"]]})


def test_dashboard_stats(client, auth_headers):
    _setup(client, auth_headers)
    r = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total_contacts"] == 1
    assert body["total_campaigns"] == 1


def test_dashboard_charts_no_tz_error(client, auth_headers):
    """Regression: naive (SQLite) vs aware datetimes must not raise."""
    _setup(client, auth_headers)
    r = client.get("/api/v1/dashboard/charts", headers=auth_headers)
    assert r.status_code == 200
    assert "daily_messages" in r.json()
    assert "weekly_campaigns" in r.json()


def test_reports_summary(client, auth_headers):
    _setup(client, auth_headers)
    r = client.get("/api/v1/reports/summary", headers=auth_headers)
    assert r.status_code == 200
    assert "totals" in r.json()


def test_campaign_preview_renders_variables(client, auth_headers):
    g = client.post("/api/v1/groups", headers=auth_headers, json={"name": "VIP"}).json()
    client.post("/api/v1/contacts", headers=auth_headers, json={"name": "Aarav", "phone": "+919812345670", "group_ids": [g["id"]]})
    camp = client.post("/api/v1/campaigns", headers=auth_headers, json={"name": "C", "message_body": "Hi {{name}}", "group_ids": [g["id"]]}).json()
    prev = client.get(f"/api/v1/campaigns/{camp['id']}/preview", headers=auth_headers).json()
    assert prev["recipient_count"] == 1
    assert prev["sample_messages"] == ["Hi Aarav"]
