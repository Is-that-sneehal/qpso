"""
backend/maps/traffic_adjustment.py

Applies real TomTom Flow Segment data (via root live_traffic.py) to the
backend's own distance/time matrix, with graceful fallback to
backend/maps/traffic_model.py's existing synthetic schedule if live data
is unavailable for a given edge.

No streamlit import anywhere in this file.
live_traffic.py (repo root) has no streamlit dependency -- safe to import directly.

The backend is launched as:
    uvicorn backend.main:app   (from repo root)
so Python's cwd is the repo root, making 'import live_traffic' resolve correctly
without any sys.path hacking.  The sys.path guard below is a belt-and-suspenders
safety net in case the process is launched from a different cwd.
"""

import os
import sys
import datetime
import numpy as np

# Belt-and-suspenders: ensure repo root is on sys.path so live_traffic.py resolves.
# When launched via `uvicorn backend.main:app` from repo root, this is usually a no-op.
_repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)


def apply_real_traffic(time_matrix, nodes):
    """
    Adjusts a travel-time matrix using real TomTom Flow Segment data,
    falling back per-edge to the synthetic schedule in traffic_model.py
    on any live-data failure.

    Args:
        time_matrix (np.ndarray): NxN matrix of travel times in HOURS
                                  (unit confirmed: distance_matrix.py L54
                                   t_hrs = d_km / speed_kmh, shape is hours).
        nodes (list[dict]): list of node dicts with key 'coords': (lat, lon),
                            same order as time_matrix rows/cols.
                            (confirmed structure from osm_graph.py L37-39 and
                            routes_optimize.py L46-56).

    Returns:
        np.ndarray: new array, same shape and unit (hours) as input.
                    Never raises -- any per-edge failure falls back to the
                    synthetic model, and any total failure returns the
                    input matrix completely unmodified.
    """
    try:
        from live_traffic import get_live_ratio
        from backend.maps.traffic_model import get_traffic_multiplier
    except Exception as import_err:
        print(f"[traffic_adjustment] Import failed, returning original matrix: {import_err}")
        return time_matrix

    try:
        n = time_matrix.shape[0]
        adjusted = time_matrix.copy()
        now_hour = datetime.datetime.now().hour + datetime.datetime.now().minute / 60.0

        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                try:
                    # Edge midpoint in lat/lon space
                    lat_i, lon_i = nodes[i]["coords"]
                    lat_j, lon_j = nodes[j]["coords"]
                    mid_lat = (lat_i + lat_j) / 2.0
                    mid_lon = (lon_i + lon_j) / 2.0

                    ratio, source = get_live_ratio(mid_lat, mid_lon)



                    if ratio is not None:
                        # ratio = currentSpeed/freeFlowSpeed (clamped [0.15, 1.0])
                        # A ratio < 1 means congestion; divide time by ratio to increase it.
                        adjusted[i][j] = time_matrix[i][j] / ratio
                    else:
                        # Fallback: synthetic schedule multiplier
                        # get_traffic_multiplier returns a multiplier >= 1.0 for congestion
                        synthetic_mult = get_traffic_multiplier(
                            highway_type="primary", time_hour=now_hour
                        )
                        adjusted[i][j] = time_matrix[i][j] * synthetic_mult

                except Exception as edge_err:
                    print(f"[traffic_adjustment] edge ({i}->{j}) error: {edge_err}, keeping original")
                    # Keep original value for this edge -- already set from time_matrix.copy()

        return adjusted

    except Exception as total_err:
        print(f"[traffic_adjustment] Total failure: {total_err}, returning original matrix")
        return time_matrix
