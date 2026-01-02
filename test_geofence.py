import unittest
from datetime import datetime
from models import Geofence, GeofenceType, Point, CircularGeofence, PolygonGeofence, GPSData
from services import GeofenceService
from utils import haversine_distance, point_in_polygon, is_point_in_circular_geofence

class TestGeofenceUtils(unittest.TestCase):

    def test_haversine_distance(self):
        # Test distance between two known points
        # Distance from (0,0) to (0,1) should be approximately 111 km
        dist = haversine_distance(0, 0, 0, 1)
        self.assertAlmostEqual(dist, 111319.49, delta=1000)  # Allow some delta for floating point

    def test_point_in_circular_geofence(self):
        # Center at (0,0), radius 1000m
        self.assertTrue(is_point_in_circular_geofence(0, 0, 0, 0, 1000))
        # Point 500m away should be inside
        self.assertTrue(is_point_in_circular_geofence(0, 0.0045, 0, 0, 1000))  # ~500m east
        # Point 1500m away should be outside
        self.assertFalse(is_point_in_circular_geofence(0, 0.0135, 0, 0, 1000))  # ~1500m east

    def test_point_in_polygon(self):
        # Simple square polygon
        vertices = [(0, 0), (0, 1), (1, 1), (1, 0)]
        self.assertTrue(point_in_polygon(0.5, 0.5, vertices))
        self.assertFalse(point_in_polygon(2, 2, vertices))

class TestGeofenceService(unittest.TestCase):

    def setUp(self):
        self.service = GeofenceService()
        # Add a circular geofence
        geofence = Geofence(
            id="test_zone",
            name="Test Zone",
            type=GeofenceType.CIRCULAR,
            circular=CircularGeofence(center=Point(lat=0, lon=0), radius=1000)
        )
        self.service.add_geofence(geofence)

    def test_add_geofence(self):
        self.assertIsNotNone(self.service.get_geofence("test_zone"))

    def test_process_gps_inside(self):
        gps = GPSData(device_id="test_zone_device1", lat=0, lon=0, timestamp=datetime.now())
        events = self.service.process_gps_data(gps)
        self.assertEqual(len(events), 0)  # No previous state, so no enter event

        # Second update, still inside
        gps2 = GPSData(device_id="test_zone_device1", lat=0.001, lon=0.001, timestamp=datetime.now())
        events2 = self.service.process_gps_data(gps2)
        self.assertEqual(len(events2), 0)  # Still inside

    def test_process_gps_enter_exit(self):
        # Start outside
        gps_out = GPSData(device_id="test_zone_device2", lat=0, lon=0.02, timestamp=datetime.now())  # ~2km east
        events_out = self.service.process_gps_data(gps_out)
        self.assertEqual(len(events_out), 0)

        # Move inside
        gps_in = GPSData(device_id="test_zone_device2", lat=0, lon=0.005, timestamp=datetime.now())  # ~500m east
        events_in = self.service.process_gps_data(gps_in)
        self.assertEqual(len(events_in), 1)
        self.assertEqual(events_in[0].event_type.value, "enter")

        # Move outside again
        gps_out2 = GPSData(device_id="test_zone_device2", lat=0, lon=0.02, timestamp=datetime.now())
        events_out2 = self.service.process_gps_data(gps_out2)
        self.assertEqual(len(events_out2), 1)
        self.assertEqual(events_out2[0].event_type.value, "exit")

if __name__ == '__main__':
    unittest.main()