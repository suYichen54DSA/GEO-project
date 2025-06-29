# 🌱 FANTASTIC: Remote Sensing Intelligence Toolkit  
*A growing collection of practical remote sensing scripts*  
*持续更新的遥感智能脚本合集*

---

## 📦 Current Projects | 当前项目

### 1. `rf_field_classification/`: Random Forest for Plot Classification

This module trains a Random Forest (RF) classifier using UAV imagery and migrates the model to medium-resolution remote sensing data for field-level crop type classification.

**Training process:**
- **Input**: UAV images with annotated scene labels (categories).
- Each UAV image is processed by computing the **mean and variance** of its RGB bands.
- A `.csv` file is generated, where each row corresponds to one image with features like `[mean_R, mean_G, mean_B, var_R, var_G, var_B]` and a label.
- A Random Forest classifier is trained on this tabular data.

**Inference process:**
- Medium-resolution remote sensing images (e.g., GEE-sourced `.tif`) are used.
- Each polygon in the provided `.shp` field boundary is used to extract features.
- The trained RF model predicts the crop type for each field.

> This code forms a basic pipeline for crop classification. Migration learning is not implemented.

---

### 2. `ridge_extraction/`: Ridge Line Extraction from Remote Sensing Images

This module extracts **ridge lines** from topographic or vegetation data (e.g., DEM or NDVI).

**Workflow includes:**
- Reading and preprocessing DEM or vegetation indices.
- Slope/curvature analysis and morphological filtering.
- Extracting continuous linear ridge structures using connectivity analysis.
- Saving results as vector data (`.shp`, `.geojson`, etc.).

> The current version supports basic morphological ridge detection.

---

## 🚧 Status & Updates

This repository is under continuous development and will be updated regularly.

---
