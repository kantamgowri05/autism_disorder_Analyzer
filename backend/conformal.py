import numpy as np

class ConformalPredictor:
    def __init__(self, q_threshold=0.35):
        # Default quantile threshold calibrated at alpha=0.10
        self.q_threshold = q_threshold
        
    def predict_conformal_set(self, prob_y1):
        p1 = float(prob_y1)
        p0 = 1.0 - p1
        
        c_set = []
        if (1.0 - p0) <= self.q_threshold:
            c_set.append(0)
        if (1.0 - p1) <= self.q_threshold:
            c_set.append(1)
            
        # Map to 3 clinical states
        if c_set == [0]:
            state = "Lower Likelihood"
            recommendation = "Age-typical development. Regular developmental milestones recommended."
            is_abstention = False
        elif c_set == [1]:
            state = "Higher Likelihood"
            recommendation = "Elevated indicators detected. Formal clinical evaluation recommended."
            is_abstention = False
        else: # [0, 1] or []
            state = "Please See a Specialist"
            recommendation = "Ambiguous or borderline indicators. Model abstains from automated classification to prevent false triage."
            is_abstention = True
            
        return {
            "prediction_set": c_set,
            "clinical_state": state,
            "recommendation": recommendation,
            "is_abstention": is_abstention,
            "q_threshold": self.q_threshold
        }
