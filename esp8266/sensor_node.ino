/*
 * ============================================================
 * ESP8266 IoT Sensor Node
 * Lightweight IoT Device Anomaly Detection System
 * ============================================================
 * 
 * Hardware Required:
 * - ESP8266 (NodeMCU/Wemos D1 Mini)
 * - DHT11 Temperature & Humidity Sensor
 * - MQ Gas Sensor (MQ-2, MQ-135, etc.)
 * 
 * Connections:
 * - DHT11 DATA -> D4 (GPIO2)
 * - MQ Sensor AOUT -> A0 (Analog)
 * 
 * Libraries Required:
 * - ESP8266WiFi (built-in)
 * - PubSubClient (MQTT)
 * - DHT sensor library by Adafruit
 */

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// ============== CONFIGURATION ==============
// WiFi Credentials - UPDATE THESE!
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT Broker Settings - UPDATE THESE!
const char* MQTT_BROKER = "192.168.1.100";  // Your MQTT broker IP
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "esp8266_device1";
const char* MQTT_TOPIC = "iot/device1/data";

// Optional: MQTT Authentication
const char* MQTT_USER = "";      // Leave empty if not required
const char* MQTT_PASSWORD = "";  // Leave empty if not required

// Sensor Configuration
#define DHT_PIN D4          // DHT11 data pin
#define DHT_TYPE DHT11      // DHT sensor type
#define MQ_PIN A0           // MQ sensor analog pin

// Device Settings
const char* DEVICE_ID = "device1";
const char* DEVICE_LOCATION = "Room1";
const unsigned long PUBLISH_INTERVAL = 5000;  // 5 seconds

// ============== OBJECTS ==============
WiFiClient espClient;
PubSubClient mqttClient(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

// ============== VARIABLES ==============
unsigned long lastPublishTime = 0;
int reconnectAttempts = 0;

// ============== SETUP ==============
void setup() {
  // Initialize Serial for debugging
  Serial.begin(115200);
  Serial.println("\n\n========================================");
  Serial.println("ESP8266 IoT Sensor Node Starting...");
  Serial.println("========================================");
  
  // Initialize DHT sensor
  dht.begin();
  Serial.println("[OK] DHT11 sensor initialized");
  
  // Initialize MQ sensor pin
  pinMode(MQ_PIN, INPUT);
  Serial.println("[OK] MQ gas sensor initialized");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Configure MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  
  // Initial delay for sensor warmup
  Serial.println("[INFO] Waiting for sensors to stabilize...");
  delay(2000);
  
  Serial.println("\n[READY] System initialized successfully!");
  Serial.println("========================================\n");
}

// ============== MAIN LOOP ==============
void loop() {
  // Ensure WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }
  
  // Ensure MQTT connection
  if (!mqttClient.connected()) {
    connectToMQTT();
  }
  
  // Handle MQTT messages
  mqttClient.loop();
  
  // Publish sensor data at intervals
  unsigned long currentTime = millis();
  if (currentTime - lastPublishTime >= PUBLISH_INTERVAL) {
    publishSensorData();
    lastPublishTime = currentTime;
  }
}

// ============== WIFI CONNECTION ==============
void connectToWiFi() {
  Serial.print("[WIFI] Connecting to ");
  Serial.print(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n[WIFI] Connection failed! Retrying in 5s...");
    delay(5000);
  }
}

// ============== MQTT CONNECTION ==============
void connectToMQTT() {
  Serial.print("[MQTT] Connecting to broker at ");
  Serial.print(MQTT_BROKER);
  Serial.print(":");
  Serial.println(MQTT_PORT);
  
  while (!mqttClient.connected()) {
    bool connected = false;
    
    // Connect with or without authentication
    if (strlen(MQTT_USER) > 0) {
      connected = mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD);
    } else {
      connected = mqttClient.connect(MQTT_CLIENT_ID);
    }
    
    if (connected) {
      Serial.println("[MQTT] Connected successfully!");
      reconnectAttempts = 0;
      
      // Subscribe to command topic (optional)
      String cmdTopic = "iot/" + String(DEVICE_ID) + "/cmd";
      mqttClient.subscribe(cmdTopic.c_str());
      Serial.print("[MQTT] Subscribed to: ");
      Serial.println(cmdTopic);
      
    } else {
      reconnectAttempts++;
      Serial.print("[MQTT] Connection failed, rc=");
      Serial.print(mqttClient.state());
      Serial.print(" | Attempt ");
      Serial.print(reconnectAttempts);
      Serial.println("/10");
      
      if (reconnectAttempts >= 10) {
        Serial.println("[MQTT] Max attempts reached. Restarting...");
        ESP.restart();
      }
      
      delay(2000);
    }
  }
}

// ============== MQTT CALLBACK ==============
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT] Message received on topic: ");
  Serial.println(topic);
  
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("[MQTT] Payload: ");
  Serial.println(message);
  
  // Handle commands here (e.g., restart, change interval)
  if (message == "restart") {
    Serial.println("[CMD] Restart command received");
    ESP.restart();
  }
}

// ============== READ & PUBLISH SENSOR DATA ==============
void publishSensorData() {
  // Read DHT11 sensor
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Read MQ gas sensor (analog value 0-1023)
  int gasValue = analogRead(MQ_PIN);
  
  // Validate readings
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[ERROR] Failed to read DHT11 sensor!");
    temperature = 0;
    humidity = 0;
  }
  
  // Get WiFi signal strength
  int rssi = WiFi.RSSI();
  
  // Get uptime in seconds
  unsigned long uptime = millis() / 1000;
  
  // Create JSON payload
  String jsonPayload = createJsonPayload(
    temperature, 
    humidity, 
    gasValue, 
    rssi, 
    uptime
  );
  
  // Publish to MQTT
  if (mqttClient.publish(MQTT_TOPIC, jsonPayload.c_str())) {
    Serial.println("\n[PUBLISH] Data sent successfully!");
    Serial.println(jsonPayload);
  } else {
    Serial.println("[ERROR] Failed to publish data!");
  }
}

// ============== CREATE JSON PAYLOAD ==============
String createJsonPayload(float temp, float hum, int gas, int rssi, unsigned long uptime) {
  // Manual JSON creation (no external library needed)
  String json = "{";
  json += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  json += "\"location\":\"" + String(DEVICE_LOCATION) + "\",";
  json += "\"temperature\":" + String(temp, 2) + ",";
  json += "\"humidity\":" + String(hum, 2) + ",";
  json += "\"gas_level\":" + String(gas) + ",";
  json += "\"rssi\":" + String(rssi) + ",";
  json += "\"uptime\":" + String(uptime) + ",";
  json += "\"timestamp\":" + String(millis());
  json += "}";
  
  return json;
}

// ============== HELPER FUNCTIONS ==============
void blinkLED(int times, int delayMs) {
  pinMode(LED_BUILTIN, OUTPUT);
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_BUILTIN, LOW);   // LED ON (active low)
    delay(delayMs);
    digitalWrite(LED_BUILTIN, HIGH);  // LED OFF
    delay(delayMs);
  }
}

/*
 * ============================================================
 * MQTT State Codes (for debugging):
 * -4 : MQTT_CONNECTION_TIMEOUT
 * -3 : MQTT_CONNECTION_LOST
 * -2 : MQTT_CONNECT_FAILED
 * -1 : MQTT_DISCONNECTED
 *  0 : MQTT_CONNECTED
 *  1 : MQTT_CONNECT_BAD_PROTOCOL
 *  2 : MQTT_CONNECT_BAD_CLIENT_ID
 *  3 : MQTT_CONNECT_UNAVAILABLE
 *  4 : MQTT_CONNECT_BAD_CREDENTIALS
 *  5 : MQTT_CONNECT_UNAUTHORIZED
 * ============================================================
 */
