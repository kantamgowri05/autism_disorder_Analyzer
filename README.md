# NeuroScreen: Adaptive Clinical Triage & Explainable AI for Autism Spectrum Screening

[![Live Demo](https://img.shields.io/badge/Live%20App-Vercel%20Deployment-000000.svg?logo=vercel&logoColor=white)](https://autism-disorder-analyzer.vercel.app)
[![API Status](https://img.shields.io/badge/Backend%20API-Render%20Live-46E3B7.svg?logo=render&logoColor=white)](https://autism-analyzer-api.onrender.com/docs)
[![Swagger Docs](https://img.shields.io/badge/API%20Docs-Interactive%20Swagger-009688.svg?logo=fastapi&logoColor=white)](https://autism-analyzer-api.onrender.com/docs)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717.svg?logo=github&logoColor=white)](https://github.com/kantamgowri05/autism_disorder_Analyzer)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An open-source, mathematically principled clinical decision-support pipeline for Autism Spectrum Disorder (ASD) triage. Rather than deploying black-box classifiers that force binary guesses, **NeuroScreen** combines **Adaptive Bayesian Item Selection** (reducing questionnaire length by up to 53.8%) with **Split-Conformal Risk Abstention** to guarantee patient safety and prevent false reassurance.

---

## 🌐 Live Production Deployments

| Component | Platform | Live URL | Description |
|---|---|---|---|
| **Web Client (Frontend)** | **Vercel** | **[https://autism-disorder-analyzer.vercel.app](https://autism-disorder-analyzer.vercel.app)** | Interactive screening app, dynamic CMI questions & VisionLab biometrics |
| **Backend API (Engine)** | **Render** | **[https://autism-analyzer-api.onrender.com](https://autism-analyzer-api.onrender.com)** | High-performance FastAPI prediction and calibration engine |
| **Interactive API Docs** | **Swagger UI** | **[https://autism-analyzer-api.onrender.com/docs](https://autism-analyzer-api.onrender.com/docs)** | Test all endpoints live in the browser (`/api/screen`, `/api/explain`, `/api/iris-tracking`) |
| **Alternative API Docs** | **ReDoc** | **[https://autism-analyzer-api.onrender.com/redoc](https://autism-analyzer-api.onrender.com/redoc)** | Clean OpenAPI specification documentation |
| **Source Code** | **GitHub** | **[https://github.com/kantamgowri05/autism_disorder_Analyzer](https://github.com/kantamgowri05/autism_disorder_Analyzer)** | Complete open-source codebase & research artifacts |

---

## 📌 Key Highlights & Scientific Innovations

1. **Deterministic Rule Rediscovery**:
   Formal audit of standard public screening cohorts ($N = 2{,}154$) demonstrating that clinical labels are exact step functions of questionnaire scores ($t = 4$ for toddlers; $t = 7$ for children, adolescents, and adults).

2. **Adaptive Bayesian Stopping (Dynamic Questionnaire)**:
   Sequentially orders questions by **Conditional Mutual Information (CMI)** and stops as soon as posterior triage certainty ($\ge 95\%$) or deterministic bounds are reached:
   - **Adults**: Questionnaire reduced by **53.8%** (mean 4.62 items) with **97.87%** agreement.
   - **Toddlers**: Questionnaire reduced by **52.6%** (mean 4.74 items) with **95.07%** agreement.
   - **Children & Adolescents**: Questionnaire reduced by **31.4%–31.8%** with $>99\%$ agreement.

3. **Split-Conformal Risk Abstention**:
   Evaluated over 100 repeated $60/20/20$ train/calibration/test splits under exchangeability. For target error $\alpha = 0.05$ (95% coverage), the screener outputs finite-sample prediction sets $C(X)$. When presentation is ambiguous ($C(X) = \{0, 1\}$), it automatically abstains: **"Specialist Assessment Required"** instead of guessing.

4. **Negative Vision Audit & VisionLab Biometric Scaling**:
   Rigorous Grad-CAM audit of public facial image benchmarks revealing background and border capture shortcuts ($p = 5.44 \times 10^{-19}$). Provides a proof-of-concept corneal iris diameter scaling module with strict pediatric plausibility quality gates.

---

## 🏛️ System Architecture

```
                    ┌────────────────────────────────────────┐
                    │          Client Frontend (Vite)        │
                    │   React 19 + Interactive Screener      │
                    │      Visual Explainer & VisionLab      │
                    └───────────────────┬────────────────────┘
                                        │ REST API
                                        ▼
                    ┌────────────────────────────────────────┐
                    │          FastAPI Backend Engine        │
                    │   /api/screen  |  /api/explain         │
                    │   /api/iris-tracking                   │
                    └───────┬────────────────────┬───────────┘
                            │                    │
              ┌─────────────▼──────┐      ┌──────▼───────────────────┐
              │  Adaptive Screener │      │ Split-Conformal Predictor│
              │  CMI Item Selector │      │ 60/20/20 Calibrated Sets │
              └────────────────────┘      └──────────────────────────┘
```

---

## 📁 Repository Structure

```
autism_disorder_Analyzer/
├── backend/
│   ├── main.py                  # FastAPI REST API application & endpoints
│   ├── adaptive_screener.py     # CMI-driven sequential Bayesian stopping engine
│   ├── conformal.py             # Split-conformal calibration & set predictor
│   ├── explainer.py             # Feature attribution & clinical report generator
│   ├── iris_scale.py            # Corneal diameter metric scaling & quality gates
│   └── requirements.txt         # Backend Python dependencies
├── client/
│   ├── src/
│   │   ├── components/          # UI Components (Screening, VisionLab, Result, etc.)
│   │   ├── config.js            # Dynamic API base URL configuration
│   │   ├── questionsData.js     # AQ-10 & Q-CHAT-10 questionnaire items
│   │   ├── App.jsx              # Application root & workflow router
│   │   └── main.jsx             # React entry point
│   ├── package.json             # Frontend dependencies (React 19, Vite, Motion)
│   └── vite.config.js           # Vite bundle configuration
├── models/                      # Pre-trained screening models & Rapid-5 pipelines
│   ├── asd_screening_model_*.joblib
│   └── tabular_metrics.json
├── results/                     # Empirical benchmark data & 100-split conformal runs
│   ├── adaptive_questionnaire.json
│   ├── conformal_abstention_100splits.json
│   └── demographics_baseline.json
├── docs/paper/                  # 6-page IEEE Conference Paper (LaTeX & compiled PDF)
│   ├── neuroscreen_ieee.tex     # Full LaTeX manuscript
│   └── neuroscreen_ieee.pdf     # Compiled 6-page IEEE paper
└── requirements.txt             # Root requirements for cloud deployment
```

---

## 💻 Local Development Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Run Backend Locally
```bash
# Clone the repository
git clone https://github.com/kantamgowri05/autism_disorder_Analyzer.git
cd autism_disorder_Analyzer

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API will be live at `http://127.0.0.1:8000` (Docs at `http://127.0.0.1:8000/docs`).

### 2. Run Frontend Locally
```bash
cd client

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/screen` | Submits survey responses and returns prediction set $C(X)$, confidence, and triage risk. |
| `POST` | `/api/explain` | Generates transparent clinical explanation and feature contribution summary. |
| `POST` | `/api/iris-tracking` | Analyzes face image, computes corneal iris scaling, and applies quality gates. |
| `GET` | `/api/benchmarks` | Returns full cross-cohort validation metrics and questionnaire reduction statistics. |
| `GET` | `/docs` | Interactive OpenAPI / Swagger UI testbed. |

---

## 📄 Academic Publication

The mathematical methodology, dataset reproducibility audit, and conformal calibration results are detailed in our 6-page IEEE paper located in [`docs/paper/neuroscreen_ieee.pdf`](docs/paper/neuroscreen_ieee.pdf).

---

## ⚖️ License & Ethical Disclaimer

This software is distributed under the **MIT License**.  
**Clinical Notice**: This tool is designed strictly as a clinical decision-support and triage optimization instrument, not as a standalone autonomous diagnostic device. Specialist clinical evaluation remains mandatory for all ambiguous or conformal abstention outcomes.
