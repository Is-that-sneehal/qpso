"""
traffic_provider.py
Live Traffic Provider using TomTom Flow Segment Data API.
Provides non-blocking, cached, and rate-limited traffic-aware utilities for QPSO routing.
"""
import os
import time
from typing import Dict, Any, Tuple, List, Optional
import requests
import numpy as np

# In-memory traffic cache: (round(lat, 3), round(lon, 3)) -> (timestamp, result_dict)
_TRAFFIC_CACHE: Dict[Tuple[float, float], Tuple[float, Dict[str, Any]]] = {}
_CACHE_TTL_SECONDS = 180

# Rate limiter: max 40 requests per 60 seconds process-wide
_RATE_LIMIT_MAX_CALLS = 40
_RATE_LIMIT_WINDOW_SECONDS = 60.0
_CALL_TIMESTAMPS: List[float] = []

_FALLBACK_TRAFFIC = {
    'current_speed_kmh': None,
    'free_flow_speed_kmh': None,
    'ratio': 1.0,
    'confidence': 0.0
}


def _get_tomtom_key() -> Optional[str]:
    """
    Retrieve TomTom API key from environment variable or optional config without importing streamlit.
    """
    key = os.environ.get("TOMTOM_API_KEY")
    if not key:
        # Check config.py if present without mutating
        try:
            import config
            key = getattr(config, "TOMTOM_API_KEY", None)
        except Exception:
            key = None
            
    # Check secrets file if accessible without streamlit dependency
    if not key:
        try:
            secrets_path = os.path.join(".streamlit", "secrets.toml")
            if os.path.exists(secrets_path):
                with open(secrets_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip().startswith("TOMTOM_API_KEY"):
                            parts = line.split("=", 1)
                            if len(parts) == 2:
                                key = parts[1].strip().strip('"').strip("'")
                                break
        except Exception:
            pass
            
    return key


def _check_rate_limit(now: float) -> bool:
    """
    Returns True if a new API request is allowed under the rate limit, False otherwise.
    Prunes timestamps older than the sliding window.
    """
    global _CALL_TIMESTAMPS
    cutoff = now - _RATE_LIMIT_WINDOW_SECONDS
    _CALL_TIMESTAMPS = [ts for ts in _CALL_TIMESTAMPS if ts > cutoff]
    
    if len(_CALL_TIMESTAMPS) >= _RATE_LIMIT_MAX_CALLS:
        return False
    return True


def get_traffic_flow(lat: float, lon: float) -> Dict[str, Any]:
    """
    Calls TomTom Traffic Flow Segment Data API:
    GET https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json
        ?point={lat},{lon}&key={TOMTOM_API_KEY}

    Returns dict: {
        'current_speed_kmh': float or None,
        'free_flow_speed_kmh': float or None,
        'ratio': current/free_flow (clamped to [0.15, 1.0]),
        'confidence': float (from API response, default 0.5 if missing)
    }

    On ANY failure (network error, timeout >3s, non-200, missing key,
    malformed JSON): returns fallback dict — NEVER raises, NEVER blocks the caller.
    """
    try:
        lat_rounded = round(float(lat), 3)
        lon_rounded = round(float(lon), 3)
    except (ValueError, TypeError):
        return dict(_FALLBACK_TRAFFIC)

    cache_key = (lat_rounded, lon_rounded)
    now = time.time()

    # Check cache first
    if cache_key in _TRAFFIC_CACHE:
        ts, cached_val = _TRAFFIC_CACHE[cache_key]
        if now - ts < _CACHE_TTL_SECONDS:
            return dict(cached_val)

    # Check API key
    api_key = _get_tomtom_key()
    if not api_key:
        return dict(_FALLBACK_TRAFFIC)

    # Check rate limit
    if not _check_rate_limit(now):
        # Rate limit reached; return fallback without blocking/sleeping
        return dict(_FALLBACK_TRAFFIC)

    # Record API call timestamp
    _CALL_TIMESTAMPS.append(now)

    url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
    params = {
        "point": f"{lat},{lon}",
        "key": api_key
    }

    try:
        response = requests.get(url, params=params, timeout=3.0)
        if response.status_code == 200:
            data = response.json()
            flow_data = data.get("flowSegmentData", {})
            current_speed = flow_data.get("currentSpeed")
            free_flow_speed = flow_data.get("freeFlowSpeed")
            confidence = float(flow_data.get("confidence", 0.5))

            if current_speed is not None and free_flow_speed is not None and float(free_flow_speed) > 0:
                curr_spd = float(current_speed)
                ff_spd = float(free_flow_speed)
                raw_ratio = curr_spd / ff_spd
                clamped_ratio = float(min(1.0, max(0.15, raw_ratio)))
                result = {
                    'current_speed_kmh': curr_spd,
                    'free_flow_speed_kmh': ff_spd,
                    'ratio': clamped_ratio,
                    'confidence': confidence
                }
                _TRAFFIC_CACHE[cache_key] = (now, result)
                return result
    except Exception:
        pass

    return dict(_FALLBACK_TRAFFIC)


def edge_midpoint(from_coords: Tuple[float, float], to_coords: Tuple[float, float]) -> Tuple[float, float]:
    """Returns ((lat1+lat2)/2, (lon1+lon2)/2). Pure function, no I/O."""
    try:
        return ((float(from_coords[0]) + float(to_coords[0])) / 2.0,
                (float(from_coords[1]) + float(to_coords[1])) / 2.0)
    except Exception:
        return (0.0, 0.0)


def get_edge_traffic(coord_a: Tuple[float, float], coord_b: Tuple[float, float]) -> Dict[str, Any]:
    """
    Samples traffic at the midpoint of the straight line between coord_a and
    coord_b (lat, lon tuples) using get_traffic_flow(). This is a proxy for
    the road segment — acceptable approximation, no real map-matching required.
    Returns the same dict shape as get_traffic_flow.
    """
    try:
        mid_lat, mid_lon = edge_midpoint(coord_a, coord_b)
        return get_traffic_flow(mid_lat, mid_lon)
    except Exception:
        return dict(_FALLBACK_TRAFFIC)



def classify_congestion(ratio: float) -> str:
    """
    Pure function, no I/O. Buckets a speed ratio into a label:
      ratio >= 0.80  -> 'low'
      0.50 <= ratio < 0.80 -> 'medium'
      ratio < 0.50   -> 'high'
    Returns the string label.
    """
    try:
        r = float(ratio)
    except (ValueError, TypeError):
        return 'low'

    if r >= 0.80:
        return 'low'
    elif r >= 0.50:
        return 'medium'
    else:
        return 'high'


def build_traffic_adjusted_matrix(
    nodes: List[Dict[str, Any]],
    dist_matrix_km: np.ndarray,
    time_matrix_hours: np.ndarray
) -> np.ndarray:
    """
    Args: nodes (list of node dicts with 'coords'), and the two matrices from
    app.build_matrices(nodes).
    For every edge (i, j) with i != j:
        edge_traffic = get_edge_traffic(nodes[i]['coords'], nodes[j]['coords'])
        adjusted_time[i][j] = time_matrix_hours[i][j] / edge_traffic['ratio']
    Returns a NEW numpy array. Does NOT mutate time_matrix_hours in place
    (existing callers may hold a reference to the original).
    Diagonal stays 0. Symmetric edges may get different ratios in each
    direction — that's fine and realistic, do not force symmetry.
    """
    n = len(nodes)
    adjusted_time = np.copy(time_matrix_hours)

    for i in range(n):
        for j in range(n):
            if i != j:
                traffic = get_edge_traffic(nodes[i]['coords'], nodes[j]['coords'])
                ratio = traffic.get('ratio', 1.0)
                if ratio and ratio > 0:
                    adjusted_time[i, j] = time_matrix_hours[i, j] / ratio

    return adjusted_time


def annotate_route_traffic(route_nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Args: route_nodes — a list of node dicts in visiting order (one vehicle's
    route, depot included), same format app.py already produces.
    For each consecutive pair (route_nodes[k], route_nodes[k+1]):
        fetch get_edge_traffic on their coords
    Returns: list of dicts, one per edge, each:
        {
          'from': node name (str),
          'to': node name (str),
          'from_coords': (lat, lon),
          'to_coords': (lat, lon),
          'ratio': float,
          'level': 'low' | 'medium' | 'high'  (via classify_congestion)
        }
    This is the structure the mapping step consumes.
    """
    segments = []
    if not route_nodes or len(route_nodes) < 2:
        return segments

    for k in range(len(route_nodes) - 1):
        n1 = route_nodes[k]
        n2 = route_nodes[k + 1]
        c1 = n1.get('coords', (0.0, 0.0))
        c2 = n2.get('coords', (0.0, 0.0))

        traffic = get_edge_traffic(c1, c2)
        ratio = float(traffic.get('ratio', 1.0))
        level = classify_congestion(ratio)

        segments.append({
            'from': str(n1.get('name', f"Stop {k}")),
            'to': str(n2.get('name', f"Stop {k + 1}")),
            'from_coords': c1,
            'to_coords': c2,
            'ratio': ratio,
            'level': level
        })

    return segments
