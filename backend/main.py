import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
import base64
import io
from PIL import Image
import joblib
import pandas as pd
import numpy as np

# Ensure backend directory and face-detection-tflite are in sys.path
_CURRENT_DIR = Path(__file__).resolve().parent
_ROOT_DIR = _CURRENT_DIR.parent
if str(_CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(_CURRENT_DIR))
if str(_ROOT_DIR / "face-detection-tflite") not in sys.path:
    sys.path.insert(0, str(_ROOT_DIR / "face-detection-tflite"))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = _ROOT_DIR
MODELS_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "results"
DATA_DIR = BASE_DIR / "data"

PRESET_CACHE = {}
_cache_file = BASE_DIR / "backend" / "preset_biometrics_cache.json"
if _cache_file.exists():
    try:
        with open(_cache_file, "r", encoding="utf-8") as f:
            PRESET_CACHE = json.load(f)
    except Exception as e:
        print(f"Could not load preset biometrics cache: {e}")

from iris_scale import analyze_image_iris_scale
from conformal import ConformalPredictor
from adaptive_screener import select_next_question, compute_posterior
from explainer import template_explain, TabularExplainer

app = FastAPI(
    title="NeuroScreen AI Backend",
    description="Statistically Honest Decision-Support Screener for Autism Spectrum Assessment",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conformal predictor instance (calibrated at alpha=0.10)
conformal_engine = ConformalPredictor(q_threshold=0.35)

# Load Models
cohort_models = {}
for cohort in ["adult", "children", "adolescent", "toddler", "combined_multi_age"]:
    model_file = MODELS_DIR / f"asd_screening_model_{cohort}.joblib"
    if model_file.exists():
        try:
            cohort_models[cohort] = joblib.load(model_file)
        except Exception as e:
            print(f"Failed to load {cohort}: {e}")

rapid_models = {}
for cohort in ["adult", "children", "adolescent", "toddler"]:
    rapid_file = MODELS_DIR / f"asd_screening_model_rapid5_{cohort}.joblib"
    if rapid_file.exists():
        try:
            rapid_models[cohort] = joblib.load(rapid_file)
        except Exception as e:
            print(f"Failed to load rapid {cohort}: {e}")

RAPID_FEATURES = {
    "toddler": ["A7", "A9", "A5", "A6", "A1"],
    "children": ["A4_Score", "A9_Score", "A8_Score", "A10_Score", "A1_Score"],
    "adolescent": ["A5_Score", "A10_Score", "A4_Score", "A3_Score", "A6_Score"],
    "adult": ["A9_Score", "A6_Score", "A5_Score", "A4_Score", "A3_Score"]
}

# Empirical training item marginals for Bayesian adaptive screener
ITEM_MARGINALS = {
    "toddler": [0.65, 0.58, 0.52, 0.49, 0.55, 0.51, 0.57, 0.45, 0.53, 0.48],
    "children": [0.44, 0.48, 0.51, 0.52, 0.49, 0.47, 0.45, 0.53, 0.46, 0.50],
    "adolescent": [0.48, 0.45, 0.52, 0.50, 0.55, 0.49, 0.46, 0.51, 0.47, 0.53],
    "adult": [0.42, 0.47, 0.49, 0.51, 0.48, 0.45, 0.43, 0.50, 0.44, 0.48]
}

CUTOFFS = {
    "toddler": 4,
    "children": 7,
    "adolescent": 7,
    "adult": 7
}

COHORT_QUESTIONS = {
    "toddler": [
        {"id": "A1", "text": "Does your child look at you when you call his/her name?", "reversed": True},
        {"id": "A2", "text": "How easy is it for you to get eye contact with your child?", "reversed": True},
        {"id": "A3", "text": "Does your child point to indicate that he/she wants something?", "reversed": True},
        {"id": "A4", "text": "Does your child point to share interest with you?", "reversed": True},
        {"id": "A5", "text": "Does your child pretend?", "reversed": True},
        {"id": "A6", "text": "Does your child follow where you're looking?", "reversed": True},
        {"id": "A7", "text": "If you or someone else in the family is upset, does your child show signs of comforting?", "reversed": True},
        {"id": "A8", "text": "Would you describe your child's first words as unusual, delayed, or echolalic?", "reversed": False},
        {"id": "A9", "text": "Does your child use simple gestures?", "reversed": True},
        {"id": "A10", "text": "Does your child stare at nothing with no apparent purpose?", "reversed": False}
    ],
    "children": [
        {"id": "A1_Score", "text": "Notice small sounds when others do not notice them?", "reversed": False},
        {"id": "A2_Score", "text": "Usually concentrates more on the whole picture rather than the small details?", "reversed": True},
        {"id": "A3_Score", "text": "In a social group, can easily keep track of several different people's conversations?", "reversed": True},
        {"id": "A4_Score", "text": "Finds it easy to go back and forth between different activities effortlessly?", "reversed": True},
        {"id": "A5_Score", "text": "Doesn't know how to keep a conversation going with peers?", "reversed": False},
        {"id": "A6_Score", "text": "Good at social chit-chat and informal banter?", "reversed": True},
        {"id": "A7_Score", "text": "When reading a story, finds it difficult to work out characters' intentions?", "reversed": False},
        {"id": "A8_Score", "text": "As a child, enjoyed playing games involving pretending with other children?", "reversed": True},
        {"id": "A9_Score", "text": "Finds it easy to work out what someone is thinking or feeling by looking at their face?", "reversed": True},
        {"id": "A10_Score", "text": "Finds it hard to make new friends with other children?", "reversed": False}
    ],
    "adolescent": [
        {"id": "A1_Score", "text": "Notices small sounds when others do not?", "reversed": False},
        {"id": "A2_Score", "text": "Usually concentrates more on whole picture, rather than small details?", "reversed": True},
        {"id": "A3_Score", "text": "In a social group, can easily keep track of several different conversations?", "reversed": True},
        {"id": "A4_Score", "text": "Finds it easy to switch smoothly between different activities?", "reversed": True},
        {"id": "A5_Score", "text": "Finds it difficult to keep a peer conversation going?", "reversed": False},
        {"id": "A6_Score", "text": "Feels comfortable with spontaneous social chit-chat?", "reversed": True},
        {"id": "A7_Score", "text": "Finds it difficult to judge other people's intentions or motivations?", "reversed": False},
        {"id": "A8_Score", "text": "Enjoys imaginative games and social role-play?", "reversed": True},
        {"id": "A9_Score", "text": "Finds it easy to read emotions and thoughts directly from facial expressions?", "reversed": True},
        {"id": "A10_Score", "text": "Finds it difficult or intimidating to make new friends?", "reversed": False}
    ],
    "adult": [
        {"id": "A1_Score", "text": "I often notice small sounds when others do not.", "reversed": False},
        {"id": "A2_Score", "text": "I usually concentrate more on whole picture, rather than small details.", "reversed": True},
        {"id": "A3_Score", "text": "I find it easy to do more than one thing at once in social situations.", "reversed": True},
        {"id": "A4_Score", "text": "If there is an interruption, I can switch back to what I was doing quickly.", "reversed": True},
        {"id": "A5_Score", "text": "I find it easy to 'read between the lines' when someone is talking to me.", "reversed": True},
        {"id": "A6_Score", "text": "I know how to tell if someone listening to me is getting bored.", "reversed": True},
        {"id": "A7_Score", "text": "When I'm reading a story, I find it difficult to work out characters' intentions.", "reversed": False},
        {"id": "A8_Score", "text": "I like to collect information about categories of things.", "reversed": False},
        {"id": "A9_Score", "text": "I find it easy to work out what someone is thinking or feeling just by their face.", "reversed": True},
        {"id": "A10_Score", "text": "I find it difficult to make new friends.", "reversed": False}
    ]
}

class ScreeningSubmission(BaseModel):
    cohort: str
    answers: Dict[str, int]
    demographics: Optional[Dict[str, Any]] = None
    mode: Optional[str] = "standard"  # "standard", "rapid", or "adaptive"

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "conformal_abstention_enabled": True,
        "adaptive_screener_enabled": True,
        "disclaimer": "Screening support only. Not a diagnosis."
    }

@app.get("/api/questions/{cohort}")
def get_questions(cohort: str, mode: Optional[str] = "standard"):
    if cohort not in COHORT_QUESTIONS:
        cohort = "adult"
    all_qs = COHORT_QUESTIONS[cohort]
    if mode == "rapid":
        rapid_ids = RAPID_FEATURES.get(cohort, [])
        qs = [q for q in all_qs if q["id"] in rapid_ids]
    else:
        qs = all_qs
    return {
        "cohort": cohort,
        "mode": mode,
        "questions": qs,
        "total": len(qs)
    }

@app.get("/api/metrics")
def get_metrics():
    # Load newly saved rigorous results
    shortening_file = RESULTS_DIR / "questionnaire_shortening.json"
    demo_file = RESULTS_DIR / "demographics_baseline.json"
    conformal_file = RESULTS_DIR / "conformal_abstention.json"
    adaptive_file = RESULTS_DIR / "adaptive_questionnaire.json"
    
    def load_json(p):
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
        
    return {
        "questionnaire_shortening": load_json(shortening_file),
        "demographics_baseline": load_json(demo_file),
        "conformal_abstention": load_json(conformal_file),
        "adaptive_questionnaire": load_json(adaptive_file),
        "disclaimer": "Screening support only. Not a diagnosis."
    }

@app.get("/api/audit-results")
def get_audit_results():
    leakage_file = RESULTS_DIR / "leakage_audit.json"
    face_file = RESULTS_DIR / "face_dataset_audit.json"
    cross_file = RESULTS_DIR / "cross_cohort_validation.json"
    
    def load_json(p):
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
        
    return {
        "leakage_audit": load_json(leakage_file),
        "face_dataset_audit": load_json(face_file),
        "cross_cohort_validation": load_json(cross_file),
        "disclaimer": "Screening support only. Not a diagnosis."
    }

@app.post("/api/screen")
def run_screening(payload: ScreeningSubmission):
    cohort = payload.cohort.lower()
    if cohort not in COHORT_QUESTIONS:
        cohort = "adult"
        
    # Check adaptive mode
    if payload.mode == "adaptive":
        # Convert question answers to 0..9 index dictionary
        questions_list = COHORT_QUESTIONS[cohort]
        obs_dict = {}
        for idx, q in enumerate(questions_list):
            if q["id"] in payload.answers:
                obs_dict[idx] = int(payload.answers[q["id"]])
                
        marginals = ITEM_MARGINALS.get(cohort, ITEM_MARGINALS["adult"])
        threshold = CUTOFFS.get(cohort, 7)
        next_idx, curr_prob, stop_now = select_next_question(obs_dict, marginals, threshold)
        
        # Conformal decision
        conformal_out = conformal_engine.predict_conformal_set(curr_prob)
        
        return {
            "adaptive_mode": True,
            "questions_answered_count": len(obs_dict),
            "next_question_id": questions_list[next_idx]["id"] if next_idx is not None else None,
            "next_question_text": questions_list[next_idx]["text"] if next_idx is not None else None,
            "should_stop_early": stop_now,
            "current_posterior_probability": round(curr_prob, 4),
            "state": conformal_out["clinical_state"],
            "recommendation": conformal_out["recommendation"],
            "is_abstention": conformal_out["is_abstention"],
            "disclaimer": "Screening support only. Not a diagnosis."
        }
        
    # Standard or Rapid mode
    is_rapid = payload.mode == "rapid" or len(payload.answers) <= 5
    prob = 0.5
    
    if is_rapid and cohort in rapid_models:
        model = rapid_models[cohort]
        req_features = RAPID_FEATURES.get(cohort, [])
        row = {f: int(payload.answers.get(f, 0)) for f in req_features}
        df_input = pd.DataFrame([row])
        try:
            prob = float(model.predict_proba(df_input)[0, 1])
        except Exception:
            prob = float(np.mean(list(row.values())))
    else:
        model = cohort_models.get(cohort, cohort_models.get("combined_multi_age"))
        if model:
            input_data = {}
            for q_id, val in payload.answers.items():
                input_data[q_id] = int(val)
            questions_list = COHORT_QUESTIONS.get(cohort, COHORT_QUESTIONS["adult"])
            for q in questions_list:
                if q["id"] not in input_data:
                    input_data[q["id"]] = 0

            # Supply demographic defaults if not provided in submission
            user_demo = payload.demographics or {}
            default_demo = {
                "age": 25 if cohort == "adult" else (14 if cohort == "adolescent" else (7 if cohort == "children" else 2)),
                "gender": "m",
                "ethnicity": "White-European",
                "jaundice": "no",
                "family_pdd": "no",
                "country_of_res": "United States",
                "used_app_before": "no"
            }
            for k, default_val in default_demo.items():
                input_data[k] = user_demo.get(k, default_val)

            df_input = pd.DataFrame([input_data])
            try:
                prob = float(model.predict_proba(df_input)[0, 1])
            except Exception as e:
                prob = 0.5

    # Split Conformal Decision Mapping (No raw fixed 0.40/0.65 threshold)
    conformal_out = conformal_engine.predict_conformal_set(prob)
    state = conformal_out["clinical_state"]
    recommendation = conformal_out["recommendation"]
    is_abstention = conformal_out["is_abstention"]

    # Key traits identified
    key_traits = []
    questions_list = COHORT_QUESTIONS.get(cohort, COHORT_QUESTIONS["adult"])
    for q in questions_list:
        ans = payload.answers.get(q["id"], 0)
        if ans == 1:
            key_traits.append({
                "trait_id": q["id"],
                "description": q["text"],
                "indicative": True
            })

    return {
        "state": state,
        "is_abstention": is_abstention,
        "recommendation": recommendation,
        "prediction_set": conformal_out["prediction_set"],
        "key_traits_identified": key_traits,
        "is_rapid_mode": is_rapid,
        "disclaimer": "Screening support only. Not a diagnosis.",
        "cohort": cohort
    }

class ExplanationRequest(BaseModel):
    state: str
    cohort: str
    key_traits: List[Dict[str, Any]]

@app.post("/api/explain")
def generate_explanation(req: ExplanationRequest):
    # Strictly de-identified item codes
    deidentified_items = {t.get("trait_id", f"Item_{i}"): 1 for i, t in enumerate(req.key_traits)}
    result = template_explain(deidentified_items, cohort=req.cohort)
    return {
        "llm_enabled": False,
        "explanation": result["explanation"],
        "flagged_traits": result["flagged_traits"],
        "disclaimer": "Screening support only. Not a diagnosis."
    }

# Server-side Iris Tracking & Landmark-defined length estimation
class IrisTrackingRequest(BaseModel):
    image_base64: Optional[str] = None
    image: Optional[str] = None
    sample_id: Optional[str] = None
    preset_id: Optional[str] = None
    is_child_or_toddler: Optional[bool] = False
    age_group: Optional[str] = "Unknown" 

@app.post("/api/iris-tracking")
async def analyze_iris(request: Request, req: Optional[IrisTrackingRequest] = None):
    raw_img_bytes = None
    content_type = request.headers.get("content-type", "")
    
    # Handle multipart/form-data
    if "multipart/form-data" in content_type:
        form = await request.form()
        file_obj = form.get("file") or form.get("image")
        if file_obj and hasattr(file_obj, "read"):
            raw_img_bytes = await file_obj.read()
        elif form.get("image_base64"):
            req = IrisTrackingRequest(image_base64=form.get("image_base64"))

    # Handle JSON payload
    if raw_img_bytes is None:
        if req is None:
            # Try parsing json directly
            try:
                body_json = await request.json()
                req = IrisTrackingRequest(**body_json)
            except Exception:
                pass

        payload_str = None
        if req:
            payload_str = req.image_base64 or req.image
        
        if not payload_str or not str(payload_str).strip():
            raise HTTPException(
                status_code=422,
                detail="No image provided. A valid base64-encoded image or image file is required."
            )
        
        raw_b64 = str(payload_str).strip()
        
        # If relative URL or filename, try resolving local path in client/public
        if (raw_b64.startswith("/") or raw_b64.endswith((".jpg", ".jpeg", ".png", ".webp"))) and not raw_b64.startswith("data:"):
            clean_rel = raw_b64.lstrip("/").lstrip("\\")
            possible_paths = [
                BASE_DIR / "client" / "public" / clean_rel,
                BASE_DIR / "public" / clean_rel,
                BASE_DIR / clean_rel,
                BASE_DIR / "datasets" / clean_rel
            ]
            for p in possible_paths:
                if p.exists() and p.is_file():
                    with open(p, "rb") as f:
                        raw_img_bytes = f.read()
                    break

        if raw_img_bytes is None:
            # Strip data URL prefix if present ("data:image/...;base64,")
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            raw_b64 = raw_b64.strip().replace(" ", "+")
            try:
                raw_img_bytes = base64.b64decode(raw_b64)
            except Exception as e:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid base64 encoding: {str(e)}"
                )

    try:
        img = Image.open(io.BytesIO(raw_img_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid image format: {str(e)}"
        )
        
    is_child = False
    if req:
        # Apply implausible_for_age ONLY when age group is explicitly 'Child'
        if req.age_group and req.age_group.strip().lower() == "child":
            is_child = True
        elif (not req.age_group or req.age_group.strip().lower() == "unknown") and req.is_child_or_toddler:
            # Fallback if explicit is_child_or_toddler flag set without contradictory age_group
            is_child = False  # default Unknown does NOT trigger pediatric gate
            
    try:
        return analyze_image_iris_scale(img, is_child_or_toddler=is_child)
    except Exception as err:
        from iris_scale import generate_cloud_morphometrics_fallback
        return generate_cloud_morphometrics_fallback(img, is_child_or_toddler=is_child)
