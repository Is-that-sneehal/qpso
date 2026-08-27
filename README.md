# QRoute23: Quantum-Inspired Intelligent Traffic Route Optimizer

A quantum-behaved route optimization and disruption management platform for dynamic Vehicle Routing Problems (VRP), Multi-Vehicle Delivery Scheduling (MTSP), and real-time traffic delay recovery.

---

## 🚀 Quick Start

### 1. Requirements & Setup
- Python 3.12+
- Node.js 18+ (for frontend)

```bash
# Clone and checkout the feature branch
git clone https://github.com/pujit23/QRoute23.git
cd QRoute23
git checkout feature/qpso-map-integration

# Install Python dependencies
pip install -r requirements.txt
pip install pytest
```

### 2. Running the Application

#### Option A: FastAPI Backend & React UI (Unified on Port 8000)
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- Web Application: [http://localhost:8000](http://localhost:8000)
- Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

#### Option B: React Frontend Dev Server (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

#### Option C: Streamlit Dashboard (Port 8501)
```bash
python -m streamlit run main.py --server.port=8501
```

---

## ⚛️ Quantum-Behaved PSO v2 Engine (`qpso/`)

The `qpso/` package introduces a state-of-the-art metaheuristic optimization engine with zero regression to existing systems:

- **Core QPSO** (Sun, Feng, Xu formulation): Vectorized wave function potential well sampling without classical velocity inertia.
- **Border Mutation & Chaos Operators** (Li, Li & Wang, 2012): Reflect-and-perturb boundary mutation and Logistic/Tent map chaotic local search.
- **Selective Differential Evolution** (Lim et al., 2020): Stagnation-triggered DE exploration for stagnated particles.
- **Disruption Management** (Ning, Wang & Hu, 2019): Mid-route forward-only replanning balancing operational recovery cost with schedule deviation penalties.

### Enabling QPSO v2 via Feature Flag

#### In Python Logic:
```python
from logic import optimize_route_algo

routes, stats = optimize_route_algo(
    start={"name": "Depot", "coords": (40.7488, -73.9854)},
    stops=[{"name": "Stop 1", "coords": (40.7580, -73.9855)}],
    round_trip=True,
    fleet_size=1,
    use_qpso_v2=True  # Feature flag opt-in (default False)
)
```

#### In REST API (`POST /api/optimize`):
```json
{
  "preset": "manhattan-core",
  "optimizer": "qpso_v2",
  "vehicle_count": 1,
  "round_trip": true
}
```

---

## 🧪 Running the Test Suite & Benchmarks

```bash
# Run all unit, integration, and smoke tests
python -m pytest tests/ -v

# Run the automated multi-algorithm benchmark suite
python -m qpso.benchmark.report
```

Benchmark results are automatically documented in [`docs/qpso/BENCHMARK_RESULTS.md`](docs/qpso/BENCHMARK_RESULTS.md).
Mathematical equations are detailed in [`docs/qpso/MATH_FORMULATION.md`](docs/qpso/MATH_FORMULATION.md).
Architecture decisions are logged in [`docs/qpso/DECISIONS.md`](docs/qpso/DECISIONS.md).
