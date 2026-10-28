# ASD Decision Client (Autism Spectrum Disorder Decision Support)

## Project Overview
This project is dedicated to Autism Spectrum Disorder (ASD) decision screening, analysis, and client interface.

## Directory Structure
```
asd-decision-client/
├── datasets/             # Screening datasets and metadata
│   └── dataset_info.md   # Dataset schema & info
├── client/               # Client frontend / interface
├── src/                  # Processing and decision logic
└── README.md
```

## Dataset Guidelines
Ready for dataset ingestion (e.g., AQ-10, Toddler/Child/Adult screening datasets).


## Visual Biometrics & Iris Scaling Disclaimer
The VisionLab facial measurement and corneal iris scaling module is an **unvalidated proof-of-concept demonstration**. It uses nominal 11.7 mm adult corneal diameter for approximate pixel-to-millimeter scaling.
- On young children/toddlers, adult scaling yields physiologically implausible adult-sized dimensions (e.g., toddler IPD > 58 mm, face width > 130 mm), which fail quality gates (`implausible_for_age`) and are hidden.
- The module is strictly excluded from all paper claims, diagnostic triage, and classification models.
