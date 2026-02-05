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
# Using HiveMQ Public Broker (free, no authentication required)
MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
# Subscribe to multiple topics: PIR and Gas sensors
MQTT_TOPICS = [
    ("iot-cybot/pir/test", 0),   # PIR motion sensor
    ("iot-cybot/gas/test", 0),   # Gas sensor
]
MQTT_CLIENT_ID = "iot_backend_server_cybot"

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
        
        # Subscribe to all device topics
        client.subscribe(MQTT_TOPICS)
        for topic, qos in MQTT_TOPICS:
            print(f"[MQTT] Subscribed to: {topic}")
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
    Handles topics like: iot-cybot/pir/test, iot-cybot/gas/test, etc.
    """
    try:
        # Parse topic to get sensor type and device ID
        # Topic format: iot-cybot/{sensor_type}/{device_name}
        topic_parts = msg.topic.split("/")
        
        if len(topic_parts) >= 3:
            sensor_type = topic_parts[1]  # e.g., "pir", "gas"
            device_name = topic_parts[2]  # e.g., "test"
            # Create unique device_id by combining sensor_type + device_name
            device_id = f"{sensor_type}_{device_name}"  # e.g., "pir_test", "gas_test"
        elif len(topic_parts) >= 2:
            sensor_type = topic_parts[1]
            device_name = "default"
            device_id = f"{sensor_type}_{device_name}"
        else:
            sensor_type = "unknown"
            device_name = "unknown"
            device_id = "unknown_device"
        
        # Decode JSON payload
        payload = json.loads(msg.payload.decode('utf-8'))
        
        print(f"\n[MQTT] Message received on topic: {msg.topic}")
        print(f"[MQTT] Sensor Type: {sensor_type}, Device ID: {device_id}")
        print(f"[DATA] {json.dumps(payload, indent=2)}")
        
        # Process the sensor data
        process_sensor_data(device_id, payload, sensor_type)
        
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON payload: {e}")
    except Exception as e:
        print(f"[ERROR] Message processing failed: {e}")


# ============== DATA PROCESSING ==============
def process_sensor_data(device_id, data, sensor_type="sensors"):
    """
    Process incoming sensor data:
    1. Validate data
    2. Run anomaly detection (for temperature/humidity/gas sensors)
    3. Save to Firebase
    4. Generate alerts if needed
    
    Supports:
    - PIR motion sensors (pir_motion field)
    - Temperature/Humidity/Gas sensors
    """
    timestamp = datetime.now().isoformat()
    
    # Handle PIR Motion Sensor
    if sensor_type == "pir" or "pir_motion" in data:
        pir_value = data.get('pir_motion', 0)
        motion_detected = pir_value == 0  # Based on your ESP code: 0 = motion detected
        
        reading_data = {
            "sensor_type": "pir",
            "pir_motion": pir_value,
            "motion_detected": motion_detected,
            "timestamp": timestamp,
            "is_anomaly": motion_detected  # Motion = potential threat
        }
        
        # Save to Firebase
        save_device_data(device_id, reading_data)
        
        # Update device status
        status = "threat" if motion_detected else "normal"
        update_device_status(device_id, {
            "state": status,
            "last_seen": timestamp,
            "sensor_type": "pir",
            "motion_detected": motion_detected
        })
        
        # Create alert if motion detected
        if motion_detected:
            alert_data = {
                "device_id": device_id,
                "timestamp": timestamp,
                "type": "motion",
                "severity": "high",
                "pir_motion": pir_value,
                "message": "🚨 Motion Detected!",
                "acknowledged": False
            }
            save_alert(device_id, alert_data)
            print(f"[ALERT] ⚠️  Motion detected on {device_id}!")
        else:
            print(f"[OK] Device {device_id}: No motion")
        
        return
    
    # Handle Gas Sensor
    if sensor_type == "gas" or "gas_value" in data:
        gas_value = data.get('gas_value', data.get('gas_level', 0))
        gas_threshold = 500  # Threshold for high gas level
        is_high_gas = gas_value > gas_threshold
        
        reading_data = {
            "sensor_type": "gas",
            "gas_value": gas_value,
            "gas_level": gas_value,
            "is_high": is_high_gas,
            "timestamp": timestamp,
            "is_anomaly": is_high_gas
        }
        
        # Save to Firebase
        save_device_data(device_id, reading_data)
        
        # Update device status
        status = "threat" if is_high_gas else "normal"
        update_device_status(device_id, {
            "state": status,
            "last_seen": timestamp,
            "sensor_type": "gas",
            "gas_level": gas_value,
            "is_high": is_high_gas
        })
        
        # Create alert if high gas detected
        if is_high_gas:
            alert_data = {
                "device_id": device_id,
                "timestamp": timestamp,
                "type": "gas",
                "severity": "high",
                "gas_level": gas_value,
                "message": f"🔥 High Gas Level Detected: {gas_value}",
                "acknowledged": False
            }
            save_alert(device_id, alert_data)
            print(f"[ALERT] ⚠️  High gas level on {device_id}: {gas_value}")
        else:
            print(f"[OK] Device {device_id}: Gas level normal ({gas_value})")
        
        return
    
    # Handle Temperature/Humidity/Gas Sensors
    temperature = data.get('temperature', 0)
    humidity = data.get('humidity', 0)
    gas_level = data.get('gas_level', 0)
    
    # Run anomaly detection
    is_anomaly, score, reasons = detect_anomaly(temperature, humidity, gas_level)
    
    # Prepare data for Firebase
    reading_data = {
        "sensor_type": sensor_type,
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
        "sensor_type": sensor_type,
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
        "topics": [t[0] for t in MQTT_TOPICS]
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
