"""
traffic_aware.py
Time-of-day traffic multiplier for Indian road networks.
Works globally — multiplier is time-based, not location-based.
Applies to any route anywhere in the world.
No external API needed. No streamlit. Pure Python + numpy.
"""

import datetime
import numpy as np

try:
    import pytz
    _HAS_PYTZ = True
except ImportError:
    _HAS_PYTZ = False


def get_current_hour():
    """
    Returns current local hour 0-23.
    Uses IST (UTC+5:30) as default since app targets Indian cities.
    Falls back to UTC+5 if pytz not installed.
    Works for any timezone — traffic patterns are time-of-day based,
    not location based, so this is globally valid.
    """
    try:
        if _HAS_PYTZ:
            ist = pytz.timezone('Asia/Kolkata')
            return datetime.datetime.now(ist).hour
        else:
            # Manual UTC+5:30 offset
            utc = datetime.datetime.utcnow()
            ist_offset = datetime.timedelta(hours=5, minutes=30)
            return (utc + ist_offset).hour
    except Exception:
        return datetime.datetime.now().hour


def get_traffic_multiplier(hour=None):
    """
    Returns congestion multiplier for given hour (0-23).
    Uses current hour if not specified.

    Based on India Traffic Index data (TomTom 2023):
    Morning peak 8-10am: roads 45% slower than free flow
    Evening peak 5-8pm:  roads 55% slower than free flow
    Night (0-6am):       roads 15% faster than average

    This multiplier applies to base travel times from OSRM/geodesic,
    making them time-aware without needing a live traffic API.

    Returns float between 0.85 and 1.55.
    """
    if hour is None:
        hour = get_current_hour()

    # (hour_range, multiplier)
    schedule = [
        (range(0, 6),   0.85),   # midnight-6am: free flow
        (range(6, 8),   1.30),   # 6-8am: building traffic
        (range(8, 10),  1.45),   # 8-10am: morning peak
        (range(10, 12), 1.15),   # 10am-noon: post-peak
        (range(12, 17), 1.05),   # noon-5pm: midday moderate
        (range(17, 20), 1.55),   # 5-8pm: evening peak (worst)
        (range(20, 22), 1.25),   # 8-10pm: easing
        (range(22, 24), 0.90),   # 10pm-midnight: light
    ]
    for hour_range, mult in schedule:
        if hour in hour_range:
            return mult
    return 1.10  # safe default


def get_traffic_label(multiplier=None):
    """Human-readable label for current traffic level."""
    if multiplier is None:
        multiplier = get_traffic_multiplier()
    if multiplier <= 0.90:
        return "Free Flow"
    elif multiplier <= 1.10:
        return "Light Traffic"
    elif multiplier <= 1.30:
        return "Moderate"
    elif multiplier <= 1.45:
        return "Heavy — Morning Peak"
    else:
        return "Severe — Evening Peak"


def apply_traffic_to_matrix(time_matrix):
    """
    Apply current time-of-day multiplier to a travel time matrix.
    Input:  numpy array of travel times in hours
    Output: numpy array with traffic-adjusted times in hours
    Safe for any size matrix including 1x1, 0x0, non-square.
    """
    mult = get_traffic_multiplier()
    return np.array(time_matrix, dtype=float) * mult


def apply_live_or_scheduled_traffic(time_matrix, nodes):
    """
    Preferred traffic adjustment: tries REAL TomTom data per edge first,
    falls back to the existing hour-of-day schedule for any edge where
    live data isn't available (no key, rate limited, API error).

    Args:
        time_matrix: numpy array of travel times in hours
        nodes: list of node dicts with 'coords', same order as time_matrix
               rows/cols (needed to know which lat/lon each edge connects)

    Returns: numpy array, same shape as time_matrix, adjusted times.
    Mixed sourcing is fine and expected — some edges may use live data,
    others the schedule, in the same matrix. This is not a bug.
    """
    from live_traffic import get_live_ratio
    import numpy as np

    n = len(nodes)
    adjusted = np.array(time_matrix, dtype=float).copy()
    schedule_mult = get_traffic_multiplier()  # fallback, computed once

    for i in range(n):
        for j in range(n):
            if i == j or time_matrix[i][j] == 0:
                continue
            lat = (nodes[i]['coords'][0] + nodes[j]['coords'][0]) / 2
            lon = (nodes[i]['coords'][1] + nodes[j]['coords'][1]) / 2
            ratio, source = get_live_ratio(lat, lon)
            if ratio is not None and ratio > 0:
                adjusted[i][j] = time_matrix[i][j] / ratio
            else:
                adjusted[i][j] = time_matrix[i][j] * schedule_mult

    return adjusted

