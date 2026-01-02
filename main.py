import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import ValidationError
from models import Geofence, GPSData, GeofenceEvent
from services import GeofenceService
from config import Config

# Configure logging
logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL), format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title=Config.APP_NAME, debug=Config.DEBUG)

# Initialize service
geofence_service = GeofenceService()

@app.post("/geofences", response_model=Geofence)
async def create_geofence(geofence: Geofence):
    """Create or update a geofence."""
    try:
        geofence_service.add_geofence(geofence)
        return geofence
    except Exception as e:
        logger.error(f"Error creating geofence: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/geofences/{geofence_id}")
async def delete_geofence(geofence_id: str):
    """Delete a geofence."""
    geofence_service.remove_geofence(geofence_id)
    return {"message": f"Geofence {geofence_id} deleted"}

@app.get("/geofences/{geofence_id}", response_model=Geofence)
async def get_geofence(geofence_id: str):
    """Get a geofence by ID."""
    geofence = geofence_service.get_geofence(geofence_id)
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return geofence

@app.post("/gps", response_model=List[GeofenceEvent])
async def ingest_gps_data(gps_data: GPSData):
    """Ingest GPS data and return any triggered events."""
    try:
        events = geofence_service.process_gps_data(gps_data)
        return events
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing GPS data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/devices/{device_id}/state")
async def get_device_state(device_id: str):
    """Get current geofence state of a device."""
    state = geofence_service.get_device_state(device_id)
    if not state:
        raise HTTPException(status_code=404, detail="Device state not found")
    return state

@app.get("/events", response_model=List[GeofenceEvent])
async def get_events(device_id: Optional[str] = None, limit: int = 100):
    """Get recent geofence events."""
    return geofence_service.get_events(device_id, limit)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=Config.HOST, port=Config.PORT)