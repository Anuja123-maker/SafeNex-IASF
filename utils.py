import math
from typing import List

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth using Haversine formula.
    Returns distance in meters.
    """
    R = 6371000  # Earth radius in meters

    # Convert to radians
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def point_in_polygon(lat: float, lon: float, polygon_vertices: List[tuple]) -> bool:
    """
    Check if a point is inside a polygon using ray-casting algorithm.
    polygon_vertices: List of (lat, lon) tuples.
    Note: This is a simple implementation; for complex polygons, consider using a library like Shapely.
    """
    n = len(polygon_vertices)
    inside = False

    p1x, p1y = polygon_vertices[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon_vertices[i % n]
        if lon > min(p1y, p2y):
            if lon <= max(p1y, p2y):
                if lat <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lon - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lat <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside

def distance_to_circular_geofence(lat: float, lon: float, center_lat: float, center_lon: float, radius: float) -> float:
    """
    Calculate distance from point to circular geofence boundary.
    Positive if outside, negative if inside.
    """
    dist = haversine_distance(lat, lon, center_lat, center_lon)
    return dist - radius

def is_point_in_circular_geofence(lat: float, lon: float, center_lat: float, center_lon: float, radius: float, hysteresis: float = 0) -> bool:
    """
    Check if point is inside circular geofence, with optional hysteresis.
    """
    dist = haversine_distance(lat, lon, center_lat, center_lon)
    return dist <= (radius + hysteresis)