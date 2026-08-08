# 🧬 BioDiscover — Drug Discovery + Bioinformatics Platform

A full-stack, production-ready **Drug Discovery & Bioinformatics Platform** with a stunning 3D interface, real Biopython analysis, and a Flask REST API backend.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

![Platform Preview](https://img.shields.io/badge/Status-Live-00ff88?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=for-the-badge&logo=flask)
![Biopython](https://img.shields.io/badge/Biopython-1.83-green?style=for-the-badge)

---

## ✨ Features

### 🌌 3D Immersive UI
- **Three.js DNA Double Helix** with animated nucleotides and mouse parallax
- Glassmorphism dark-mode design throughout
- 3D CSS card tilt effects, micro-animations, gradient text
- Responsive Bootstrap 5 layout

### 🔬 Real Bioinformatics (Biopython)
- **DNA Analysis**: GC content, melting temperature, AT/GC ratio, ORF detection, codon usage, transcription, translation
- **Protein Analysis**: Molecular weight, isoelectric point, instability index, GRAVY, secondary structure prediction, amino acid composition
- **Pairwise Alignment**: Global alignment with identity percentage

### 📊 Analytics Dashboard (Chart.js)
- Compound status distribution (Doughnut)
- Target protein families (Horizontal Bar)
- Discovery pipeline progress (Line)
- Lipinski compliance (Radar)
- Binding affinity scatter

### ⚗️ Molecule Library
- Lipinski Rule of Five evaluation (MW, LogP, HBD, HBA)
- Extended drug-likeness scoring with TPSA
- Filter by status, target, Lipinski compliance
- SMILES notation display

### 🎯 Drug Target Explorer
- Binding affinity scores (pKd scale)
- Protein family classification
- Associated molecule tracking
- Affinity bar visualization

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS (glassmorphism), Bootstrap 5, Three.js, Chart.js |
| **Backend** | Python 3.11, Flask 3.0, Flask-CORS, Flask-SQLAlchemy |
| **Bioinformatics** | Biopython 1.83 |
| **Database** | SQLite (dev) → PostgreSQL (prod) |
| **Deployment** | GitHub, Render (backend), Netlify (frontend) |

---

## 📁 Project Structure

```
biodiscover/
├── backend/
│   ├── app.py                  # Flask app factory + seed data
│   ├── config.py               # Database & app config
│   ├── models.py               # SQLAlchemy models
│   ├── requirements.txt        # Python dependencies
│   ├── routes/
│   │   ├── dashboard.py        # GET /api/dashboard/stats
│   │   ├── sequence.py         # /api/sequences/*
│   │   ├── molecule.py         # /api/molecules/*
│   │   └── target.py           # /api/targets/*
│   └── services/
│       ├── biopython_service.py  # DNA/protein analysis
│       └── drug_service.py       # Lipinski + drug scoring
│
├── frontend/
│   ├── index.html              # Landing page (3D DNA hero)
│   ├── dashboard.html          # Analytics dashboard
│   ├── sequence.html           # Sequence analysis tool
│   ├── molecules.html          # Molecule library
│   ├── targets.html            # Drug target explorer
│   ├── css/
│   │   ├── main.css            # Global styles + glassmorphism
│   │   └── animations.css      # Keyframes & transitions
│   └── js/
│       ├── api.js              # Fetch wrapper + UI utilities
│       ├── three-scene.js      # Three.js DNA helix scene
│       ├── dashboard.js        # Chart.js charts
│       ├── sequence.js         # Analysis UI logic
│       ├── molecules.js        # Molecule library UI
│       └── targets.js          # Targets explorer UI
│
├── .gitignore
├── Procfile                    # Render/Heroku deployment
├── render.yaml                 # Render one-click deploy
├── netlify.toml                # Netlify frontend deploy
└── run.py                      # Local dev launcher
```

---

## 🛠️ Local Development

### Prerequisites
- Python 3.11+
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/biodiscover-platform.git
cd biodiscover-platform

# Install dependencies
pip install -r backend/requirements.txt

# Run the development server
python run.py
```

Open **http://localhost:5000** in your browser.

---

## 🌐 Deployment

### Option 1: Full Stack on Render (Recommended ✅)

Renders Flask + frontend together — easiest setup:

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:create_app() --bind 0.0.0.0:$PORT`
5. Click **Deploy**

Your app will be live at `https://your-app.onrender.com`

### Option 2: Frontend on Netlify + Backend on Render

**Step A — Deploy backend to Render** (as above) and note your URL.

**Step B — Update `netlify.toml`** with your Render URL:
```toml
[[redirects]]
  from = "/api/*"
  to   = "https://YOUR-APP.onrender.com/api/:splat"
```

**Step C — Deploy frontend to Netlify:**
1. Go to [netlify.com](https://netlify.com) → New Site → Import from GitHub
2. Select your repo
3. Set **Publish directory**: `frontend`
4. Click **Deploy**

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Summary statistics & pipeline data |
| `GET` | `/api/sequences` | List all analyzed sequences |
| `POST` | `/api/sequences/analyze` | Analyze DNA/RNA/protein sequence |
| `POST` | `/api/sequences/align` | Pairwise global alignment |
| `GET` | `/api/molecules` | List molecules (filterable) |
| `POST` | `/api/molecules` | Add new molecule |
| `GET` | `/api/molecules/:id` | Get molecule + Lipinski evaluation |
| `GET` | `/api/targets` | List drug targets |
| `POST` | `/api/targets` | Add new drug target |
| `GET` | `/api/targets/:id` | Get target + associated molecules |

### Example: Analyze a DNA Sequence
```bash
curl -X POST http://localhost:5000/api/sequences/analyze \
  -H "Content-Type: application/json" \
  -d '{"sequence": "ATGGCTTCTTGGCAGATCTTGAGAGCCC", "name": "My Gene"}'
```

### Example: Add a Molecule
```bash
curl -X POST http://localhost:5000/api/molecules \
  -H "Content-Type: application/json" \
  -d '{"name": "Aspirin", "molecular_weight": 180.16, "log_p": 1.19, "hbd": 1, "hba": 4}'
```

---

## 🗄️ Database Models

### Molecule
| Field | Type | Description |
|---|---|---|
| `id` | Integer | Primary key |
| `name` | String | Compound name |
| `smiles` | Text | SMILES notation |
| `molecular_weight` | Float | MW in Daltons |
| `log_p` | Float | Partition coefficient |
| `hbd` | Integer | H-bond donors |
| `hba` | Integer | H-bond acceptors |
| `tpsa` | Float | Polar surface area |
| `lipinski_pass` | Boolean | Rule of Five compliance |
| `status` | String | Screening/Hit/Lead/Preclinical/Clinical/Approved |

### DrugTarget
| Field | Type | Description |
|---|---|---|
| `id` | Integer | Primary key |
| `name` | String | Target name |
| `protein_family` | String | e.g. Tyrosine Kinase |
| `organism` | String | Human/Mouse/Virus/etc. |
| `affinity_score` | Float | Binding affinity (pKd, 0–10) |

### SequenceRecord
| Field | Type | Description |
|---|---|---|
| `id` | Integer | Primary key |
| `sequence` | Text | Raw sequence |
| `sequence_type` | String | DNA/RNA/Protein |
| `gc_content` | Float | GC% for DNA/RNA |
| `length` | Integer | Sequence length |
| `analysis_json` | Text | Full analysis results (JSON) |

---

## 🔧 PostgreSQL Migration

Switch from SQLite to PostgreSQL by setting the `DATABASE_URL` environment variable:

```bash
# On Render, set this environment variable:
DATABASE_URL=postgresql://user:password@host/dbname
```

Install the adapter:
```bash
pip install psycopg2-binary
```

No code changes needed — the config handles the URL format automatically.

---

## 📄 License

MIT License — free for research and educational use.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

<div align="center">
  <strong>Built with 🧬 Flask · Biopython · Three.js · Chart.js · Bootstrap</strong>
</div>
