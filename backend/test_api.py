"""
backend/test_api.py
===================
API endpoint test for /api/screen using FastAPI TestClient.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_screen_lower():
    payload = {"cohort": "adult", "answers": {f"A{i}_Score": 0 for i in range(1, 11)}}
    res = client.post("/api/screen", json=payload)
    assert res.status_code == 200, f"Error: {res.text}"
    data = res.json()
    assert data["state"] == "Lower Likelihood"
    assert data["is_abstention"] is False

def test_screen_higher():
    payload = {"cohort": "adult", "answers": {f"A{i}_Score": 1 for i in range(1, 11)}}
    res = client.post("/api/screen", json=payload)
    assert res.status_code == 200, f"Error: {res.text}"
    data = res.json()
    assert data["state"] == "Higher Likelihood"
    assert data["is_abstention"] is False

def test_screen_borderline():
    payload = {"cohort": "adult", "answers": {f"A{i}_Score": (1 if i in [1, 2, 5, 8] else 0) for i in range(1, 11)}}
    res = client.post("/api/screen", json=payload)
    assert res.status_code == 200, f"Error: {res.text}"
    data = res.json()
    assert "state" in data
    assert "prediction_set" in data and "is_abstention" in data

if __name__ == "__main__":
    test_screen_lower()
    test_screen_higher()
    test_screen_borderline()
    print("ALL /api/screen TESTS PASSED!")
