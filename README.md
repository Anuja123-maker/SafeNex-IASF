# Geofencing System

A production-ready geofencing-based location tracking system for IoT devices.

## Features

- GPS data ingestion via REST API
- Circular and polygon geofence support
- Real-time enter/exit detection
- Hysteresis for GPS drift handling
- Duplicate and stale data filtering
- Comprehensive logging
- Unit tests

## Project Structure

```
geofencing_system/
├── main.py              # FastAPI application
├── models.py            # Pydantic data models
├── services.py          # Geofence business logic
├── utils.py             # Utility functions (Haversine, ray-casting)
├── config.py            # Configuration management
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
├── examples.json        # Example payloads and configurations
└── tests/
    └── test_geofence.py # Unit tests
```

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and configure as needed

## Running the Application

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `POST /geofences` - Create/update a geofence
- `DELETE /geofences/{geofence_id}` - Delete a geofence
- `GET /geofences/{geofence_id}` - Get geofence details
- `POST /gps` - Ingest GPS data
- `GET /devices/{device_id}/state` - Get device geofence state
- `GET /events` - Get recent events
- `GET /health` - Health check

## Example Usage

1. Create a geofence:
   ```bash
   curl -X POST http://localhost:8000/geofences \
     -H "Content-Type: application/json" \
     -d @examples.json  # Use the circular example
   ```

2. Send GPS data:
   ```bash
   curl -X POST http://localhost:8000/gps \
     -H "Content-Type: application/json" \
     -d '{"device_id": "device_001", "lat": 37.7749, "lon": -122.4194, "timestamp": "2023-12-20T10:00:00Z"}'
   ```

3. Check events:
   ```bash
   curl http://localhost:8000/events
   ```

## Running Tests

```bash
python -m unittest tests/test_geofence.py
```

## Configuration

Configure via environment variables (see `.env.example`):

- `HYSTERESIS_DISTANCE`: Distance in meters to account for GPS drift
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `PORT`: Server port

## Notes

- Currently supports one geofence per device
- Events are stored in memory (implement persistent storage for production)
- Device-geofence mapping is placeholder (implement proper mapping in production)