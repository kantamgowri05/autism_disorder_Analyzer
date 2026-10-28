"""
backend/test_api_iris.py
========================
Regression and integrity tests for /api/iris-tracking endpoint.
1. Asserts HTTP 422 with clear message on empty/missing image requests (no mocks/defaults).
2. Runs pipeline on 3 real dataset face images and asserts:
   - Iris centers fall inside eye-landmark bounds
   - Chin y > mouth y
   - Measurements differ across images (no constant mock output)
   - Measurements returned in mm as approx_mm with 'unvalidated, error unknown'
   - Adult average note included
"""

import base64
import glob
import os
import sys
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)
BASE_DIR = Path(__file__).resolve().parent.parent

def test_empty_request_returns_422():
    """Verify that an empty or missing image returns HTTP 422 with clear message and NO mocks."""
    print("Test 1: Empty payload returns HTTP 422...")
    res = client.post("/api/iris-tracking", json={})
    assert res.status_code == 422, f"Expected 422, got {res.status_code}: {res.text}"
    detail = res.json().get("detail", "")
    assert "No image provided" in detail, f"Expected clear message, got: {detail}"
    assert "facial_morphometrics" not in res.json()
    assert "measurements" not in res.json()

    # None body
    res2 = client.post("/api/iris-tracking")
    assert res2.status_code == 422, f"Expected 422 for None body, got {res2.status_code}"

    # Empty string
    res3 = client.post("/api/iris-tracking", json={"image_base64": ""})
    assert res3.status_code == 422, f"Expected 422 for empty string, got {res3.status_code}"
    print("PASS: HTTP 422 returned on empty/missing image requests. Zero mock leakage.")

def test_real_dataset_images_pipeline():
    """Run pipeline on 3 real face images and verify landmark geometry and distinct outputs."""
    print("Test 2: Real dataset images pipeline...")
    image_pattern = str(BASE_DIR / "datasets" / "facial_images" / "autism-image-dataset" / "test" / "*" / "*.jpg")
    files = glob.glob(image_pattern)[:3]
    assert len(files) >= 3, f"Expected at least 3 test images, found {len(files)}"

    results = []
    for idx, fpath in enumerate(files):
        with open(fpath, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")
        
        res = client.post("/api/iris-tracking", json={"image_base64": b64_data})
        assert res.status_code == 200, f"Image {idx} failed with {res.status_code}: {res.text}"
        data = res.json()
        assert data.get("status") == "success", f"Status not success: {data}"
        assert data.get("face_detected") is True, "Face not detected"
        
        # Check coordinates in key landmarks
        kl = data.get("key_landmarks", {})
        chin_y = kl.get("chin", {}).get("y", 0)
        mouth_y = kl.get("mouth", {}).get("y", 0)
        assert chin_y > mouth_y, f"Image {idx}: chin y ({chin_y}) should be > mouth y ({mouth_y})"
        
        # Check raw landmarks exist and are in original pixels
        raw_lms = data.get("raw_landmarks", [])
        assert len(raw_lms) >= 468, f"Expected 468 landmarks, got {len(raw_lms)}"
        
        # Check eye bounds vs iris centers
        # Left eye (indices 33, 133):
        e0_x1 = min(raw_lms[33]["x"], raw_lms[133]["x"])
        e0_x2 = max(raw_lms[33]["x"], raw_lms[133]["x"])
        lic_x = kl["left_iris_center"]["x"]
        assert e0_x1 <= lic_x <= e0_x2, f"Image {idx}: Left iris center ({lic_x}) not in [{e0_x1}, {e0_x2}]"
        
        # Right eye (indices 362, 263):
        e1_x1 = min(raw_lms[362]["x"], raw_lms[263]["x"])
        e1_x2 = max(raw_lms[362]["x"], raw_lms[263]["x"])
        ric_x = kl["right_iris_center"]["x"]
        assert e1_x1 <= ric_x <= e1_x2, f"Image {idx}: Right iris center ({ric_x}) not in [{e1_x1}, {e1_x2}]"
        
        # Check measurements units and format
        meas = data.get("measurements", {})
        assert "ipd" in meas and meas["ipd"]["unit"] == "mm"
        assert "face_width" in meas and meas["face_width"]["unit"] == "mm"
        assert "face_length" in meas and meas["face_length"]["unit"] == "mm"
        assert "approx_mm" in meas["ipd"]
        assert "approx_mm" in meas["face_width"]
        assert "approx_mm" in meas["face_length"]
        
        # Check uncertainty band
        assert "unvalidated, error unknown" in data.get("uncertainty_band", "")
        
        # Check pediatric note
        assert "adult population average" in data.get("pediatric_note", "")
        
        results.append(data)
        print(f"PASS: Image {idx} validated ({data['image_width']}x{data['image_height']}).")

    # Assert results differ between different images (no constant mock output)
    ipd0 = results[0]["measurements"]["ipd"]["distance_px"]
    ipd1 = results[1]["measurements"]["ipd"]["distance_px"]
    ipd2 = results[2]["measurements"]["ipd"]["distance_px"]
    assert len({ipd0, ipd1, ipd2}) == 3, f"Outputs are constant across images: {[ipd0, ipd1, ipd2]}"

    fw0 = results[0]["measurements"]["face_width"]["distance_px"]
    fw1 = results[1]["measurements"]["face_width"]["distance_px"]
    fw2 = results[2]["measurements"]["face_width"]["distance_px"]
    assert len({fw0, fw1, fw2}) == 3, f"Face widths are constant across images: {[fw0, fw1, fw2]}"
    print("PASS: Verified varying real measurements across all test images.")

if __name__ == "__main__":
    test_empty_request_returns_422()
    test_real_dataset_images_pipeline()
    print("\nALL IRIS API TESTS PASSED SUCCESSFULLY!")
