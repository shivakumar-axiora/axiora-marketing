def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] in ("ok", "degraded")


def test_register_and_login(client):
    r = client.post("/api/v1/auth/register", json={
        "full_name": "Alice", "email": "alice@axiora.com", "password": "Secret123!"})
    assert r.status_code == 201
    # first user becomes admin
    assert r.json()["role"]["name"] == "admin"

    r = client.post("/api/v1/auth/login/json", json={
        "email": "alice@axiora.com", "password": "Secret123!"})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body and "refresh_token" in body


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "full_name": "Bob", "email": "bob@axiora.com", "password": "Secret123!"})
    r = client.post("/api/v1/auth/login/json", json={
        "email": "bob@axiora.com", "password": "wrong"})
    assert r.status_code == 401


def test_refresh_token(client):
    client.post("/api/v1/auth/register", json={
        "full_name": "Cara", "email": "cara@axiora.com", "password": "Secret123!"})
    tokens = client.post("/api/v1/auth/login/json", json={
        "email": "cara@axiora.com", "password": "Secret123!"}).json()
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_protected_requires_auth(client):
    assert client.get("/api/v1/contacts").status_code == 401
