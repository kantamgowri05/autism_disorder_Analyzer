import numpy as np

class TabularExplainer:
    def __init__(self, model, background_data=None):
        import shap
        self.model = model
        # Background data for TreeExplainer or KernelExplainer
        if background_data is not None:
            self.explainer = shap.TreeExplainer(model, background_data)
        else:
            self.explainer = shap.TreeExplainer(model)
            
    def explain_instance(self, x_vector, feature_names):
        # x_vector shape (1, n_features)
        shap_values = self.explainer.shap_values(x_vector)
        # For binary classification, shap_values may be list of 2 arrays or array of shape (1, n, 2) or (1, n)
        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        elif len(shap_values.shape) == 3:
            sv = shap_values[0, :, 1]
        else:
            sv = shap_values[0]
            
        contributions = []
        for name, val, s_val in zip(feature_names, x_vector[0], sv):
            contributions.append({
                "feature": name,
                "value": int(val),
                "shap_importance": float(s_val),
                "direction": "increases_likelihood" if s_val > 0 else "decreases_likelihood"
            })
            
        contributions.sort(key=lambda x: abs(x["shap_importance"]), reverse=True)
        return contributions

def template_explain(deidentified_items, cohort="adult"):
    # Deterministic fallback explanation using strictly de-identified item codes
    flagged = [k for k, v in deidentified_items.items() if v == 1]
    unflagged = [k for k, v in deidentified_items.items() if v == 0]
    
    flagged_str = ", ".join(flagged) if flagged else "None"
    unflagged_str = ", ".join(unflagged) if unflagged else "None"
    
    explanation_text = (
        f"Structured Trait Evaluation ({cohort.capitalize()} Protocol):\n"
        f"- Elevated Items Reported: {flagged_str}\n"
        f"- Age-Typical Items Reported: {unflagged_str}\n\n"
        f"Clinical Synthesis: Responses for items {flagged_str} contributed primarily to the likelihood calculation. "
        "This evaluation represents an automated screening summary based on the published scoring rubric and does NOT constitute a diagnosis. "
        "A formal evaluation requires direct observational assessment by a licensed pediatric or developmental specialist."
    )
    return {
        "explanation": explanation_text,
        "flagged_traits": flagged,
        "is_llm_generated": False
    }
