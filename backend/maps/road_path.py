"""
backend/maps/road_path.py

Streamlit-free copy of get_road_path() extracted from root api.py.
All four routing tiers preserved identically:
  Tier 1: TomTom Routing API (real road geometry + traffic)
  Tier 2: OSRM public routing API
  Tier 3: Local OSMnx shortest-path graph
  Tier 4: Honest geodesic straight-line fallback

Key resolution: os.environ / dotenv / .env file -- NO streamlit dependency.
Root api.py is completely untouched; the Streamlit app still uses it as-is.
"""

import os
import logging
import requests
from geopy.distance import geodesic

logger = logging.getLogger("qroute_backend_road_path")


def _get_tomtom_key():
    """
    Resolves TOMTOM_API_KEY without any Streamlit dependency.
    Order of precedence:
      1. os.environ (covers dotenv if already loaded by uvicorn launcher)
      2. python-dotenv explicit load from repo root .env
      3. .streamlit/secrets.toml plain-text parse (non-streamlit read)
      4. .env file manual parse
    Never raises -- returns None if key unavailable.
    """
    key = os.environ.get("TOMTOM_API_KEY")
    if key and key != "your_tomtom_api_key_here":
        return key

    # Try dotenv explicit load
    try:
        import dotenv
        dotenv.load_dotenv()
        key = os.environ.get("TOMTOM_API_KEY")
        if key and key != "your_tomtom_api_key_here":
            return key
    except Exception:
        pass

    # Try .streamlit/secrets.toml (plain read, no streamlit import)
    try:
        secrets_path = os.path.join(".streamlit", "secrets.toml")
        if os.path.exists(secrets_path):
            with open(secrets_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip().startswith("TOMTOM_API_KEY"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            candidate = parts[1].strip().strip('"').strip("'")
                            if candidate and candidate != "your_tomtom_api_key_here":
                                return candidate
    except Exception:
        pass

    # Try .env file manual parse
    try:
        env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
        if not os.path.exists(env_path):
            env_path = ".env"
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line_s = line.strip()
                    if line_s.startswith("TOMTOM_API_KEY"):
                        parts = line_s.split("=", 1)
                        if len(parts) == 2:
                            candidate = parts[1].strip().strip('"').strip("'")
                            if candidate and candidate != "your_tomtom_api_key_here":
                                return candidate
    except Exception:
        pass

    return None


def get_road_path(coords):
    """
    Fetches real road geometry for a sequence of (lat, lon) coordinate pairs.
    Priority: TomTom API -> OSRM API -> Local OSMnx Graph -> Geodesic Fallback

    Args:
        coords: list of [lat, lon] pairs (or tuples)

    Returns:
        (path_geometry, distance_km, duration_mins, is_fallback)
        where path_geometry is a list of [lat, lon] points,
        and is_fallback=True only when all API tiers fail.
    """
    if len(coords) < 2:
        return coords, 0.0, 0.0, False

    tomtom_key = _get_tomtom_key()

    # -- Tier 1: TomTom Routing API --
    if tomtom_key:
        try:
            loc_string = ":".join([f"{lat},{lon}" for lat, lon in coords])
            url = f"https://api.tomtom.com/routing/1/calculateRoute/{loc_string}/json"
            params = {"key": tomtom_key, "traffic": "true", "routeType": "fastest"}
            r = requests.get(url, params=params, timeout=5)
            if r.status_code == 200:
                data = r.json()
                routes = data.get("routes", [])
                if routes:
                    summary = routes[0]["summary"]
                    legs = routes[0]["legs"]
                    points = []
                    for leg in legs:
                        for p in leg["points"]:
                            points.append([p["latitude"], p["longitude"]])
                    dist_km = summary["lengthInMeters"] / 1000.0
                    time_mins = summary["travelTimeInSeconds"] / 60.0
                    logger.info(
                        f"[TomTom Routing OK] {len(points)} geometry points. "
                        f"Dist: {dist_km:.2f}km"
                    )
                    return points, dist_km, time_mins, False
            else:
                logger.warning(
                    f"[TomTom Routing Failed] HTTP {r.status_code}: {r.text[:150]}"
                )
        except Exception as e:
            logger.warning(f"[TomTom Routing Exception] {e}")
    else:
        logger.info(
            "[TomTom Routing Skipped] No TOMTOM_API_KEY environment variable set."
        )

    # -- Tier 2: OSRM Routing API --
    loc_string = ";".join([f"{lon},{lat}" for lat, lon in coords])
    osrm_url = (
        f"http://router.project-osrm.org/route/v1/driving/{loc_string}"
        "?overview=full&geometries=geojson"
    )
    try:
        r = requests.get(osrm_url, timeout=5)
        if r.status_code == 200:
            data = r.json()
            if "routes" in data and len(data["routes"]) > 0:
                rt = data["routes"][0]
                geometry = rt["geometry"]["coordinates"]
                # OSRM returns [lon, lat]; we need [lat, lon]
                path_geo = [[p[1], p[0]] for p in geometry]
                dist_km = rt["distance"] / 1000.0
                time_mins = rt["duration"] / 60.0
                logger.info(
                    f"[OSRM Routing OK] {len(path_geo)} geometry points. "
                    f"Dist: {dist_km:.2f}km"
                )
                return path_geo, dist_km, time_mins, False
            else:
                logger.warning(
                    f"[OSRM Routing Failed] Response missing routes: {data}"
                )
        else:
            logger.warning(
                f"[OSRM Routing Failed] HTTP {r.status_code}: {r.text[:150]}"
            )
    except Exception as e:
        logger.warning(f"[OSRM Routing Exception] {e}")

    # -- Tier 3: Local OSMnx Shortest Path Routing --
    try:
        from backend.maps.osm_graph_bbox import load_bbox_graph
        import osmnx as ox
        import networkx as nx

        G, num_nodes, _ = load_bbox_graph(coords, pad_km=3.0)
        if G is not None and num_nodes > 0:
            points = []
            total_len_m = 0.0
            for i in range(len(coords) - 1):
                c1, c2 = coords[i], coords[i + 1]
                orig = ox.distance.nearest_nodes(G, c1[1], c1[0])
                dest = ox.distance.nearest_nodes(G, c2[1], c2[0])
                route_nodes = nx.shortest_path(G, orig, dest, weight="length")
                for node in route_nodes:
                    points.append([G.nodes[node]["y"], G.nodes[node]["x"]])
                for u, v in zip(route_nodes[:-1], route_nodes[1:]):
                    edge_data = G.get_edge_data(u, v)
                    if edge_data and 0 in edge_data:
                        total_len_m += edge_data[0].get("length", 0)

            dist_km = (
                total_len_m / 1000.0
                if total_len_m > 0
                else sum(
                    geodesic(coords[i], coords[i + 1]).km
                    for i in range(len(coords) - 1)
                )
            )
            time_mins = (dist_km / 45.0) * 60.0
            if points:
                logger.info(
                    f"[OSMnx Local Graph OK] {len(points)} points via NetworkX."
                )
                return points, dist_km, time_mins, False
    except Exception as e:
        logger.warning(f"[OSMnx Local Graph Routing Exception] {e}")

    # -- Tier 4: Honest Geodesic Straight-Line Fallback --
    logger.error(
        "[All Road Routing Sources Failed] Falling back to geodesic straight-line."
    )
    total_dist_km = 0.0
    for i in range(len(coords) - 1):
        total_dist_km += geodesic(coords[i], coords[i + 1]).km

    total_time_mins = (total_dist_km / 45.0) * 60.0
    return coords, total_dist_km, total_time_mins, True
