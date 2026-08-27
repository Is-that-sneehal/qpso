# logic.py
import app as quantum_solver

def optimize_route_algo(start, stops, round_trip=False, fleet_size=1, quantum_params=None, use_qpso_v2=False):
    """
    Router Logic.
    Strictly calls the Hybrid Quantum Solver.
    NO Classical OR-Tools allowed.
    """
    # 0. Optional Opt-in for QPSO v2 Engine (Feature Flag, default OFF)
    if use_qpso_v2:
        from qpso import optimize_route_qpso_v2, QPSOConfig
        cfg = QPSOConfig.from_dict(quantum_params) if quantum_params else None
        return optimize_route_qpso_v2(start, stops, round_trip=round_trip, fleet_size=fleet_size, qpso_config=cfg)

    # 1. Execute Quantum-Inspired Optimization (Legacy/Baseline)
    # Returns a LIST of routes (even if just 1)
    routes, stats = quantum_solver.solve_hybrid_quantum(start, stops, n_vehicles=fleet_size, q_params=quantum_params)
    
    # 2. Handle Round Trip (Return to Warehouse)
    # If fleet > 1, round trip is mandatory (Hub -> Nodes -> Hub)
    if round_trip or fleet_size > 1:
        for i in range(len(routes)):
            # Append start node to end of each route
            routes[i].append(routes[i][0])
        
    return routes, stats
