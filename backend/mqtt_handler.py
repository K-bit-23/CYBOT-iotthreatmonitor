"""
============================================================
MQTT Handler
Lightweight IoT Anomaly Detection System
============================================================

This module handles MQTT subscriptions and message processing.
It receives sensor data from IoT devices, runs anomaly detection,
and stores results in Firebase.
"""

import paho.mqtt.client as mqtt
import json
import numpy as np
import joblib
import os
from datetime import datetime
from threading import Thread

# Import Firebase operations
from firebase_config import (
    initialize_firebase,
    save_device_data,
    save_alert,
    update_device_status
)

# ============== CONFIGURATION ==============
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = "iot/+/data"  # Subscribe to all device data topics
MQTT_CLIENT_ID = "iot_backend_server"

# Model paths
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "iot_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "scaler.pkl")

# ============== GLOBAL VARIABLES ==============
mqtt_client = None
model = None
scaler = None
is_connected = False


# ============== LOAD ML MODEL ==============
def load_ml_model():
    """
    Load the trained Isolation Forest model and scaler.
    """
    global model, scaler
    
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            model = joblib.load(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
            print(f"[ML] Model loaded from: {MODEL_PATH}")
            print(f"[ML] Scaler loaded from: {SCALER_PATH}")
            return True
        else:
            print(f"[WARNING] Model files not found!")
            print(f"[INFO] Please run: python ml/train_model.py")
            return False
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        return False


# ============== ANOMALY DETECTION ==============
def detect_anomaly(temperature, humidity, gas_level):
    """
    Run anomaly detection on sensor data.
    
    Args:
        temperature: Temperature reading in Celsius
        humidity: Humidity reading in percentage
        gas_level: Gas sensor analog reading (0-1023)
    
    Returns:
        tuple: (is_anomaly, anomaly_score, reasons)
    """
    if model is None or scaler is None:
        print("[WARNING] ML model not loaded, skipping anomaly detection")
        return False, 0, []
    
    try:
        # Prepare input
        X = np.array([[temperature, humidity, gas_level]])
        X_scaled = scaler.transform(X)
        
        # Get prediction (-1 = anomaly, 1 = normal)
        prediction = model.predict(X_scaled)[0]
        
        # Get anomaly score (lower = more anomalous)
        anomaly_score = model.decision_function(X_scaled)[0]
        
        is_anomaly = prediction == -1
        
        # Determine reasons for anomaly
        reasons = []
        if is_anomaly:
            if temperature > 40 or temperature < 10:
                reasons.append(f"Abnormal temperature: {temperature}°C")
            if humidity > 80 or humidity < 20:
                reasons.append(f"Abnormal humidity: {humidity}%")
            if gas_level > 500:
                reasons.append(f"High gas level detected: {gas_level}")
            
            # If no specific reason, use general
            if not reasons:
                reasons.append("Unusual sensor pattern detected")
        
        return is_anomaly, float(anomaly_score), reasons
        
    except Exception as e:
        print(f"[ERROR] Anomaly detection failed: {e}")
        return False, 0, []


# ============== MQTT CALLBACKS ==============
def on_connect(client, userdata, flags, rc):
    """
    Callback when MQTT client connects to broker.
    """
    global is_connected
    
    if rc == 0:
        is_connected = True
        print(f"[MQTT] Connected to broker at {MQTT_BROKER}:{MQTT_PORT}")
        
        # Subscribe to device data topics
        client.subscribe(MQTT_TOPIC)
        print(f"[MQTT] Subscribed to: {MQTT_TOPIC}")
    else:
        is_connected = False
        print(f"[MQTT] Connection failed with code: {rc}")


def on_disconnect(client, userdata, rc):
    """
    Callback when MQTT client disconnects.
    """
    global is_connected
    is_connected = False
    print(f"[MQTT] Disconnected from broker (rc={rc})")
    
    if rc != 0:
        print("[MQTT] Unexpected disconnection, attempting reconnect...")


def on_message(client, userdata, msg):
    """
    Callback when MQTT message is received.
    """
    try:
        # Parse topic to get device ID
        # Topic format: iot/{device_id}/data
        topic_parts = msg.topic.split("/")
        device_id = topic_parts[1] if len(topic_parts) >= 2 else "unknown"
        
        # Decode JSON payload
        payload = json.loads(msg.payload.decode('utf-8'))
        
        print(f"\n[MQTT] Message received from device: {device_id}")
        print(f"[DATA] {json.dumps(payload, indent=2)}")
        
        # Process the sensor data
        process_sensor_data(device_id, payload)
        
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON payload: {e}")
    except Exception as e:
        print(f"[ERROR] Message processing failed: {e}")


# ============== DATA PROCESSING ==============
def process_sensor_data(device_id, data):
    """
    Process incoming sensor data:
    1. Validate data
    2. Run anomaly detection
    3. Save to Firebase
    4. Generate alerts if needed
    """
    # Extract sensor values
    temperature = data.get('temperature', 0)
    humidity = data.get('humidity', 0)
    gas_level = data.get('gas_level', 0)
    
    # Get timestamp
    timestamp = datetime.now().isoformat()
    
    # Run anomaly detection
    is_anomaly, score, reasons = detect_anomaly(temperature, humidity, gas_level)
    
    # Prepare data for Firebase
    reading_data = {
        "temperature": temperature,
        "humidity": humidity,
        "gas_level": gas_level,
        "location": data.get('location', 'Unknown'),
        "rssi": data.get('rssi', 0),
        "uptime": data.get('uptime', 0),
        "timestamp": timestamp,
        "is_anomaly": is_anomaly,
        "anomaly_score": score
    }
    
    # Save reading to Firebase
    save_device_data(device_id, reading_data)
    
    # Update device status
    status = "threat" if is_anomaly else "normal"
    update_device_status(device_id, {
        "state": status,
        "last_seen": timestamp,
        "temperature": temperature,
        "humidity": humidity,
        "gas_level": gas_level
    })
    
    # If anomaly detected, create alert
    if is_anomaly:
        alert_data = {
            "device_id": device_id,
            "timestamp": timestamp,
            "type": "anomaly",
            "severity": "high" if score < -0.5 else "medium",
            "temperature": temperature,
            "humidity": humidity,
            "gas_level": gas_level,
            "anomaly_score": score,
            "reasons": reasons,
            "message": " | ".join(reasons) if reasons else "Anomaly detected",
            "acknowledged": False
        }
        
        save_alert(device_id, alert_data)
        print(f"[ALERT] ⚠️  Anomaly detected on {device_id}!")
        print(f"[ALERT] Reasons: {', '.join(reasons)}")
    else:
        print(f"[OK] Device {device_id} readings are normal")


# ============== MQTT CLIENT SETUP ==============
def start_mqtt_client():
    """
    Initialize and start the MQTT client.
    """
    global mqtt_client
    
    print("\n[MQTT] Initializing MQTT client...")
    
    # Create client
    mqtt_client = mqtt.Client(MQTT_CLIENT_ID)
    
    # Set callbacks
    mqtt_client.on_connect = on_connect
    mqtt_client.on_disconnect = on_disconnect
    mqtt_client.on_message = on_message
    
    # Optional: Set username/password
    # mqtt_client.username_pw_set("username", "password")
    
    # Optional: Enable TLS
    # mqtt_client.tls_set()
    
    try:
        # Connect to broker
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        
        # Start network loop in background thread
        mqtt_client.loop_start()
        print("[MQTT] Client started successfully")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to connect to MQTT broker: {e}")
        print(f"[INFO] Make sure MQTT broker is running at {MQTT_BROKER}:{MQTT_PORT}")
        return False


def stop_mqtt_client():
    """
    Stop the MQTT client gracefully.
    """
    global mqtt_client
    
    if mqtt_client:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        print("[MQTT] Client stopped")


def get_mqtt_status():
    """
    Get current MQTT connection status.
    """
    return {
        "connected": is_connected,
        "broker": MQTT_BROKER,
        "port": MQTT_PORT,
        "topic": MQTT_TOPIC
    }


# ============== INITIALIZATION ==============
def initialize():
    """
    Initialize all components:
    1. Firebase
    2. ML Model
    3. MQTT Client
    """
    print("\n" + "="*50)
    print("   MQTT Handler Initialization")
    print("="*50)
    
    # Initialize Firebase
    print("\n[STEP 1] Initializing Firebase...")
    firebase_ok = initialize_firebase()
    
    # Load ML model
    print("\n[STEP 2] Loading ML model...")
    model_ok = load_ml_model()
    
    # Start MQTT client
    print("\n[STEP 3] Starting MQTT client...")
    mqtt_ok = start_mqtt_client()
    
    print("\n" + "="*50)
    print("   Initialization Summary")
    print("="*50)
    print(f"   Firebase: {'✓ OK' if firebase_ok else '✗ FAILED'}")
    print(f"   ML Model: {'✓ OK' if model_ok else '✗ FAILED'}")
    print(f"   MQTT:     {'✓ OK' if mqtt_ok else '✗ FAILED'}")
    print("="*50 + "\n")
    
    return firebase_ok and mqtt_ok


# ============== MAIN ==============
if __name__ == "__main__":
    # Run standalone for testing
    import time
    
    if initialize():
        print("\n[INFO] MQTT Handler running. Press Ctrl+C to stop.")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n[INFO] Shutting down...")
            stop_mqtt_client()
    else:
        print("\n[ERROR] Initialization failed!")
