"""
============================================================
Firebase Configuration
Lightweight IoT Anomaly Detection System
============================================================

This module initializes Firebase Admin SDK for server-side
operations. It uses a service account for authentication.

IMPORTANT: Never expose the service account JSON in frontend code!
"""

import firebase_admin
from firebase_admin import credentials, db
import os
import json

# ============== CONFIGURATION ==============
# Path to service account JSON file (relative to project root)
SERVICE_ACCOUNT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "iotthreatmonitor-firebase-adminsdk-fbsvc-0bff474cf9.json"
)

# Firebase Realtime Database URL
DATABASE_URL = "https://iotthreatmonitor-default-rtdb.firebaseio.com"

# ============== FIREBASE INITIALIZATION ==============
_firebase_app = None

def initialize_firebase():
    """
    Initialize Firebase Admin SDK with service account credentials.
    
    Returns:
        bool: True if initialization successful, False otherwise
    """
    global _firebase_app
    
    # Check if already initialized
    if _firebase_app is not None:
        print("[FIREBASE] Already initialized")
        return True
    
    try:
        # Check if service account file exists
        if not os.path.exists(SERVICE_ACCOUNT_PATH):
            print(f"[ERROR] Service account file not found: {SERVICE_ACCOUNT_PATH}")
            print("[INFO] Please download it from Firebase Console:")
            print("       Project Settings → Service Accounts → Generate New Private Key")
            return False
        
        # Load credentials
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        
        # Initialize Firebase app
        _firebase_app = firebase_admin.initialize_app(cred, {
            'databaseURL': DATABASE_URL
        })
        
        print("[FIREBASE] Initialized successfully!")
        print(f"[FIREBASE] Project: {cred.project_id}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Firebase initialization failed: {str(e)}")
        return False


def get_database_reference(path="/"):
    """
    Get a reference to a specific path in the Realtime Database.
    
    Args:
        path: Database path (e.g., "/devices", "/alerts")
    
    Returns:
        Reference object or None if Firebase not initialized
    """
    if _firebase_app is None:
        if not initialize_firebase():
            return None
    
    return db.reference(path)


# ============== DATABASE OPERATIONS ==============
def save_device_data(device_id, data):
    """
    Save device sensor data to Firebase.
    
    Args:
        device_id: Unique device identifier
        data: Dictionary containing sensor readings
    
    Returns:
        str: Key of the saved record, or None on error
    """
    try:
        ref = get_database_reference(f"/devices/{device_id}/readings")
        if ref:
            new_ref = ref.push(data)
            return new_ref.key
    except Exception as e:
        print(f"[ERROR] Failed to save device data: {e}")
    return None


def save_alert(device_id, alert_data):
    """
    Save an anomaly alert to Firebase.
    
    Args:
        device_id: Device that triggered the alert
        alert_data: Dictionary containing alert details
    
    Returns:
        str: Key of the saved alert, or None on error
    """
    try:
        ref = get_database_reference(f"/alerts")
        if ref:
            new_ref = ref.push(alert_data)
            
            # Also update device status
            status_ref = get_database_reference(f"/devices/{device_id}/status")
            if status_ref:
                status_ref.set({
                    "state": "threat",
                    "last_alert": alert_data.get("timestamp"),
                    "message": alert_data.get("message")
                })
            
            return new_ref.key
    except Exception as e:
        print(f"[ERROR] Failed to save alert: {e}")
    return None


def update_device_status(device_id, status):
    """
    Update device status in Firebase.
    
    Args:
        device_id: Unique device identifier
        status: Status dictionary (state, last_seen, etc.)
    """
    try:
        ref = get_database_reference(f"/devices/{device_id}/status")
        if ref:
            ref.update(status)
            return True
    except Exception as e:
        print(f"[ERROR] Failed to update device status: {e}")
    return False


def get_device_data(device_id, limit=10):
    """
    Get recent device readings from Firebase.
    
    Args:
        device_id: Unique device identifier
        limit: Maximum number of readings to return
    
    Returns:
        list: List of reading dictionaries
    """
    try:
        ref = get_database_reference(f"/devices/{device_id}/readings")
        if ref:
            # Get last N readings
            data = ref.order_by_key().limit_to_last(limit).get()
            if data:
                return list(data.values())
    except Exception as e:
        print(f"[ERROR] Failed to get device data: {e}")
    return []


def get_alerts(limit=20):
    """
    Get recent alerts from Firebase.
    
    Args:
        limit: Maximum number of alerts to return
    
    Returns:
        list: List of alert dictionaries
    """
    try:
        ref = get_database_reference("/alerts")
        if ref:
            data = ref.order_by_key().limit_to_last(limit).get()
            if data:
                alerts = []
                for key, value in data.items():
                    value['id'] = key
                    alerts.append(value)
                return alerts
    except Exception as e:
        print(f"[ERROR] Failed to get alerts: {e}")
    return []


# ============== INITIALIZATION CHECK ==============
if __name__ == "__main__":
    # Test Firebase connection
    print("\n" + "="*50)
    print("   Firebase Configuration Test")
    print("="*50 + "\n")
    
    if initialize_firebase():
        print("\n[TEST] Attempting to write test data...")
        
        test_data = {
            "test": True,
            "message": "Firebase connection successful!",
            "timestamp": "2024-01-01T00:00:00"
        }
        
        ref = get_database_reference("/test")
        if ref:
            ref.set(test_data)
            print("[OK] Test data written successfully!")
            
            # Read back
            result = ref.get()
            print(f"[OK] Read back: {result}")
            
            # Clean up
            ref.delete()
            print("[OK] Test data cleaned up")
    else:
        print("\n[FAILED] Firebase initialization failed!")
