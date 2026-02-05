# 🛡️ Lightweight IoT Device Anomaly Detection and Threat Monitoring System

A complete IoT security monitoring solution with machine learning-based anomaly detection.

## 📁 Project Structure

```
cybot/
├── esp8266/                    # Arduino code for ESP8266
│   └── sensor_node.ino
├── backend/                    # Python Flask Backend
│   ├── app.py                  # Main Flask application
│   ├── firebase_config.py      # Firebase Admin SDK setup
│   ├── mqtt_handler.py         # MQTT subscriber & handler
│   └── requirements.txt        # Python dependencies
├── ml/                         # Machine Learning
│   ├── train_model.py          # Train Isolation Forest model
│   └── iot_model.pkl           # Saved ML model (generated)
├── dashboard/                  # React Web Dashboard
│   ├── public/
│   ├── src/
│   └── package.json
└── iotthreatmonitor-firebase-adminsdk-*.json  # Firebase credentials
```

## 🚀 Quick Start Guide

### 1️⃣ ESP8266 Setup

1. Open `esp8266/sensor_node.ino` in Arduino IDE
2. Install required libraries:
   - ESP8266WiFi
   - PubSubClient
   - DHT sensor library
3. Update WiFi credentials and MQTT broker IP
4. Upload to ESP8266

### 2️⃣ Train ML Model

```bash
cd ml
pip install scikit-learn joblib numpy pandas
python train_model.py
```

### 3️⃣ Run Backend Server

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 4️⃣ Run Web Dashboard

```bash
cd dashboard
npm install
npm start
```

## 🔧 Configuration

### Firebase Setup
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Save as `iotthreatmonitor-firebase-adminsdk-*.json` in project root

### MQTT Broker
- Install Mosquitto: `sudo apt install mosquitto mosquitto-clients`
- Or use a cloud MQTT broker like HiveMQ

## 📊 System Architecture

```
ESP8266 → MQTT (TLS) → MQTT Broker → Flask Backend → ML Model
                                           ↓
                                    Firebase DB ← Dashboard
```

## 🛠️ Technologies Used

- **Hardware**: ESP8266, DHT11, MQ Gas Sensor
- **Backend**: Python, Flask, Paho-MQTT
- **ML**: Scikit-learn, Isolation Forest
- **Database**: Firebase Realtime Database
- **Frontend**: React.js

## 📝 License

MIT License - Feel free to use and modify!
