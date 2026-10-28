# Manual Acquisition Instructions for NeuroScreen AI Datasets

Some research datasets require authenticated logins, data use agreements (DUAs), or browser interaction. Do not guess raw download URLs. Follow the steps below for manual acquisition:

---

### 1. ADHD-200 Phenotypic & FreeSurfer Table (NITRC)
* **Exact Portal Page:** [NITRC ADHD-200 File Release System](https://www.nitrc.org/frs/?group_id=383)
* **Project Documentation:** [Preprocessed Connectomes Project - ADHD-200](http://preprocessed-connectomes-project.org/adhd200/)
* **Expected Filename:** `adhd200_preprocessed_phenotypics.tsv` (or site-specific FreeSurfer cortical/subcortical thickness tables)
* **Target Folder:** `D:/projects/asd-decision-client/data/raw/adhd200/`
* **Procedure:**
  1. Create a free account at [nitrc.org](https://www.nitrc.org) and log in.
  2. Visit the download page: `https://www.nitrc.org/frs/?group_id=383`.
  3. Under the Phenotypic section, download `adhd200_preprocessed_phenotypics.tsv`.
  4. Place the file into `D:/projects/asd-decision-client/data/raw/adhd200/`.

---

### 2. Mendeley Unified Toddler–Adolescent–Adult Autism Dataset
* **Exact Portal Page:** [Mendeley Data Repository (DOI: 10.17632/kyxh45xb56.1)](https://data.mendeley.com/datasets/kyxh45xb56/1)
* **Expected Filename:** `Autism_Screening_Data.csv` (or `.zip` archive)
* **Target Folder:** `D:/projects/asd-decision-client/data/raw/mendeley_unified/`
* **Procedure:**
  1. Navigate to `https://data.mendeley.com/datasets/kyxh45xb56/1`.
  2. Click the **Download** button (requires Elsevier / Mendeley free login).
  3. Extract and place the dataset CSV into `D:/projects/asd-decision-client/data/raw/mendeley_unified/`.

---

### 3. Mendeley Autism Facial Images Dataset
* **Exact Portal Page:** [Mendeley Data Repository (DOI: 10.17632/f9dycfvwbt.1)](https://data.mendeley.com/datasets/f9dycfvwbt/1)
* **Expected Filename:** `AutismDataset.zip`
* **Target Folder:** `D:/projects/asd-decision-client/data/raw/mendeley_facial/`
* **Procedure:**
  1. Navigate to `https://data.mendeley.com/datasets/f9dycfvwbt/1`.
  2. Download the package.
  3. Extract images into `D:/projects/asd-decision-client/data/raw/mendeley_facial/`.

---

### 4. Saliency4ASD Benchmark (Zenodo)
* **Exact Portal Page:** [Zenodo Record 2647418](https://zenodo.org/records/2647418) (DOI: 10.5281/zenodo.2647418)
* **Challenge Page:** [Saliency4ASD Grand Challenge](https://saliency4asd.ls2n.fr/datasets/)
* **Expected Filename:** `saliency4asd.zip` (eye fixations, saliency heatmaps, scanpaths)
* **Target Folder:** `D:/projects/asd-decision-client/data/raw/saliency4asd/`
* **Procedure:**
  1. Open `https://zenodo.org/records/2647418`.
  2. Download the dataset archive or use the verified Kaggle mirror via `python -m kaggle datasets download -d sabir00/saliency4asd -p D:/projects/asd-decision-client/data/raw/saliency4asd --unzip`.
