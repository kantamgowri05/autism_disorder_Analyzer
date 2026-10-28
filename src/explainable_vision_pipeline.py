import sys
import os
import cv2
import json
import numpy as np
from pathlib import Path
import tensorflow as tf

sys.stdout.reconfigure(encoding="utf-8")

from yolo_face_detector import YOLOFaceDetector
from gradcam_explainer import GradCAMExplainer

BASE_DIR = Path("D:/projects/asd-decision-client")
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "docs" / "visual_reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

class ExplainableVisionPipeline:
    def __init__(self):
        print("Initializing Two-Stage YOLO + Grad-CAM Vision Pipeline...")
        self.detector = YOLOFaceDetector(conf_thresh=0.4)
        self.explainer = GradCAMExplainer()
        print("Pipeline initialized.")

    def analyze(self, raw_image_path, save_overlay=True):
        raw_path = Path(raw_image_path)
        # Stage 1: YOLO Face Detection
        cropped_bgr, bbox, was_cropped = self.detector.detect_and_crop(raw_path)

        # Stage 2: Preprocess for CNN
        img_rgb = cv2.cvtColor(cropped_bgr, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(img_rgb, (160, 160))
        img_array = np.expand_dims(resized.astype(np.float32), axis=0)

        # Stage 3: CNN Prediction & Grad-CAM Heatmap
        heatmap, pred_prob = self.explainer.generate_heatmap(img_array)
        is_asd = bool(pred_prob >= 0.5)

        overlay_file = None
        if save_overlay:
            overlay_bgr = self.explainer.overlay_heatmap(cropped_bgr, heatmap, alpha=0.45)
            # Add clinical text overlay
            status_text = f"ASD Risk: {pred_prob*100:.1f}% ({'High Traits' if is_asd else 'Low Traits'})"
            color = (0, 0, 255) if is_asd else (0, 255, 0)
            cv2.putText(overlay_bgr, status_text, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            out_filename = f"xai_{raw_path.stem}.jpg"
            overlay_file = REPORTS_DIR / out_filename
            cv2.imwrite(str(overlay_file), overlay_bgr)

        return {
            "input_file": raw_path.name,
            "yolo_bbox": bbox,
            "was_cropped_by_yolo": was_cropped,
            "asd_probability": round(float(pred_prob), 4),
            "prediction": "Autistic Traits" if is_asd else "Non-Autistic",
            "gradcam_overlay_saved": str(overlay_file) if overlay_file else None
        }

if __name__ == "__main__":
    pipeline = ExplainableVisionPipeline()
    test_img = BASE_DIR / "data" / "raw" / "facial_images" / "autism-image-dataset" / "test" / "autistic" / "001.jpg"
    if test_img.exists():
        result = pipeline.analyze(test_img)
        print("\n=== TWO-STAGE YOLO + GRAD-CAM RESULT ===")
        print(json.dumps(result, indent=2))
