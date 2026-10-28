# Reference Card Validation Protocol for Iris-Scaled Anthropometry

## Objective
To empirically validate real-world length estimation derived from corneal iris horizontal diameter scaling ($11.7\text{ mm}$ nominal human average) against a physical ground-truth reference object of certified dimensions.

---

## 1. Certified Reference Standard
- **Reference Object**: Standard ISO/IEC 7810 ID-1 card (e.g., standard credit card, driver's license, or calibration target card).
- **Certified Ground-Truth Dimensions**:
  - **Width ($W_{\text{true}}$)**: **$85.60\text{ mm}$** ($3.370\text{ inches}$)
  - **Height ($H_{\text{true}}$)**: **$53.98\text{ mm}$** ($2.125\text{ inches}$)
  - **Aspect Ratio**: **$1.5858$**

---

## 2. Image Capture Protocol
1. **Sample Size**: Collect at least **20 frontal facial images** across different participants and camera distances.
2. **Co-Planar Positioning**:
   - The participant holds the reference card flat against their forehead or directly adjacent to their eyes.
   - **Crucial Requirement**: The card plane must be strictly co-planar with the corneal iris plane ($\Delta z \approx 0$). Any forward displacement will introduce perspective magnification error ($d_{\text{apparent}} \propto 1/z$).
3. **Head Pose Tolerance**:
   - Head must be strictly frontal: $|\text{Yaw}| \le 15^\circ$, $|\text{Pitch}| \le 15^\circ$, $|\text{Roll}| \le 15^\circ$.
4. **Illumination & Quality**:
   - Diffuse ambient lighting (avoid strong directional glare obscuring the limbal boundary).
   - Eyes wide open (no eyelid ptosis occluding the horizontal iris margin).
   - Native webcam resolution: Minimum $1280 \times 720$ (720p), recommended $1920 \times 1080$ (1080p).
5. **Storage**: Save raw photos to `datasets/card_validation/*.jpg` alongside a JSON annotation file `annotations.json` recording card corner coordinates:
   ```json
   {
     "image_01.jpg": {
       "card_corners_px": [[x1, y1], [x2, y2], [x3, y3], [x4, y4]],
       "ground_truth_width_mm": 85.60,
       "ground_truth_height_mm": 53.98
     }
   }
   ```

---

## 3. Automated Benchmark Execution
Run the automated verification script:
```bash
python experiments/exp8_iris_scale.py
```
This script computes:
- Mean Absolute Error (MAE) in millimeters: $\frac{1}{N} \sum |\hat{W} - W_{\text{true}}|$
- Mean Absolute Percentage Error (MAPE): $\frac{1}{N} \sum \frac{|\hat{W} - W_{\text{true}}|}{W_{\text{true}}} \times 100\%$
- Directional Bias: $\frac{1}{N} \sum (\hat{W} - W_{\text{true}})$
- 95% Confidence Intervals via non-parametric bootstrap ($B=2000$)
- Outputs are saved directly to `results/iris_scale_validation.json`.

---

## 4. Current Status
**Status: UNVALIDATED (Pending Physical Image Capture)**  
Until $N \ge 20$ physical co-planar credit card photos are supplied and verified by `exp8_iris_scale.py`, all millimeter outputs across the NeuroScreen AI frontend and documentation are explicitly marked:
> **"Unvalidated software demonstration; landmark-defined approximate distances; not a clinical diagnostic instrument."**
