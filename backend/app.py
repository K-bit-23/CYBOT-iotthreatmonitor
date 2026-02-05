"""
============================================================
Flask Backend Server
Lightweight IoT Anomaly Detection System
============================================================

This is the main Flask application that:
1. Starts the MQTT handler for receiving IoT data
2. Provides REST API endpoints for the dashboard
3. Serves system status and health information

Usage:
    python app.py
    
Server will start at: http://localhost:5000
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import custom modules
from firebase_config import (
    initialize_firebase,
    get_device_data,
    get_alerts,
    get_database_reference
)
from mqtt_handler import (
    initialize as init_mqtt,
    get_mqtt_status,
    stop_mqtt_client
)

# ============== FLASK APP SETUP ==============
app = Flask(__name__)

# Enable CORS for dashboard access
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})

# ============== CONFIGURATION ==============
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 5000))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"


# ============== ROUTES ==============

@app.route("/")
def home():
    """
    Home route - API information.
    """
    return jsonify({
        "name": "IoT Anomaly Detection API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "GET /": "API information",
            "GET /api/status": "System status",
            "GET /api/devices": "List all devices",
            "GET /api/devices/<id>": "Get device details",
            "GET /api/devices/<id>/readings": "Get device readings",
            "GET /api/alerts": "Get all alerts",
            "POST /api/alerts/<id>/acknowledge": "Acknowledge alert"
        }
    })


@app.route("/api/status")
def get_status():
    """
    Get overall system status.
    """
    mqtt_status = get_mqtt_status()
    
    # Get device count
    devices_ref = get_database_reference("/devices")
    devices = devices_ref.get() if devices_ref else {}
    device_count = len(devices) if devices else 0
    
    # Get alert count
    alerts = get_alerts(limit=100)
    unacknowledged_alerts = sum(1 for a in alerts if not a.get('acknowledged', False))
    
    return jsonify({
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "mqtt": mqtt_status,
        "devices": {
            "total": device_count,
            "online": device_count  # TODO: Check actual online status
        },
        "alerts": {
            "total": len(alerts),
            "unacknowledged": unacknowledged_alerts
        }
    })


@app.route("/api/devices")
def list_devices():
    """
    List all registered devices.
    """
    try:
        devices_ref = get_database_reference("/devices")
        devices = devices_ref.get() if devices_ref else {}
        
        if not devices:
            return jsonify([])
        
        device_list = []
        for device_id, device_data in devices.items():
            status = device_data.get('status', {})
            device_list.append({
                "id": device_id,
                "state": status.get('state', 'unknown'),
                "last_seen": status.get('last_seen'),
                "temperature": status.get('temperature'),
                "humidity": status.get('humidity'),
                "gas_level": status.get('gas_level')
            })
        
        return jsonify(device_list)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/devices/<device_id>")
def get_device(device_id):
    """
    Get specific device details.
    """
    try:
        device_ref = get_database_reference(f"/devices/{device_id}")
        device = device_ref.get() if device_ref else None
        
        if not device:
            return jsonify({"error": "Device not found"}), 404
        
        return jsonify({
            "id": device_id,
            "status": device.get('status', {}),
            "reading_count": len(device.get('readings', {}))
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/devices/<device_id>/readings")
def get_device_readings(device_id):
    """
    Get recent readings for a specific device.
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        readings = get_device_data(device_id, limit=limit)
        
        return jsonify({
            "device_id": device_id,
            "count": len(readings),
            "readings": readings
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/alerts")
def list_alerts():
    """
    Get all alerts.
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        alerts = get_alerts(limit=limit)
        
        # Sort by timestamp (newest first)
        alerts.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return jsonify({
            "count": len(alerts),
            "alerts": alerts
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/alerts/<alert_id>/acknowledge", methods=["POST"])
def acknowledge_alert(alert_id):
    """
    Acknowledge an alert.
    """
    try:
        alert_ref = get_database_reference(f"/alerts/{alert_id}")
        if alert_ref:
            alert_ref.update({
                "acknowledged": True,
                "acknowledged_at": datetime.now().isoformat()
            })
            return jsonify({"success": True, "message": "Alert acknowledged"})
        else:
            return jsonify({"error": "Alert not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/summary")
def dashboard_summary():
    """
    Get dashboard summary data.
    """
    try:
        # Get devices
        devices_ref = get_database_reference("/devices")
        devices = devices_ref.get() if devices_ref else {}
        
        # Calculate stats
        total_devices = len(devices) if devices else 0
        normal_devices = 0
        threat_devices = 0
        latest_reading = None
        
        for device_id, device_data in (devices or {}).items():
            status = device_data.get('status', {})
            if status.get('state') == 'threat':
                threat_devices += 1
            else:
                normal_devices += 1
            
            # Get latest reading
            if not latest_reading or status.get('last_seen', '') > latest_reading.get('timestamp', ''):
                latest_reading = {
                    "device_id": device_id,
                    "temperature": status.get('temperature'),
                    "humidity": status.get('humidity'),
                    "gas_level": status.get('gas_level'),
                    "timestamp": status.get('last_seen')
                }
        
        # Get recent alerts
        alerts = get_alerts(limit=10)
        
        return jsonify({
            "devices": {
                "total": total_devices,
                "normal": normal_devices,
                "threat": threat_devices
            },
            "latest_reading": latest_reading,
            "recent_alerts": alerts[:5],  # Last 5 alerts
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============== ERROR HANDLERS ==============

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ============== MAIN ==============
def main():
    """
    Main entry point - initialize components and start server.
    """
    print("\n" + "="*60)
    print("   🛡️  IoT Anomaly Detection Backend Server")
    print("="*60 + "\n")
    
    # Initialize Firebase
    print("[INIT] Initializing Firebase...")
    if not initialize_firebase():
        print("[WARNING] Firebase initialization failed, some features may not work")
    
    # Initialize MQTT handler
    print("[INIT] Starting MQTT handler...")
    if not init_mqtt():
        print("[WARNING] MQTT initialization failed, data ingestion disabled")
    
    # Start Flask server
    print(f"\n[SERVER] Starting Flask server on http://{HOST}:{PORT}")
    print("[SERVER] Press Ctrl+C to stop\n")
    print("="*60 + "\n")
    
    try:
        app.run(host=HOST, port=PORT, debug=DEBUG)
    except KeyboardInterrupt:
        print("\n[SERVER] Shutting down...")
        stop_mqtt_client()
        print("[SERVER] Goodbye!")


if __name__ == "__main__":
    main()
