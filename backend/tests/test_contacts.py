def test_create_and_list_contact(client, auth_headers):
    r = client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "Test User", "phone": "+919812345670"})
    assert r.status_code == 201, r.text
    assert r.json()["phone"] == "919812345670"

    r = client.get("/api/v1/contacts", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["total"] == 1


def test_invalid_phone_rejected(client, auth_headers):
    r = client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "Bad", "phone": "123"})
    assert r.status_code == 422


def test_duplicate_phone_conflict(client, auth_headers):
    payload = {"name": "Dup", "phone": "+919812345671"}
    assert client.post("/api/v1/contacts", headers=auth_headers, json=payload).status_code == 201
    assert client.post("/api/v1/contacts", headers=auth_headers, json=payload).status_code == 409


def test_group_and_membership(client, auth_headers):
    g = client.post("/api/v1/groups", headers=auth_headers, json={"name": "VIP"})
    assert g.status_code == 201
    gid = g.json()["id"]
    c = client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "VIP User", "phone": "+919812345672", "group_ids": [gid]})
    assert c.status_code == 201
    assert len(c.json()["groups"]) == 1


def test_import_assigns_new_and_duplicate_contacts_to_group(client, auth_headers):
    g = client.post("/api/v1/groups", headers=auth_headers, json={"name": "Imported"})
    gid = g.json()["id"]

    # Pre-existing contact that the import will also reference (as a duplicate).
    client.post("/api/v1/contacts", headers=auth_headers, json={
        "name": "Already Here", "phone": "+919812345680"})

    csv_content = (
        "name,phone,email\n"
        "Already Here,+919812345680,already@example.com\n"
        "Brand New,+919812345681,new@example.com\n"
    )
    files = {"file": ("contacts.csv", csv_content, "text/csv")}
    r = client.post("/api/v1/contacts/import", headers=auth_headers, files=files, data={"group_id": gid})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["imported"] == 1
    assert body["duplicates"] == 1

    members = client.get("/api/v1/contacts", headers=auth_headers, params={"group_id": gid})
    assert members.json()["total"] == 2  # both the new contact and the pre-existing duplicate
