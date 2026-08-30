"""
qpso_vrp.py

Quantum-Behaved Particle Swarm Optimization for Vehicle Routing.

Based on:
  Li, Li & Wang (2012): Border Mutation + Chaos QPSO for VRP
  Lim et al. (2020): QPSO with Selective Differential Evolution
  Sun et al. (2004/2012): Core QPSO quantum position update

Compatible with: anityu45/quantum-route-optimiser
  - Uses app.build_matrices() for all distance/time computation
  - Uses app.calculate_energy() for route cost evaluation
  - Returns same (routes_list, stats_dict) format as solve_hybrid_quantum
  - stats_dict has: 'history', 'tunnels', 'final_temp' (required by frontend)
  - Works for any location on Earth
  - No streamlit dependency
"""

import numpy as np
import time as time_module
from traffic_aware import get_traffic_multiplier, get_traffic_label


# ─────────────────────────────────────────────────────────────────
# CHAOS INITIALIZATION
# Li et al. (2012): logistic chaos map for better swarm diversity
# ─────────────────────────────────────────────────────────────────

def _logistic_chaos(length, seed):
    """
    Logistic chaos map: x = 4*x*(1-x)
    Produces deterministic, space-filling sequence in (0,1).
    Avoids fixed points at 0, 0.25, 0.5, 0.75, 1.0.
    """
    x = float(seed)
    # Nudge away from known fixed points
    fixed = {0.0, 0.25, 0.5, 0.75, 1.0}
    while x in fixed:
        x += 0.001
    x = max(0.001, min(0.999, x))
    result = []
    for _ in range(length):
        x = 4.0 * x * (1.0 - x)
        result.append(x)
    return np.array(result)


def _chaos_init(n_particles, n_customers):
    """
    Initialize n_particles permutations using chaos sequences.
    Each particle gets unique seed spread across (0.1, 0.9).
    Returns list of n_particles numpy arrays, each a permutation
    of [0, 1, ..., n_customers-1].
    """
    population = []
    for i in range(n_particles):
        if n_particles > 1:
            seed = 0.1 + 0.8 * (i / (n_particles - 1))
        else:
            seed = 0.3
        chaos_vals = _logistic_chaos(n_customers, seed)
        perm = np.argsort(chaos_vals)
        population.append(perm.copy())
    return population


# ─────────────────────────────────────────────────────────────────
# ENCODING: permutation ↔ continuous
# Uses Smallest Position Value (SPV) rule
# ─────────────────────────────────────────────────────────────────

def _perm_to_continuous(perm):
    """
    Convert permutation [0..n-1] to continuous vector in (0,1).
    Position i in permutation maps to value i/n.
    """
    n = len(perm)
    if n == 0:
        return np.array([])
    continuous = np.zeros(n)
    for rank, idx in enumerate(perm):
        continuous[int(idx)] = rank / n
    return continuous


def _continuous_to_perm(continuous):
    """
    Convert continuous vector to permutation via argsort (SPV rule).
    """
    return np.argsort(continuous)


# ─────────────────────────────────────────────────────────────────
# BORDER MUTATION
# Li et al. (2012): reflect out-of-bounds values back into (0,1)
# using chaos perturbation to avoid fixed points
# ─────────────────────────────────────────────────────────────────

def _border_mutation(pos, chaos_val):
    """
    For any dimension outside [0,1], reflect it back inside
    using a chaos-based perturbation.
    chaos_val: single float from logistic sequence
    """
    result = pos.copy()
    for j in range(len(result)):
        if result[j] <= 0.0:
            result[j] = max(0.001, chaos_val * 0.1)
        elif result[j] >= 1.0:
            result[j] = min(0.999, 1.0 - chaos_val * 0.1)
    return result


# ─────────────────────────────────────────────────────────────────
# QPSO POSITION UPDATE
# Sun et al. (2004): quantum delta potential well
# X = p ± alpha * |mbest - X| * ln(1/u)
# ln(1/u) is the quantum tunneling term
# ─────────────────────────────────────────────────────────────────

def _qpso_update(pos, pbest, gbest, mbest, alpha, chaos_val):
    """
    Core QPSO quantum position update for one particle.

    pos:       current continuous position [0,1]^n
    pbest:     personal best continuous position
    gbest:     global best continuous position
    mbest:     mean of all personal bests
    alpha:     contraction-expansion coefficient (decreasing)
    chaos_val: current chaos sequence value for border mutation

    Returns new_pos after quantum update + border mutation.
    """
    n = len(pos)
    if n == 0:
        return pos.copy()

    new_pos = np.zeros(n)
    for j in range(n):
        # Local attractor between personal best and global best
        phi = np.random.uniform(0.0, 1.0)
        p_j = phi * pbest[j] + (1.0 - phi) * gbest[j]

        # Quantum tunneling: ln(1/u) = -ln(u)
        u = np.random.uniform(1e-6, 1.0 - 1e-6)
        tunnel = alpha * abs(mbest[j] - pos[j]) * (-np.log(u))

        # Random sign: particle jumps either direction
        sign = 1.0 if np.random.random() < 0.5 else -1.0
        new_pos[j] = p_j + sign * tunnel

    return _border_mutation(new_pos, chaos_val)


# ─────────────────────────────────────────────────────────────────
# SELECTIVE DIFFERENTIAL EVOLUTION
# Lim et al. (2020): DE crossover for stagnant particles only
# ─────────────────────────────────────────────────────────────────

def _de_crossover(pos, all_positions, F=0.5, CR=0.7):
    """
    Differential Evolution crossover for a stagnant particle.
    Picks 3 random other particles, applies mutation + crossover.
    Only applied when particle has not improved for 'patience' iters.

    F:  differential weight 0.5 (scale factor)
    CR: crossover probability 0.7
    """
    n_pop = len(all_positions)
    if n_pop < 4:
        # Not enough particles for DE, apply small random perturbation
        perturbed = pos + np.random.uniform(-0.1, 0.1, size=len(pos))
        return np.clip(perturbed, 0.001, 0.999)

    # Pick 3 distinct particles different from current
    candidates = list(range(n_pop))
    a_idx, b_idx, c_idx = np.random.choice(candidates, 3, replace=False)
    a = all_positions[a_idx]
    b = all_positions[b_idx]
    c = all_positions[c_idx]

    # Differential mutation
    mutant = a + F * (b - c)

    # Binomial crossover
    trial = pos.copy()
    crossover_mask = np.random.random(len(pos)) < CR
    trial[crossover_mask] = mutant[crossover_mask]

    # Clamp to valid range
    return np.clip(trial, 0.001, 0.999)


# ─────────────────────────────────────────────────────────────────
# ROUTE COST USING app.calculate_energy
# ─────────────────────────────────────────────────────────────────

def _route_cost_from_perm(perm, customer_node_indices, n_vehicles,
                          dist_matrix, time_matrix, all_nodes):
    """
    Evaluate total cost of a permutation.
    perm: numpy array of positions in [0, n_customers-1]
    customer_node_indices: list mapping perm positions to node indices
    (node index 0 is always the depot/start)

    Splits permutation into n_vehicles chunks.
    Each chunk becomes one vehicle route: [depot] + chunk + cost.
    Uses calculate_energy from app.py for consistency.
    """
    from app import calculate_energy

    n_cust = len(perm)
    if n_cust == 0:
        return 0.0

    # Split permutation into vehicle routes
    chunk_size = max(1, n_cust // n_vehicles)
    total_cost = 0.0

    for v in range(n_vehicles):
        start_idx = v * chunk_size
        if v < n_vehicles - 1:
            end_idx = start_idx + chunk_size
        else:
            end_idx = n_cust  # last vehicle takes remainder

        chunk = perm[start_idx:end_idx]
        if len(chunk) == 0:
            continue

        # Build route as node indices: depot(0) + customer nodes
        route_indices = [0]
        for pos in chunk:
            node_idx = customer_node_indices[int(pos)]
            route_indices.append(node_idx)

        # calculate_energy expects list of indices into all_nodes
        try:
            cost = calculate_energy(
                route_indices, dist_matrix, time_matrix, all_nodes)
        except Exception:
            # Safety: if calculate_energy fails, use raw distance sum
            cost = sum(
                dist_matrix[route_indices[i]][route_indices[i+1]]
                for i in range(len(route_indices)-1)
                if route_indices[i] < len(dist_matrix)
                and route_indices[i+1] < len(dist_matrix)
            )
        total_cost += cost

    return total_cost


# ─────────────────────────────────────────────────────────────────
# MAIN QPSO-VRP SOLVER
# ─────────────────────────────────────────────────────────────────

def solve_qpso_vrp(start_node, stops_data, n_vehicles=1, q_params=None):
    """
    QPSO-VRP solver. Drop-in for app.solve_hybrid_quantum().

    Args:
        start_node:  dict {'name': str, 'coords': (lat, lon)}
        stops_data:  list of dicts {'name': str, 'coords': (lat, lon),
                                    'window': (open_hr, close_hr) optional}
        n_vehicles:  int 1-4
        q_params:    dict, accepts same keys as existing solver plus new ones:
                       'iter'        — total iterations (default 500)
                       'n_particles' — swarm size (default 30)
                       'alpha_max'   — max contraction coeff (default 1.0)
                       'alpha_min'   — min contraction coeff (default 0.5)
                       'patience'    — stagnation before DE kick (default 40)
                       'F'           — DE scale factor (default 0.5)
                       'CR'          — DE crossover rate (default 0.7)
                       existing keys 'cool', 'temp' are accepted but ignored

    Returns:
        (routes_list, stats_dict)
        routes_list: list of lists of node dicts
        stats_dict:  {'history': list, 'tunnels': int, 'final_temp': float}
                     — exactly what frontend expects
    """
    # ── Parameters ────────────────────────────────────────────────
    if q_params is None:
        q_params = {}

    max_iter    = int(q_params.get('iter', 500))
    n_particles = int(q_params.get('n_particles', 30))
    alpha_max   = float(q_params.get('alpha_max', 1.0))
    alpha_min   = float(q_params.get('alpha_min', 0.5))
    patience    = int(q_params.get('patience', 40))
    F           = float(q_params.get('F', 0.5))
    CR          = float(q_params.get('CR', 0.7))

    # ── Edge cases ────────────────────────────────────────────────
    empty_stats = {'history': [0.0], 'tunnels': 0, 'final_temp': alpha_min}

    if not stops_data:
        return [[start_node]], empty_stats

    if len(stops_data) == 1:
        return [[start_node, stops_data[0]]], empty_stats

    # ── Node setup ────────────────────────────────────────────────
    all_nodes = [start_node] + list(stops_data)
    n_customers = len(stops_data)
    n_vehicles = max(1, min(n_vehicles, n_customers))

    # Customer node indices in all_nodes: 1 to n_customers
    customer_node_indices = list(range(1, n_customers + 1))

    # ── Build matrices (via app.py — handles all locations globally)
    try:
        from app import build_matrices
        dist_matrix, time_matrix = build_matrices(all_nodes)
        dist_matrix = np.array(dist_matrix, dtype=float)
        time_matrix = np.array(time_matrix, dtype=float)

        # ── Layer real TomTom traffic on top ──────────────────────
        # app.py's build_matrices already applies the schedule multiplier
        # before returning. Undo it first so we don't double-apply, then
        # re-apply via apply_live_or_scheduled_traffic which tries live
        # TomTom Flow Segment Data per edge and falls back to the schedule
        # for any edge where live data is unavailable.
        try:
            from traffic_aware import apply_live_or_scheduled_traffic
            current_mult = get_traffic_multiplier()
            if current_mult and current_mult > 0:
                raw_time_matrix = time_matrix / current_mult
            else:
                raw_time_matrix = time_matrix
            time_matrix = apply_live_or_scheduled_traffic(raw_time_matrix, all_nodes)
        except Exception:
            pass  # keep the schedule-adjusted time_matrix as-is if this fails

    except Exception as e:
        # Hard fallback: geodesic distances at 50km/h
        from geopy.distance import geodesic
        from traffic_aware import apply_traffic_to_matrix
        n = len(all_nodes)
        dist_matrix = np.zeros((n, n))
        time_matrix = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if i != j:
                    d = geodesic(
                        all_nodes[i]['coords'],
                        all_nodes[j]['coords']
                    ).km
                    dist_matrix[i][j] = d
                    time_matrix[i][j] = d / 50.0
        time_matrix = apply_traffic_to_matrix(time_matrix)

    # ── Guard: clamp matrix size to actual node count ─────────────
    n_nodes = len(all_nodes)
    dist_matrix = dist_matrix[:n_nodes, :n_nodes]
    time_matrix = time_matrix[:n_nodes, :n_nodes]

    # ── Cost function wrapper ─────────────────────────────────────
    def cost_fn(perm):
        try:
            return _route_cost_from_perm(
                perm, customer_node_indices,
                n_vehicles, dist_matrix, time_matrix, all_nodes
            )
        except Exception:
            return 1e9

    # ── Chaos initialization (Li et al. 2012) ────────────────────
    raw_perms = _chaos_init(n_particles, n_customers)

    # Convert to continuous positions
    positions = [_perm_to_continuous(p) for p in raw_perms]
    pbests    = [p.copy() for p in positions]

    # Evaluate initial costs
    pbest_costs = []
    for p in pbests:
        perm = _continuous_to_perm(p)
        pbest_costs.append(cost_fn(perm))

    gbest_idx  = int(np.argmin(pbest_costs))
    gbest      = pbests[gbest_idx].copy()
    gbest_cost = pbest_costs[gbest_idx]

    # ── Pre-generate chaos sequences per particle ─────────────────
    chaos_seqs = []
    for i in range(n_particles):
        if n_particles > 1:
            seed = 0.05 + 0.9 * (i / (n_particles - 1))
        else:
            seed = 0.3
        chaos_seqs.append(_logistic_chaos(max_iter + 5, seed))

    # ── Tracking ──────────────────────────────────────────────────
    energy_history  = [gbest_cost]
    tunnel_count    = 0
    stagnation      = [0] * n_particles

    # ── Main QPSO loop ────────────────────────────────────────────
    for iteration in range(max_iter):

        # Alpha decreases linearly: exploration → exploitation
        alpha = alpha_max - (alpha_max - alpha_min) * (iteration / max_iter)

        # Mean best position
        mbest = np.mean(pbests, axis=0)

        # Chaos value for this iteration
        chaos_val = chaos_seqs[0][iteration % len(chaos_seqs[0])]

        for i in range(n_particles):
            c_val = chaos_seqs[i][iteration % len(chaos_seqs[i])]

            # Selective DE for stagnant particles (Lim et al. 2020)
            if stagnation[i] >= patience:
                new_pos = _de_crossover(
                    positions[i],
                    positions,  # all current positions
                    F, CR
                )
                stagnation[i] = 0
            else:
                # Standard QPSO quantum update
                new_pos = _qpso_update(
                    positions[i], pbests[i], gbest,
                    mbest, alpha, c_val
                )

            # Evaluate new position
            new_perm = _continuous_to_perm(new_pos)
            new_cost = cost_fn(new_perm)
            old_cost = cost_fn(_continuous_to_perm(positions[i]))

            # Always update position (QPSO has no acceptance criterion)
            positions[i] = new_pos

            # Track tunneling (cost improved)
            if new_cost < old_cost:
                tunnel_count += 1
                stagnation[i] = 0
            else:
                stagnation[i] += 1

            # Update personal best
            if new_cost < pbest_costs[i]:
                pbests[i]      = new_pos.copy()
                pbest_costs[i] = new_cost

            # Update global best
            if pbest_costs[i] < gbest_cost:
                gbest      = pbests[i].copy()
                gbest_cost = pbest_costs[i]

        energy_history.append(gbest_cost)

    # ── Decode global best into routes ────────────────────────────
    best_perm   = _continuous_to_perm(gbest)
    n_cust      = n_customers
    chunk_size  = max(1, n_cust // n_vehicles)

    routes = []
    for v in range(n_vehicles):
        start_i = v * chunk_size
        end_i   = start_i + chunk_size if v < n_vehicles - 1 else n_cust
        chunk   = best_perm[start_i:end_i]

        route = [start_node]
        for pos in chunk:
            node_idx = customer_node_indices[int(pos) % n_cust]
            if node_idx < len(all_nodes):
                route.append(all_nodes[node_idx])
        routes.append(route)

    # Remove empty routes (vehicle got no stops)
    routes = [r for r in routes if len(r) > 1]
    if not routes:
        # Safety: return all stops in one route
        routes = [[start_node] + list(stops_data)]

    # ── Stats dict — must have exactly these keys for frontend ─────
    stats = {
        'history':    energy_history,
        'tunnels':    tunnel_count,
        'final_temp': float(alpha_min),
        # Extra info (frontend uses .get() so extra keys are safe)
        'algorithm':  'QPSO',
        'traffic':    get_traffic_label(),
        'multiplier': get_traffic_multiplier(),
    }

    return routes, stats
