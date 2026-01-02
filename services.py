import logging
from typing import Dict, Optional
from datetime import datetime
from models import Geofence, GPSData, GeofenceEvent, GeofenceEventType, DeviceState
from utils import haversine_distance, point_in_polygon, distance_to_circular_geofence, is_point_in_circular_geofence
from config import Config

logger = logging.getLogger(__name__)

class GeofenceService:
    def __init__(self):
        self.geofences: Dict[str, Geofence] = {}  # geofence_id -> Geofence
        self.device_states: Dict[str, DeviceState] = {}  # device_id -> DeviceState
        self.events: List[GeofenceEvent] = []  # In-memory event log (replace with DB in production)

    def add_geofence(self, geofence: Geofence):
        """Add or update a geofence."""
        self.geofences[geofence.id] = geofence
        logger.info(f"Added geofence: {geofence.id} - {geofence.name}")

    def remove_geofence(self, geofence_id: str):
        """Remove a geofence."""
        if geofence_id in self.geofences:
            del self.geofences[geofence_id]
            # Remove associated device states
            devices_to_remove = [d for d, s in self.device_states.items() if s.geofence_id == geofence_id]
            for device in devices_to_remove:
                del self.device_states[device]
            logger.info(f"Removed geofence: {geofence_id}")

    def get_geofence(self, geofence_id: str) -> Optional[Geofence]:
        """Get a geofence by ID."""
        return self.geofences.get(geofence_id)

    def process_gps_data(self, gps_data: GPSData) -> List[GeofenceEvent]:
        """
        Process GPS data for a device and detect geofence events.
        Returns list of events triggered.
        """
        events = []

        # For now, assume one geofence per device (as per assumptions)
        # In future, support multiple geofences per device
        device_id = gps_data.device_id
        geofence_id = self._get_geofence_for_device(device_id)
        if not geofence_id:
            logger.warning(f"No geofence assigned to device {device_id}")
            return events

        geofence = self.geofences.get(geofence_id)
        if not geofence:
            logger.error(f"Geofence {geofence_id} not found for device {device_id}")
            return events

        # Check for duplicate or stale data
        if self._is_duplicate_or_stale(gps_data, geofence_id):
            return events

        # Determine if inside geofence
        is_inside = self._is_point_in_geofence(gps_data.lat, gps_data.lon, geofence)

        # Get previous state
        prev_state = self.device_states.get(device_id)

        if prev_state:
            # Detect transition
            if not prev_state.is_inside and is_inside:
                # Enter event
                event = GeofenceEvent(
                    device_id=device_id,
                    geofence_id=geofence_id,
                    event_type=GeofenceEventType.ENTER,
                    timestamp=gps_data.timestamp,
                    lat=gps_data.lat,
                    lon=gps_data.lon,
                    distance=self._calculate_distance_to_boundary(gps_data.lat, gps_data.lon, geofence)
                )
                events.append(event)
                logger.info(f"Device {device_id} entered geofence {geofence_id}")
            elif prev_state.is_inside and not is_inside:
                # Exit event
                event = GeofenceEvent(
                    device_id=device_id,
                    geofence_id=geofence_id,
                    event_type=GeofenceEventType.EXIT,
                    timestamp=gps_data.timestamp,
                    lat=gps_data.lat,
                    lon=gps_data.lon,
                    distance=self._calculate_distance_to_boundary(gps_data.lat, gps_data.lon, geofence)
                )
                events.append(event)
                logger.info(f"Device {device_id} exited geofence {geofence_id}")

        # Update device state
        self.device_states[device_id] = DeviceState(
            device_id=device_id,
            geofence_id=geofence_id,
            is_inside=is_inside,
            last_update=gps_data.timestamp,
            last_lat=gps_data.lat,
            last_lon=gps_data.lon
        )

        # Log events
        for event in events:
            self.events.append(event)

        return events

    def _get_geofence_for_device(self, device_id: str) -> Optional[str]:
        """Get the geofence ID assigned to a device. For now, hardcoded or based on device_id."""
        # Placeholder: assume geofence_id is the prefix before the last '_'
        # E.g., "test_zone_device1" -> "test_zone"
        parts = device_id.split('_')
        if len(parts) > 1:
            return '_'.join(parts[:-1])
        return device_id

    def _is_duplicate_or_stale(self, gps_data: GPSData, geofence_id: str) -> bool:
        """Check if GPS data is duplicate or stale."""
        state = self.device_states.get(gps_data.device_id)
        if not state:
            return False

        # Check if coordinates are identical (within small threshold)
        coord_threshold = 0.00001  # ~1 meter
        if abs(state.last_lat - gps_data.lat) < coord_threshold and abs(state.last_lon - gps_data.lon) < coord_threshold:
            return True

        # Check if timestamp is older than last update
        if gps_data.timestamp <= state.last_update:
            return True

        return False

    def _is_point_in_geofence(self, lat: float, lon: float, geofence: Geofence) -> bool:
        """Check if point is inside the geofence."""
        if geofence.type == "circular":
            center = geofence.circular.center
            return is_point_in_circular_geofence(lat, lon, center.lat, center.lon, geofence.circular.radius, Config.HYSTERESIS_DISTANCE)
        elif geofence.type == "polygon":
            vertices = [(v.lat, v.lon) for v in geofence.polygon.vertices]
            return point_in_polygon(lat, lon, vertices)
        else:
            raise ValueError(f"Unsupported geofence type: {geofence.type}")

    def _calculate_distance_to_boundary(self, lat: float, lon: float, geofence: Geofence) -> Optional[float]:
        """Calculate distance to geofence boundary. Positive outside, negative inside."""
        if geofence.type == "circular":
            center = geofence.circular.center
            return distance_to_circular_geofence(lat, lon, center.lat, center.lon, geofence.circular.radius)
        elif geofence.type == "polygon":
            # For polygons, distance calculation is more complex; placeholder
            return None
        return None

    def get_device_state(self, device_id: str) -> Optional[DeviceState]:
        """Get current state of a device."""
        return self.device_states.get(device_id)

    def get_events(self, device_id: Optional[str] = None, limit: int = 100) -> List[GeofenceEvent]:
        """Get recent events, optionally filtered by device."""
        events = self.events
        if device_id:
            events = [e for e in events if e.device_id == device_id]
        return events[-limit:]  # Return most recent