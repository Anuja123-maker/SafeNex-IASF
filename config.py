import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    APP_NAME = os.getenv("APP_NAME", "Geofencing System")
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Geofence hysteresis to handle GPS drift (meters)
    HYSTERESIS_DISTANCE = float(os.getenv("HYSTERESIS_DISTANCE", 10.0))

    # Database or storage config (placeholder for future)
    # For now, in-memory storage