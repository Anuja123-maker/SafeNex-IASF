from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime
from enum import Enum

class GeofenceType(str, Enum):
    CIRCULAR = "circular"
    POLYGON = "polygon"

class Point(BaseModel):
    lat: float
    lon: float

class CircularGeofence(BaseModel):
    center: Point
    radius: float  # in meters

class PolygonGeofence(BaseModel):
    vertices: List[Point]  # List of points defining the polygon

class Geofence(BaseModel):
    id: str = Field()
    name: str = Field()
    type: GeofenceType = Field()
    circular: Optional[CircularGeofence] = Field(default=None)
    polygon: Optional[PolygonGeofence] = Field(default=None)

class GPSData(BaseModel):
    device_id: str = Field()
    lat: float = Field()
    lon: float = Field()
    timestamp: datetime = Field()
    accuracy: Optional[float] = Field(default=None)  # GPS accuracy in meters

class GeofenceEventType(str, Enum):
    ENTER = "enter"
    EXIT = "exit"

class GeofenceEvent(BaseModel):
    device_id: str = Field()
    geofence_id: str = Field()
    event_type: GeofenceEventType = Field()
    timestamp: datetime = Field()
    lat: float = Field()
    lon: float = Field()
    distance: Optional[float] = Field(default=None)  # Distance from geofence boundary

class DeviceState(BaseModel):
    device_id: str = Field()
    geofence_id: str = Field()
    is_inside: bool = Field()
    last_update: datetime = Field()
    last_lat: float = Field()
    last_lon: float = Field()