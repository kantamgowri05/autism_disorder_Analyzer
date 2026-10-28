import os
import sys
import json
import joblib
from pathlib import Path
import numpy as np
import pandas as pd
import tensorflow as tf

sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path("D:/projects/asd-decision-client")
MODELS_DIR = BASE_DIR / "models"

class NeuroScreenMultimodalPipeline:
    def __init__(self):
        # Load screening models for each cohort
        self.tabular_models = {
            "adult": joblib.load(MODELS_DIR / "asd_screening_model_adult.joblib"),
            "children": joblib.load(MODELS_DIR / "asd_screening_model_children.joblib"),
            "adolescent": joblib.load(MODELS_DIR / "asd_screening_model_adolescent.joblib"),
            "toddler": joblib.load(MODELS_DIR / "asd_screening_model_toddler.joblib"),
            "combined": joblib.load(MODELS_DIR / "asd_screening_model_combined_multi_age.joblib")
        }
        # Load vision model
        vision_path = MODELS_DIR / "facial_mobilenet_model.keras"
        self.vision_model = tf.keras.models.load_model(str(vision_path))
        print("✓ Loaded all 5 tabular screening ensembles + MobileNetV2 vision model.")

    def predict_screening(self, answers_dict, cohort="combined"):
        model = self.tabular_models.get(cohort, self.tabular_models["combined"])
        df_input = pd.DataFrame([answers_dict])
        prob = model.predict_proba(df_input)[0, 1]
        pred = int(prob >= 0.5)
        return float(prob), pred

    def predict_image(self, img_path):
        img = tf.keras.utils.load_img(img_path, target_size=(160, 160))
        img_array = tf.keras.utils.img_to_array(img)
        img_array = tf.expand_dims(img_array, 0)
        prob = float(self.vision_model.predict(img_array, verbose=0)[0][0])
        pred = int(prob >= 0.5)
        return prob, pred

    def fuse_decision(self, p_tabular=None, p_vision=None):
        if p_tabular is not None and p_vision is not None:
            # Calibrated late-fusion weighting (65% questionnaire, 35% facial vision)
            fused_p = 0.65 * p_tabular + 0.35 * p_vision
            mode = "Dual-Stream Multimodal Fusion (Questionnaire + Facial Vision)"
        elif p_tabular is not None:
            fused_p = p_tabular
            mode = "Tabular Screening Stream Only (Clinical Questionnaire)"
        elif p_vision is not None:
            fused_p = p_vision
            mode = "Vision Stream Only (Facial Analysis)"
        else:
            raise ValueError("At least one modality must be provided.")

        risk_level = "High Risk (Clinical Follow-up Recommended)" if fused_p >= 0.65 else \
                     "Moderate Risk (Monitoring Recommended)" if fused_p >= 0.40 else \
                     "Low Risk (Typical Development)"

        return {
            "mode": mode,
            "fused_probability": round(fused_p, 4),
            "risk_level": risk_level,
            "p_tabular": round(p_tabular, 4) if p_tabular is not None else None,
            "p_vision": round(p_vision, 4) if p_vision is not None else None
        }

if __name__ == "__main__":
    pipeline = NeuroScreenMultimodalPipeline()

    # Demo 1: Multi-age questionnaire input
    sample_q = {
        "A1": 1, "A2": 1, "A3": 1, "A4": 1, "A5": 1,
        "A6": 1, "A7": 1, "A8": 0, "A9": 1, "A10": 0,
        "Age": 24, "Sex": "m", "Jauundice": "no", "Family_ASD": "yes"
    }
    p_tab, pred_tab = pipeline.predict_screening(sample_q, cohort="combined")
    print(f"\n[Sample Screening Test] P(ASD) = {p_tab*100:.2f}%, Decision = {'ASD Traits' if pred_tab else 'No ASD Traits'}")

    # Demo 2: Sample Image test from test split
    test_img = BASE_DIR / "data" / "raw" / "facial_images" / "autism-image-dataset" / "test" / "autistic" / "001.jpg"
    if test_img.exists():
        p_vis, pred_vis = pipeline.predict_image(str(test_img))
        print(f"[Sample Vision Test] P(ASD) = {p_vis*100:.2f}%, Decision = {'Autistic Traits' if pred_vis else 'Non-Autistic'}")
        
        # Multimodal fusion
        fusion = pipeline.fuse_decision(p_tabular=p_tab, p_vision=p_vis)
        print("\n--- MULTIMODAL FUSION RESULT ---")
        print(json.dumps(fusion, indent=2))
