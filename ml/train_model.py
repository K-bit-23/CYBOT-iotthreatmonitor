"""
============================================================
IoT Anomaly Detection - Model Training Script
Isolation Forest for Anomaly Detection
============================================================

This script trains an Isolation Forest model to detect anomalies
in IoT sensor data (temperature, humidity, gas levels).

Usage:
    python train_model.py

Output:
    - iot_model.pkl (trained model)
    - training_stats.json (model statistics)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import json
import os
from datetime import datetime

# ============== CONFIGURATION ==============
MODEL_OUTPUT_PATH = "iot_model.pkl"
SCALER_OUTPUT_PATH = "scaler.pkl"
STATS_OUTPUT_PATH = "training_stats.json"

# Isolation Forest Parameters
CONTAMINATION = 0.1  # Expected proportion of anomalies (10%)
N_ESTIMATORS = 100   # Number of trees
RANDOM_STATE = 42    # For reproducibility

# ============== GENERATE SYNTHETIC TRAINING DATA ==============
def generate_training_data(n_samples=1000):
    """
    Generate synthetic IoT sensor data for training.
    In production, replace this with real historical data.
    
    Features:
    - temperature: Normal range 20-35°C
    - humidity: Normal range 30-70%
    - gas_level: Normal range 100-400 (analog reading)
    """
    print("[INFO] Generating synthetic training data...")
    
    np.random.seed(RANDOM_STATE)
    
    # Normal data (90% of samples)
    n_normal = int(n_samples * 0.9)
    normal_data = {
        'temperature': np.random.normal(27, 3, n_normal),      # Mean: 27°C, Std: 3
        'humidity': np.random.normal(50, 10, n_normal),        # Mean: 50%, Std: 10
        'gas_level': np.random.normal(250, 50, n_normal),      # Mean: 250, Std: 50
    }
    
    # Anomalous data (10% of samples)
    n_anomaly = n_samples - n_normal
    anomaly_data = {
        'temperature': np.random.uniform(0, 60, n_anomaly),    # Extreme temps
        'humidity': np.random.uniform(0, 100, n_anomaly),      # Extreme humidity
        'gas_level': np.random.uniform(500, 1023, n_anomaly),  # High gas levels
    }
    
    # Combine data
    data = {
        'temperature': np.concatenate([normal_data['temperature'], anomaly_data['temperature']]),
        'humidity': np.concatenate([normal_data['humidity'], anomaly_data['humidity']]),
        'gas_level': np.concatenate([normal_data['gas_level'], anomaly_data['gas_level']]),
    }
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Clip values to realistic ranges
    df['temperature'] = df['temperature'].clip(0, 60)
    df['humidity'] = df['humidity'].clip(0, 100)
    df['gas_level'] = df['gas_level'].clip(0, 1023)
    
    # Shuffle data
    df = df.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)
    
    print(f"[OK] Generated {len(df)} samples")
    print(f"     - Normal samples: {n_normal}")
    print(f"     - Anomaly samples: {n_anomaly}")
    
    return df


# ============== TRAIN MODEL ==============
def train_isolation_forest(data):
    """
    Train Isolation Forest model on the provided data.
    
    Args:
        data: DataFrame with features (temperature, humidity, gas_level)
    
    Returns:
        model: Trained Isolation Forest model
        scaler: Fitted StandardScaler
    """
    print("\n[INFO] Training Isolation Forest model...")
    
    # Feature columns
    features = ['temperature', 'humidity', 'gas_level']
    X = data[features].values
    
    # Normalize features using StandardScaler
    print("[INFO] Normalizing features with StandardScaler...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Initialize Isolation Forest
    model = IsolationForest(
        n_estimators=N_ESTIMATORS,
        contamination=CONTAMINATION,
        random_state=RANDOM_STATE,
        n_jobs=-1,  # Use all CPU cores
        verbose=1
    )
    
    # Train the model
    print("[INFO] Fitting model (this may take a moment)...")
    model.fit(X_scaled)
    
    # Get training predictions
    predictions = model.predict(X_scaled)
    anomaly_scores = model.decision_function(X_scaled)
    
    # Count predictions
    n_normal_pred = np.sum(predictions == 1)
    n_anomaly_pred = np.sum(predictions == -1)
    
    print(f"\n[OK] Model trained successfully!")
    print(f"     - Normal predictions: {n_normal_pred}")
    print(f"     - Anomaly predictions: {n_anomaly_pred}")
    print(f"     - Anomaly ratio: {n_anomaly_pred/len(predictions):.2%}")
    
    return model, scaler, predictions, anomaly_scores


# ============== SAVE MODEL ==============
def save_model(model, scaler, stats):
    """
    Save the trained model and scaler to disk.
    """
    print("\n[INFO] Saving model and scaler...")
    
    # Save model
    joblib.dump(model, MODEL_OUTPUT_PATH)
    print(f"[OK] Model saved to: {MODEL_OUTPUT_PATH}")
    
    # Save scaler
    joblib.dump(scaler, SCALER_OUTPUT_PATH)
    print(f"[OK] Scaler saved to: {SCALER_OUTPUT_PATH}")
    
    # Save training statistics
    with open(STATS_OUTPUT_PATH, 'w') as f:
        json.dump(stats, f, indent=2)
    print(f"[OK] Stats saved to: {STATS_OUTPUT_PATH}")


# ============== TEST MODEL ==============
def test_model(model, scaler):
    """
    Test the model with sample data.
    """
    print("\n[INFO] Testing model with sample data...")
    
    # Test cases
    test_samples = [
        {"temp": 25, "hum": 50, "gas": 200, "expected": "Normal"},
        {"temp": 45, "hum": 90, "gas": 800, "expected": "Anomaly"},
        {"temp": 28, "hum": 55, "gas": 250, "expected": "Normal"},
        {"temp": 5, "hum": 10, "gas": 900, "expected": "Anomaly"},
        {"temp": 30, "hum": 60, "gas": 300, "expected": "Normal"},
    ]
    
    print("\n" + "="*60)
    print(f"{'Temp':>6} | {'Hum':>6} | {'Gas':>6} | {'Pred':>10} | {'Expected':>10}")
    print("="*60)
    
    for sample in test_samples:
        # Prepare input
        X = np.array([[sample['temp'], sample['hum'], sample['gas']]])
        X_scaled = scaler.transform(X)
        
        # Predict
        prediction = model.predict(X_scaled)[0]
        result = "Normal" if prediction == 1 else "Anomaly"
        
        # Check match
        match = "✓" if result == sample['expected'] else "✗"
        
        print(f"{sample['temp']:>6.1f} | {sample['hum']:>6.1f} | {sample['gas']:>6} | {result:>10} | {sample['expected']:>10} {match}")
    
    print("="*60)


# ============== MAIN ==============
def main():
    print("\n" + "="*60)
    print("   IoT Anomaly Detection - Model Training")
    print("   Isolation Forest Algorithm")
    print("="*60 + "\n")
    
    # Step 1: Generate training data
    data = generate_training_data(n_samples=2000)
    
    # Display data statistics
    print("\n[INFO] Data Statistics:")
    print(data.describe())
    
    # Step 2: Train model
    model, scaler, predictions, scores = train_isolation_forest(data)
    
    # Step 3: Prepare statistics
    stats = {
        "model_type": "IsolationForest",
        "n_estimators": N_ESTIMATORS,
        "contamination": CONTAMINATION,
        "n_samples": len(data),
        "features": ["temperature", "humidity", "gas_level"],
        "training_date": datetime.now().isoformat(),
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_std": scaler.scale_.tolist(),
        "anomaly_threshold": float(model.offset_),
    }
    
    # Step 4: Save model
    save_model(model, scaler, stats)
    
    # Step 5: Test model
    test_model(model, scaler)
    
    print("\n" + "="*60)
    print("   Training Complete!")
    print("   Files created:")
    print(f"   - {MODEL_OUTPUT_PATH}")
    print(f"   - {SCALER_OUTPUT_PATH}")
    print(f"   - {STATS_OUTPUT_PATH}")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
