"""
experiments/exp8_iris_scale.py
==============================
Validation benchmark comparing iris-scale real-world distance estimates against
a certified physical ground truth (ISO/IEC 7810 ID-1 standard credit card: 85.60 x 53.98 mm).

Rule: If datasets/card_validation has fewer than 20 valid physical images, exit
with an error and write NO results file. Never generate simulated validation results.
"""

import os
import sys

CARD_DIR = r"D:\projects\asd-decision-client\datasets\card_validation"
RESULTS_DIR = r"D:\projects\asd-decision-client\results"
VALIDATION_OUT = os.path.join(RESULTS_DIR, "iris_scale_validation.json")

def run_validation():
    if not os.path.exists(CARD_DIR):
        print(f"ERROR: Dataset directory '{CARD_DIR}' does not exist.", file=sys.stderr)
        print("Required: at least 20 valid physical ground-truth card calibration images.", file=sys.stderr)
        # Ensure no results file is written or persists
        if os.path.exists(VALIDATION_OUT):
            os.remove(VALIDATION_OUT)
        sys.exit(1)

    physical_files = [
        f for f in os.listdir(CARD_DIR)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]

    if len(physical_files) < 20:
        print(
            f"ERROR: Found {len(physical_files)} images in '{CARD_DIR}'. "
            f"A minimum of 20 certified physical images is required. "
            f"Exiting without writing results file.",
            file=sys.stderr
        )
        if os.path.exists(VALIDATION_OUT):
            os.remove(VALIDATION_OUT)
        sys.exit(1)

    print(f"Found {len(physical_files)} physical validation images. Evaluating...")
    # Physical validation processing would execute here once physical images are captured.

if __name__ == "__main__":
    run_validation()
