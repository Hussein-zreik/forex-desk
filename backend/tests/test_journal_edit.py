"""Journal editing (PATCH) + tag normalization."""


def _auth(client, email):
    res = client.post("/api/auth/register", json={"email": email, "password": "password123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _add(client, headers, **overrides):
    body = {
        "symbol": "XAU=F",
        "direction": "LONG",
        "pnl": 120.5,
        "traded_on": "2026-07-01",
        **overrides,
    }
    res = client.post("/api/journal", json=body, headers=headers)
    assert res.status_code == 201
    return res.json()


def test_patch_edits_fields_partially(client):
    headers = _auth(client, "edit@test.dev")
    entry = _add(client, headers, notes="before")

    res = client.patch(
        f"/api/journal/{entry['id']}",
        json={"pnl": -50, "notes": "after", "direction": "short"},
        headers=headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["pnl"] == -50
    assert body["notes"] == "after"
    assert body["direction"] == "SHORT"
    assert body["symbol"] == "XAU=F"  # untouched fields stay


def test_patch_rejects_bad_direction_and_foreign_entries(client):
    headers_a = _auth(client, "edit-a@test.dev")
    headers_b = _auth(client, "edit-b@test.dev")
    entry = _add(client, headers_a)
    assert (
        client.patch(
            f"/api/journal/{entry['id']}", json={"direction": "SIDEWAYS"}, headers=headers_a
        ).status_code
        == 400
    )
    assert (
        client.patch(
            f"/api/journal/{entry['id']}", json={"pnl": 1}, headers=headers_b
        ).status_code
        == 404
    )


def test_tags_normalized_on_create_and_edit(client):
    headers = _auth(client, "tags@test.dev")
    entry = _add(client, headers, tags=" FOMO, revenge ,fomo, News ")
    assert entry["tags"] == "fomo,revenge,news"

    edited = client.patch(
        f"/api/journal/{entry['id']}", json={"tags": "Breakout,  BREAKOUT , a+ setup"},
        headers=headers,
    ).json()
    assert edited["tags"] == "breakout,a+ setup"

    listed = client.get("/api/journal", headers=headers).json()
    assert listed[0]["tags"] == "breakout,a+ setup"
